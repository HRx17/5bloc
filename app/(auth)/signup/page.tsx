'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, AlertCircle, Check, Info } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'

const SUPABASE_CONFIGURED =
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function LogoMark({ size = 28 }: { size?: number }) {
  const a = 'var(--amber)'
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="6" y="6"  width="28" height="5.5" rx="1.5" fill={a} />
      <rect x="6" y="15" width="22" height="5.5" rx="1.5" fill={a} opacity="0.72" />
      <rect x="6" y="24" width="16" height="5.5" rx="1.5" fill={a} opacity="0.44" />
      <rect x="6" y="33" width="10" height="4.5" rx="1.5" fill={a} opacity="0.22" />
    </svg>
  )
}

export default function Signup() {
  const router = useRouter()
  const [name,         setName]         = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [done,         setDone]         = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim())         return setError('Please enter your full name.')
    if (!email.trim())        return setError('Please enter your email address.')
    if (password.length < 8)  return setError('Password must be at least 8 characters.')

    setLoading(true)

    try {
      if (!SUPABASE_CONFIGURED) {
        /* ── Demo mode — accounts not persisted ── */
        await new Promise((r) => setTimeout(r, 700))
        router.push('/onboarding')
        return
      }

      const supabase = createSupabaseClient()
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: `${location.origin}/onboarding`,
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('An account with this email already exists. Sign in instead.')
        } else {
          setError(authError.message)
        }
        return
      }

      /* Supabase sends a confirmation email — show the "check inbox" state */
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    if (!SUPABASE_CONFIGURED) {
      setError('Google sign-up requires Supabase to be configured.')
      return
    }
    const supabase = createSupabaseClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/onboarding` },
    })
  }

  const pwStrong = password.length >= 8

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden font-body dot-grid"
      style={{ background: 'var(--surface-canvas)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(122,184,255,0.04) 0%, transparent 65%)' }}
        aria-hidden
      />

      <motion.div
        className="w-full max-w-[400px] relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium mb-8 transition-colors"
          style={{ color: 'var(--stone)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--on-surface)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--stone)')}
        >
          ← Back to site
        </Link>

        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--surface-container)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), var(--shadow-3)',
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <LogoMark size={40} />
            <div className="mt-3">
              <span
                className="font-mono text-[16px] font-bold tracking-widest"
                style={{ color: 'var(--on-surface)' }}
              >
                5BLOC
              </span>
            </div>
            <p
              className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em]"
              style={{ color: 'var(--stone)' }}
            >
              Create your workspace
            </p>
          </div>

          {/* Demo mode banner */}
          {!SUPABASE_CONFIGURED && (
            <div
              className="mb-5 flex items-start gap-2.5 rounded-xl px-4 py-3 text-[12.5px]"
              style={{
                background: 'rgba(122,184,255,0.08)',
                color: 'var(--blue)',
                boxShadow: 'inset 0 0 0 1px rgba(122,184,255,0.15)',
              }}
            >
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span><strong>Demo mode</strong> — accounts are not persisted. Connect Supabase to enable real sign-up.</span>
            </div>
          )}

          {/* Email verification sent state */}
          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-6 text-center"
            >
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(100,220,150,0.12)', boxShadow: 'inset 0 0 0 1px rgba(100,220,150,0.25)' }}
              >
                <Check className="h-7 w-7" style={{ color: 'var(--success)' }} />
              </div>
              <div>
                <p className="font-semibold text-[15px]" style={{ color: 'var(--on-surface)' }}>Check your inbox</p>
                <p className="mt-1 text-[13px]" style={{ color: 'var(--stone)' }}>
                  We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
                </p>
              </div>
              <Link href="/login" className="btn-secondary px-6 py-2 text-[13px]">Back to sign in</Link>
            </motion.div>
          ) : (
            <>
          {error && (
            <motion.div
              key={error}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-start gap-2.5 rounded-xl px-4 py-3 text-[13px]"
              style={{
                background: 'rgba(255,138,128,0.10)',
                color: 'var(--error)',
                boxShadow: 'inset 0 0 0 1px rgba(255,138,128,0.18)',
              }}
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-sm block mb-2" style={{ color: 'var(--stone)' }}>
                Full name
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                placeholder="Parth Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-5bloc"
              />
            </div>

            <div>
              <label className="label-sm block mb-2" style={{ color: 'var(--stone)' }}>
                Email address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="architect@firm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-5bloc"
              />
            </div>

            <div>
              <label className="label-sm block mb-2" style={{ color: 'var(--stone)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-5bloc pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--stone)' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5">
                  <div
                    className="h-1 flex-1 rounded-full transition-colors duration-300"
                    style={{ background: pwStrong ? 'var(--success)' : 'var(--stone)', opacity: pwStrong ? 1 : 0.3 }}
                  />
                  <div
                    className="h-1 flex-1 rounded-full transition-colors duration-300"
                    style={{ background: pwStrong ? 'var(--success)' : 'var(--surface-container-high)' }}
                  />
                  <span className="text-[11px]" style={{ color: pwStrong ? 'var(--success)' : 'var(--stone)' }}>
                    {pwStrong ? 'Strong' : 'Too short'}
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="block h-4 w-4 rounded-full"
                    style={{ border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'var(--ink-black)' }}
                  />
                  Creating account…
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="ghost-cut flex-1" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: 'var(--stone)' }}>
              or
            </span>
            <div className="ghost-cut flex-1" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="btn-secondary w-full flex items-center justify-center gap-2.5"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-[13px]" style={{ color: 'var(--stone)' }}>
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold transition-colors"
              style={{ color: 'var(--amber)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--amber-lt)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--amber)')}
            >
              Sign in →
            </Link>
          </p>
            </>
          )}
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex items-center justify-center gap-5">
          {['SOC 2 ready', 'Data in India', 'RERA compliant'].map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <Check className="h-3 w-3" style={{ color: 'var(--success)' }} />
              <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--stone)' }}>
                {t}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
