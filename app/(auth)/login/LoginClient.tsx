'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthShell } from '@/components/auth/AuthShell'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseEnv, isMockAuthEnabled } from '@/lib/rbac/mock'
import { homeForRole, isRoleKey } from '@/lib/rbac/roles'
import {
  adminRoleAliasKeys,
  adminRoleLoginHint,
  resolveRoleAliasLogin,
  SMOKE_PASSWORD,
} from '@/lib/auth/local-dev-logins'

type LoginMode = 'standard' | 'admin'

export default function LoginClient({ mode = 'standard' }: { mode?: LoginMode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const inviteToken = searchParams.get('invite_token')
  const orgInviteToken = searchParams.get('org_invite')
  const roleParam = searchParams.get('role')
  const supabaseConfigured = hasSupabaseEnv() && !isMockAuthEnabled()
  const roleAliases = mode === 'admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState('')

  const withInviteQs = (path: string) => {
    const url = new URL(path, 'http://local')
    if (inviteToken) url.searchParams.set('invite_token', inviteToken)
    if (orgInviteToken) url.searchParams.set('org_invite', orgInviteToken)
    if (roleParam) url.searchParams.set('role', roleParam)
    return `${url.pathname}${url.search}`
  }

  const handleGoogle = async () => {
    if (!supabaseConfigured) return
    setOauthLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const origin = window.location.origin
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${origin}/api/auth/callback` },
      })
      if (oauthError) throw oauthError
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed')
      setOauthLoading(false)
    }
  }

  const signInAs = async (loginEmail: string, loginPassword: string) => {
    const supabase = createClient()
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })
    if (signError) throw signError

    if (inviteToken) {
      router.push(`/accept-invite?token=${encodeURIComponent(inviteToken)}`)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    let dest = next || '/dashboard'
    if (user && !next) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarded_at')
        .eq('auth_id', user.id)
        .maybeSingle()
      if (!profile?.onboarded_at || orgInviteToken) {
        dest = withInviteQs('/onboarding')
      } else if (isRoleKey(profile.role)) {
        dest = homeForRole(profile.role)
      }
    } else if (orgInviteToken && dest.startsWith('/')) {
      dest = withInviteQs(dest.includes('onboarding') ? dest : '/onboarding')
    }
    router.push(dest)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (roleAliases) {
        const alias = resolveRoleAliasLogin(email)
        if (alias?.kind === 'portal') {
          router.push(alias.path)
          return
        }
        if (alias?.kind === 'auth') {
          if (!supabaseConfigured) {
            throw new Error('Supabase is required for role logins (MOCK_AUTH must be off).')
          }
          try {
            await signInAs(alias.email, password.trim() || SMOKE_PASSWORD)
          } catch (err: any) {
            throw new Error(
              `${err?.message || 'Sign-in failed'} — smoke user may be missing (try ${alias.email}).`
            )
          }
          return
        }
      }

      if (isMockAuthEnabled()) {
        const roleGuess = email.includes('contractor') || email.includes('vendor')
          ? 'contractor'
          : email.includes('builder')
            ? 'builder'
            : email.includes('consultant')
              ? 'consultant'
              : email.includes('client')
                ? 'client'
                : 'architect'
        localStorage.setItem(
          '5bloc_mock_user',
          JSON.stringify({ email, role: roleGuess })
        )
        if (inviteToken) {
          router.push(`/accept-invite?token=${encodeURIComponent(inviteToken)}`)
          return
        }
        router.push(withInviteQs(next || homeForRole(roleGuess)))
        return
      }

      await signInAs(email, password)
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const aliasActive = roleAliases && !!resolveRoleAliasLogin(email)

  return (
    <AuthShell title={roleAliases ? 'Admin entry' : 'Welcome back'}>
      {error && (
        <div className="mb-4 p-3 bg-error/10 text-error text-xs font-semibold flex items-center gap-2 rounded-xl">
          <span className="material-icons-outlined text-[16px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {roleAliases && (
        <div
          className="mb-4 text-[11px] leading-relaxed rounded-xl px-3 py-2 space-y-2"
          style={{ color: 'var(--stone)', background: 'var(--surface-container-low)' }}
        >
          <p>{adminRoleLoginHint()}</p>
          <div className="flex flex-wrap gap-1.5">
            {adminRoleAliasKeys().map((key) => (
              <button
                key={key}
                type="button"
                className="chip text-[10px]"
                style={{ color: 'var(--amber)', background: 'rgba(245,166,35,0.12)' }}
                onClick={() => setEmail(key)}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-stone text-xs font-semibold uppercase tracking-wider mb-1.5">
            {roleAliases ? 'Email or role' : 'Email'}
          </label>
          <input
            type={roleAliases ? 'text' : 'email'}
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-5bloc"
            placeholder={roleAliases ? 'architect · vendor · you@firm.com' : 'you@firm.com'}
          />
        </div>
        <div>
          <label className="block text-stone text-xs font-semibold uppercase tracking-wider mb-1.5">
            Password{aliasActive ? ' (optional for role aliases)' : ''}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required={!aliasActive}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-5bloc pr-10"
              placeholder={aliasActive ? 'Leave blank for smoke password' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone"
            >
              <span className="material-icons-outlined text-[18px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>
        {!roleAliases && (
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-[12px] text-amber">
              Forgot password?
            </Link>
          </div>
        )}
        <button type="submit" disabled={loading || oauthLoading} className="btn-primary w-full">
          {loading ? 'Signing in…' : aliasActive ? 'Enter as test user' : 'Sign in'}
        </button>
      </form>

      {supabaseConfigured && !roleAliases && (
        <>
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--hairline)' }} />
            <span className="text-[10px] uppercase tracking-wider text-stone">or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--hairline)' }} />
          </div>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading || oauthLoading}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.5l6.3 5.3C39.9 36.2 44 30.7 44 24c0-1.2-.1-2.3-.4-3.5z" />
            </svg>
            {oauthLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>
        </>
      )}

      {!roleAliases && (
        <p className="text-center text-[12px] mt-6" style={{ color: 'var(--stone)' }}>
          New to 5Bloc?{' '}
          <Link href={withInviteQs('/signup')} className="text-amber font-semibold">
            Create account
          </Link>
        </p>
      )}

      {roleAliases && (
        <p className="text-center text-[12px] mt-6" style={{ color: 'var(--stone)' }}>
          Public login:{' '}
          <Link href="/login" className="text-amber font-semibold">
            /login
          </Link>
        </p>
      )}
    </AuthShell>
  )
}
