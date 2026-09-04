import React, { useEffect, useState } from 'react'
import Link from '@/compat/next-link'
import { useRouter, useSearchParams } from '@/compat/next-navigation'
import { AuthShell } from '@/components/auth/AuthShell'
import { createClient } from '@/lib/supabase/client'
import { SELF_REGISTER_ROLES, ROLES, type RoleKey, isRoleKey } from '@/lib/rbac/roles'
import { hasSupabaseEnv, isMockAuthEnabled } from '@/lib/rbac/mock'
import { sendConfirmEmail } from '@/lib/auth/send-confirm-email'
import { analytics } from '@/lib/analytics/stub'

export default function Signup() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite_token')
  const orgInviteToken = searchParams.get('org_invite')
  const prefillEmail = searchParams.get('email') || ''
  const prefillRole = (searchParams.get('role') as RoleKey) || 'architect'
  const inviteRole = inviteToken && isRoleKey(prefillRole) ? prefillRole : null
  const supabaseConfigured = hasSupabaseEnv() && !isMockAuthEnabled()

  const [formData, setFormData] = useState({
    name: '',
    email: prefillEmail,
    password: '',
    role: (inviteRole ||
      (SELF_REGISTER_ROLES.includes(prefillRole) ? prefillRole : 'architect')) as RoleKey,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState('')
  const [awaitingEmail, setAwaitingEmail] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendNote, setResendNote] = useState('')

  useEffect(() => {
    if (prefillEmail) setFormData((p) => ({ ...p, email: prefillEmail }))
    if (inviteRole) {
      setFormData((p) => ({ ...p, role: inviteRole }))
    } else if (prefillRole && SELF_REGISTER_ROLES.includes(prefillRole)) {
      setFormData((p) => ({ ...p, role: prefillRole }))
    }
  }, [prefillEmail, prefillRole, inviteRole])

  const onboardingQuery = () => {
    const qs = new URLSearchParams({ role: formData.role })
    if (inviteToken) qs.set('invite_token', inviteToken)
    if (orgInviteToken) qs.set('org_invite', orgInviteToken)
    return qs.toString()
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
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(`/onboarding?${onboardingQuery()}`)}`,
        },
      })
      if (oauthError) throw oauthError
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed')
      setOauthLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      setLoading(false)
      return
    }

    try {
      if (isMockAuthEnabled()) {
        localStorage.setItem(
          '5bloc_mock_user',
          JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            invite_token: inviteToken,
          })
        )
        const qs = new URLSearchParams({ role: formData.role })
        if (inviteToken) qs.set('invite_token', inviteToken)
        if (orgInviteToken) qs.set('org_invite', orgInviteToken)
        const onboardingUrl = `/onboarding?${qs.toString()}`
        router.push(onboardingUrl)
        return
      }

      const supabase = createClient()
      const { data: signData, error: signError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/onboarding?${onboardingQuery()}`)}`,
          data: {
            full_name: formData.name,
            role: formData.role,
            invite_token: inviteToken,
            org_invite: orgInviteToken,
          },
        },
      })
      if (signError) throw signError

      // When email confirmation is required, Supabase returns a user but no session.
      // Only a session proves this is a completed signup — do not identify on data.user alone.
      if (!signData.session) {
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/onboarding?${onboardingQuery()}`)}`
        await sendConfirmEmail(formData.email, redirectTo).catch(() => null)
        setAwaitingEmail(true)
        return
      }

      if (signData.user) {
        analytics.setIdentity(
          signData.user.id,
          { email: signData.user.email, name: formData.name },
          { signup_date: signData.user.created_at },
        )
        analytics.trackEvent('signup_completed')
      }

      router.push(`/onboarding?${onboardingQuery()}`)
    } catch (err: any) {
      setError(err?.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resendConfirmation = async () => {
    if (resending) return
    setResending(true)
    setResendNote('')
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/onboarding?${onboardingQuery()}`)}`
      const sent = await sendConfirmEmail(formData.email, redirectTo)
      if (!sent.ok) {
        const supabase = createClient()
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: formData.email,
          options: { emailRedirectTo: redirectTo },
        })
        if (resendError) throw resendError
      }
      setResendNote(`Sent again to ${formData.email}. Check spam and promotions.`)
    } catch (err: any) {
      setResendNote(
        err?.message ||
          'Could not resend. Wait a minute and try again, or contact support@5bloc.com.'
      )
    } finally {
      setResending(false)
    }
  }

  if (awaitingEmail) {
    return (
      <AuthShell title="Check your email">
        <div className="space-y-4 text-center">
          <span
            className="material-icons-outlined text-[40px]"
            style={{ color: 'var(--amber)' }}
            aria-hidden
          >
            mark_email_unread
          </span>
          <p className="text-sm" style={{ color: 'var(--on-surface)' }}>
            We sent a confirmation link to{' '}
            <span className="font-semibold">{formData.email}</span>.
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--stone)' }}>
            Open that email and click the link to finish creating your workspace. Check spam if you
            do not see it within a minute.
          </p>
          {resendNote && (
            <p className="text-[12px]" style={{ color: 'var(--amber)' }}>
              {resendNote}
            </p>
          )}
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" className="btn-primary text-[13px]">
              Go to sign in
            </Link>
            <button
              type="button"
              className="btn-secondary text-[13px]"
              disabled={resending}
              onClick={resendConfirmation}
            >
              {resending ? 'Sending…' : 'Resend confirmation email'}
            </button>
            <button
              type="button"
              className="btn-secondary text-[13px]"
              onClick={() => setAwaitingEmail(false)}
            >
              Use a different email
            </button>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Create an account">
      {error && (
        <div className="mb-4 p-3 bg-error/10 text-error text-xs font-semibold flex items-center gap-2 rounded-xl">
          <span className="material-icons-outlined text-[16px]">error</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-stone text-xs font-semibold uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-5bloc"
            placeholder="e.g. Parth Patel"
          />
        </div>

        <div>
          <label className="block text-stone text-xs font-semibold uppercase tracking-wider mb-1.5">
            Email
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input-5bloc"
            placeholder="you@firm.com"
          />
        </div>

        <div>
          <label className="block text-stone text-xs font-semibold uppercase tracking-wider mb-1.5">
            I am a…
          </label>
          {inviteToken ? (
            <div
              className="px-3 py-3 rounded-xl text-[12px]"
              style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--amber-text)' }}
            >
              <div className="font-semibold">
                {isRoleKey(formData.role) ? ROLES[formData.role].label : formData.role}
              </div>
              <div className="text-[10px] mt-1 opacity-80">Set by your project invitation</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {SELF_REGISTER_ROLES.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: key })}
                    className="px-3 py-3 text-left text-[12px] rounded-xl transition"
                    style={{
                      background:
                        formData.role === key ? 'rgba(245,166,35,0.12)' : 'var(--surface-container-high)',
                      color: formData.role === key ? 'var(--amber-text)' : 'var(--stone)',
                      boxShadow:
                        formData.role === key
                          ? 'inset 0 0 0 1px var(--amber)'
                          : 'inset 0 0 0 1px var(--hairline)',
                    }}
                  >
                    <div className="font-semibold">{ROLES[key].shortLabel}</div>
                    <div className="text-[10px] mt-1 opacity-80">{ROLES[key].tagline.slice(0, 48)}</div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] mt-2" style={{ color: 'var(--stone)' }}>
                Builders, consultants and clients join via project invite.
              </p>
            </>
          )}
        </div>

        <div>
          <label className="block text-stone text-xs font-semibold uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-5bloc pr-10"
              placeholder="Minimum 8 characters"
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

        <button type="submit" disabled={loading || oauthLoading} className="btn-primary w-full mt-2">
          {loading ? 'Creating account…' : 'Continue'}
        </button>
      </form>

      {supabaseConfigured && (
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

      <p className="text-center text-[12px] mt-6" style={{ color: 'var(--stone)' }}>
        Already have an account?{' '}
        <Link href="/login" className="text-amber font-semibold">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
