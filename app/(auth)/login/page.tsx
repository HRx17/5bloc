'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { DEMO_ROLE_HINTS, isLocalDemoEnabled, parseDemoRole } from '@/lib/auth/local-demo'
import { LogoMark } from '@/components/brand/LogoMark'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const localDemo = isLocalDemoEnabled()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)

    const username = email.trim()
    const demoRole = localDemo ? parseDemoRole(username) : null

    // Local shortcut: type a role name (vendor, contractor, client…) — no password
    if (demoRole) {
      try {
        const res = await fetch('/api/auth/demo-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(typeof data.error === 'string' ? data.error : 'Demo login failed')
          setLoading(false)
          return
        }
        localStorage.setItem('5bloc_demo_role', demoRole)
        router.push('/dashboard')
        router.refresh()
      } catch {
        setError('Demo login failed')
        setLoading(false)
      }
      return
    }

    try {
      const supabase = createSupabaseClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      })
      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }
      localStorage.removeItem('5bloc_demo_role')
      router.push('/dashboard')
      router.refresh()
    } catch {
      // Fallback when Supabase env is missing: classic demo email
      if (username === 'demo@5bloc.com' && password === 'demo1234') {
        localStorage.setItem('5bloc_demo_role', 'architect')
        setInfo('Signed in with local demo credentials.')
        router.push('/dashboard')
        return
      }
      setError(
        localDemo
          ? 'Supabase is not configured. Type a role name (vendor, contractor, client…) with no password.'
          : 'Unable to reach authentication service. Check your connection and try again.',
      )
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-[#0A0A08] flex-col justify-between p-12">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-60 h-60 rounded-full bg-warm/10 blur-[100px]" />

        <Link href="/" className="relative flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="font-display text-xl tracking-tight text-white">
            5bloc<span className="text-accent">.</span>
          </span>
        </Link>

        <div className="relative space-y-6">
          <h1 className="font-display text-4xl text-white leading-tight tracking-tight">
            The operating system
            <br />
            <span className="text-white/40">for construction.</span>
          </h1>
          <p className="text-sm text-white/40 leading-relaxed max-w-sm">
            Projects, partners, RFQs, and payments — one workspace for every stakeholder on the job.
          </p>
          <div className="flex items-center gap-6 pt-2">
            {[
              { n: '12+', l: 'Countries' },
              { n: '4.2k', l: 'Projects' },
              { n: '98%', l: 'On-time' },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-display text-2xl text-white">{s.n}</p>
                <p className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-white/20">© 2026 5bloc Inc.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-canvas">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <LogoMark size={24} />
            <span className="font-display text-lg tracking-tight text-ink">
              5bloc<span className="text-accent">.</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-2xl text-ink tracking-tight">Welcome back</h2>
            <p className="text-sm text-stone mt-1.5">Sign in to your workspace</p>
          </div>

          {localDemo && (
            <div className="mb-5 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3 text-[12px] text-ink/80 leading-relaxed">
              <p className="font-medium text-ink mb-1">Local demo login</p>
              <p className="text-stone">
                Type a role as the username — <span className="text-ink">no password needed</span>:
              </p>
              <p className="mt-1.5 font-mono text-[11px] text-ink">
                {DEMO_ROLE_HINTS.map((h) => h.split(' ')[0]).join(' · ')}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[11px] font-medium uppercase tracking-wider text-stone mb-1.5">
                {localDemo ? 'Email or role' : 'Email'}
              </label>
              <input
                id="email"
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={localDemo ? 'vendor' : 'you@company.com'}
                className="w-full h-11 px-3.5 rounded-xl border border-rule bg-white text-sm text-ink placeholder:text-stone/50 focus:outline-none focus:border-ink/30 focus:ring-2 focus:ring-ink/5 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-[11px] font-medium uppercase tracking-wider text-stone">
                  Password {localDemo && <span className="normal-case tracking-normal text-stone/60">(optional for roles)</span>}
                </label>
                <Link href="/forgot-password" className="text-[11px] text-stone hover:text-ink transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required={!localDemo || !parseDemoRole(email.trim())}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={localDemo ? 'leave blank for role login' : '••••••••'}
                  className="w-full h-11 px-3.5 pr-11 rounded-xl border border-rule bg-white text-sm text-ink placeholder:text-stone/50 focus:outline-none focus:border-ink/30 focus:ring-2 focus:ring-ink/5 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  aria-pressed={showPw}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone/50 hover:text-stone transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
                >
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M2 2l12 12M6.5 6.5a2.5 2.5 0 003 3M3.2 3.2C2 4.2 1.2 5.5 1 6.5c.5 2.5 3.5 5.5 7 5.5 1.2 0 2.3-.3 3.3-.8M8.8 4.1A6.5 6.5 0 0115 6.5c-.3 1.2-1 2.3-1.9 3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2 px-3.5 py-3 rounded-xl bg-red-50 border border-red-100 text-[12px] text-red-700">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0" aria-hidden="true">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}
            {info && !error && (
              <div role="status" className="flex items-start gap-2 px-3.5 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-[12px] text-emerald-800">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-ink text-white text-sm font-medium hover:bg-ink/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 12"/>
                  </svg>
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-stone mt-8">
            No account?{' '}
            <Link href="/signup" className="text-ink font-medium hover:underline underline-offset-2">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
