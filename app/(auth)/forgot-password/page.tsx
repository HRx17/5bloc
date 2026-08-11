'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/AuthShell'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseEnv, isMockAuthEnabled } from '@/lib/rbac/mock'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isMockAuthEnabled()) {
        setSubmitted(true)
        return
      }
      if (!hasSupabaseEnv()) {
        setError('Password reset is not configured (missing Supabase env).')
        return
      }
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/login`,
      })
      if (resetError) {
        setError(resetError.message)
        return
      }
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.message || 'Could not send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Reset password">
      {submitted ? (
        <div className="space-y-4 text-center">
          <div
            className="w-12 h-12 text-success flex items-center justify-center mx-auto mb-2 rounded-full"
            style={{ background: 'rgba(46,204,138,0.12)' }}
          >
            <span className="material-icons-outlined text-[24px]">mark_email_read</span>
          </div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--on-surface)' }}>
            Check your email
          </h3>
          <p className="text-xs text-stone leading-relaxed">
            If an account exists for <span className="font-medium" style={{ color: 'var(--on-surface)' }}>{email}</span>, we sent a
            password reset link. Check your inbox and follow the instructions.
          </p>
          <div className="pt-4">
            <Link href="/login" className="btn-primary w-full py-2.5">
              Return to login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-stone text-center leading-relaxed">
            Enter your email address and we will send you a secure link to reset your password.
          </p>

          <div>
            <label className="block text-stone text-xs font-semibold uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="architect@firm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-5bloc"
            />
          </div>

          {error ? <p className="text-xs text-error">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary mt-2 py-3"
          >
            {loading ? 'Sending reset link…' : 'Send reset link'}
          </button>

          <div className="text-center pt-2">
            <Link href="/login" className="text-xs text-stone hover:text-amber transition-colors">
              ← Back to login
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  )
}
