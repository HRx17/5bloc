'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Logo } from '@/components/brand/LogoMark'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden font-body dot-grid"
      style={{ background: 'var(--surface-canvas)' }}
    >
      <motion.div
        className="w-full max-w-[400px] relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium mb-8 transition-colors"
          style={{ color: 'var(--stone)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--on-surface)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--stone)')}
        >
          ← Back to sign in
        </Link>

        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--surface-container)',
            boxShadow: 'inset 0 0 0 1px var(--hairline), var(--shadow-3)',
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <Logo size={40} showTagline={false} color="var(--on-surface)" />
            <p
              className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.16em]"
              style={{ color: 'var(--stone)' }}
            >
              Reset password
            </p>
          </div>

          {submitted ? (
            <div className="space-y-4 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'rgba(46,204,138,0.12)' }}
              >
                <span className="material-icons-outlined text-[24px]" style={{ color: 'var(--success)' }}>
                  mark_email_read
                </span>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold" style={{ color: 'var(--on-surface)' }}>
                  Check your email
                </h3>
                <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--stone)' }}>
                  We sent a reset link to{' '}
                  <span className="font-medium" style={{ color: 'var(--on-surface)' }}>{email}</span>.
                </p>
              </div>
              <Link href="/login" className="btn-primary w-full py-3">
                Return to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-[13px] text-center leading-relaxed" style={{ color: 'var(--stone)' }}>
                Enter your email and we&apos;ll send a secure link to reset your password.
              </p>

              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--stone)' }}>
                  Email address
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

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
