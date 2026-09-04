import React from 'react'
import { motion } from 'framer-motion'
import { Logo } from '@/components/brand/LogoMark'

export function AuthLoadingScreen({
  message = 'Signing you in…',
  submessage = 'Setting up your workspace',
}: {
  message?: string
  submessage?: string
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 font-body dot-grid"
      style={{ background: 'var(--surface-canvas)' }}
    >
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(245,166,35,0.06) 0%, transparent 65%)' }}
        aria-hidden
      />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <Logo size={36} showTagline={false} />

        <div className="mt-8 flex items-center gap-3">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            className="block h-5 w-5 rounded-full"
            style={{ border: '2px solid var(--hairline-strong)', borderTopColor: 'var(--amber)' }}
          />
          <p className="text-[15px] font-medium" style={{ color: 'var(--on-surface)' }}>
            {message}
          </p>
        </div>

        <p className="mt-2 text-[12px]" style={{ color: 'var(--stone)' }}>
          {submessage}
        </p>
      </motion.div>
    </div>
  )
}
