'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, AlertCircle, Check, Info, ArrowLeft, ArrowRight } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { USER_ROLES, type UserRole } from '@/lib/roles'

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
  const [step, setStep]         = useState<1 | 2>(1)
  const [role, setRole]         = useState<UserRole>('architect')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)

  const selectedRole = USER_ROLES.find((r) => r.id === role)!

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim())        return setError('Please enter your full name.')
    if (!email.trim())       return setError('Please enter your email address.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')

    setLoading(true)
    try {
      if (!SUPABASE_CONFIGURED) {
        localStorage.setItem('5bloc_signup_role', role)
        await new Promise((r) => setTimeout(r, 600))
        router.push('/onboarding')
        return
      }

      const supabase = createSupabaseClient()
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: name.trim(), role },
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
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    if (!SUPABASE_CONFIGURED) {
      localStorage.setItem('5bloc_signup_role', role)
      router.push('/onboarding')
      return
    }
    const supabase = createSupabaseClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/onboarding`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    await supabase.auth.updateUser({ data: { role } })
  }

  const pwStrong = password.length >= 8

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden font-body"
      style={{ background: 'var(--surface-canvas)' }}
    >
      <motion.div
        className="w-full max-w-[480px] relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium mb-6"
          style={{ color: 'var(--stone)' }}
        >
          ← Back to site
        </Link>

        <div
          className="rounded-2xl p-7 sm:p-8"
          style={{
            background: 'var(--surface-container)',
            boxShadow: 'inset 0 0 0 1px var(--hairline), var(--shadow-2)',
          }}
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <LogoMark size={36} />
            <span className="font-mono text-[15px] font-bold tracking-widest mt-2" style={{ color: 'var(--on-surface)' }}>
              5BLOC
            </span>
            <p className="mt-1 text-[12px]" style={{ color: 'var(--stone)' }}>
              {step === 1 ? 'Choose how you\'ll use 5BLOC' : `Create your ${selectedRole.label} account`}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full transition-colors"
                style={{ background: step >= s ? 'var(--amber)' : 'var(--hairline-strong)' }}
              />
            ))}
          </div>

          {!SUPABASE_CONFIGURED && (
            <div
              className="mb-5 flex items-start gap-2.5 rounded-xl px-4 py-3 text-[12px]"
              style={{ background: 'rgba(122,184,255,0.08)', color: 'var(--blue)', boxShadow: 'inset 0 0 0 1px rgba(122,184,255,0.15)' }}
            >
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span><strong>Demo mode</strong> — accounts are not persisted until Supabase is connected.</span>
            </div>
          )}

          {done ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(46,204,138,0.12)' }}>
                <Check className="h-6 w-6" style={{ color: 'var(--success)' }} />
              </div>
              <div>
                <p className="font-semibold text-[15px]" style={{ color: 'var(--on-surface)' }}>Check your inbox</p>
                <p className="mt-1 text-[13px]" style={{ color: 'var(--stone)' }}>
                  We sent a confirmation link to <strong>{email}</strong>.
                </p>
              </div>
              <Link href="/login" className="btn-secondary btn-sm">Back to sign in</Link>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                  <div className="grid grid-cols-1 gap-2.5">
                    {USER_ROLES.map((r) => {
                      const selected = role === r.id
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className="flex items-start gap-3 p-3.5 rounded-xl text-left transition-all"
                          style={{
                            background: selected ? 'rgba(245,166,35,0.08)' : 'var(--surface-container-low)',
                            boxShadow: selected
                              ? `inset 0 0 0 1.5px ${r.color}`
                              : 'inset 0 0 0 1px var(--hairline)',
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `${r.color}18`, color: r.color }}
                          >
                            <span className="material-icons-outlined text-[18px]">{r.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold" style={{ color: 'var(--on-surface)' }}>{r.label}</p>
                            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--stone)' }}>{r.signupDesc}</p>
                          </div>
                          {selected && (
                            <span className="material-icons-outlined text-[16px] ml-auto shrink-0" style={{ color: r.color }}>
                              check_circle
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <button type="button" onClick={() => setStep(2)} className="btn-primary w-full mt-5">
                    Continue as {selectedRole.label}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="mt-4 text-center text-[12px]" style={{ color: 'var(--stone)' }}>
                    Already have an account?{' '}
                    <Link href="/login" className="font-semibold" style={{ color: 'var(--amber)' }}>Sign in</Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-[12px] mb-4"
                    style={{ color: 'var(--stone)' }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Change role
                  </button>

                  {error && (
                    <div
                      className="mb-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-[12px]"
                      style={{ background: 'rgba(255,138,128,0.10)', color: 'var(--error)', boxShadow: 'inset 0 0 0 1px rgba(255,138,128,0.18)' }}
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                      <label className="label-sm block mb-1.5" style={{ color: 'var(--stone)' }}>Full name</label>
                      <input type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="input-5bloc" placeholder="Your name" />
                    </div>
                    <div>
                      <label className="label-sm block mb-1.5" style={{ color: 'var(--stone)' }}>Email</label>
                      <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-5bloc" placeholder="you@company.com" />
                    </div>
                    <div>
                      <label className="label-sm block mb-1.5" style={{ color: 'var(--stone)' }}>Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="input-5bloc pr-10"
                          placeholder="Minimum 8 characters"
                        />
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--stone)' }} tabIndex={-1}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {password.length > 0 && (
                        <p className="text-[11px] mt-1" style={{ color: pwStrong ? 'var(--success)' : 'var(--stone)' }}>
                          {pwStrong ? 'Password strength: good' : 'Use at least 8 characters'}
                        </p>
                      )}
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
                      {loading ? 'Creating account…' : 'Create account'}
                    </button>
                  </form>

                  <div className="my-5 flex items-center gap-3">
                    <div className="ghost-cut flex-1" />
                    <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--stone)' }}>or</span>
                    <div className="ghost-cut flex-1" />
                  </div>

                  <button type="button" onClick={handleGoogle} className="btn-secondary w-full flex items-center justify-center gap-2">
                    Continue with Google
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  )
}
