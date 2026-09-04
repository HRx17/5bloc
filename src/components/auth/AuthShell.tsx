import React from 'react'
import Link from '@/compat/next-link'
import { Logo } from '@/components/brand/LogoMark'

/** Light cream auth frame — matches https://5bloc.com marketing surface */
export function AuthShell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden font-body"
      style={{ background: 'var(--surface-canvas, #fbfbfd)', color: 'var(--on-surface)' }}
    >
      <div className="absolute inset-0 opacity-[0.12] pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#f5a623_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div
        className="w-full max-w-md relative z-10 p-8 sm:p-10"
        style={{
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-2)',
          borderRadius: 16,
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="opacity-90 hover:opacity-100 transition-opacity">
            <Logo size={44} showTagline={true} />
          </Link>
          <h2
            className="text-xs mt-4 uppercase tracking-[0.12em] font-semibold"
            style={{ color: 'var(--stone)' }}
          >
            {title}
          </h2>
        </div>
        {children}
      </div>
    </div>
  )
}
