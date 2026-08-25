import type { ReactNode } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/brand/LogoMark'
import { UnlockLandingScroll } from '@/components/site/UnlockLandingScroll'
import '@/app/landing.css'

/** Light cream legal/doc chrome — matches https://5bloc.com marketing surface */
export function LegalDocShell({
  title,
  updated,
  description,
  children,
}: {
  title: string
  updated?: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="landing-apple min-h-screen">
      <UnlockLandingScroll />
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'var(--lp-nav-bg-scrolled)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '1px solid var(--lp-border)',
        }}
      >
        <div className="mx-auto flex h-11 max-w-4xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="opacity-90 hover:opacity-100 transition-opacity">
            <Logo size={22} color="var(--lp-text)" />
          </Link>
          <Link href="/" className="lp-link text-[14px]">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 sm:px-6 py-14 sm:py-16">
        <h1 className="lp-section-title text-[clamp(1.75rem,4vw,2.5rem)]">{title}</h1>
        {description ? (
          <p className="lp-subhead mt-4 max-w-2xl text-[18px]">{description}</p>
        ) : null}
        {updated ? (
          <p className="mt-2 mb-10 text-[13px]" style={{ color: 'var(--lp-text-tertiary)' }}>
            Last updated: {updated}
          </p>
        ) : (
          <div className="mb-10" />
        )}
        <div
          className="space-y-10 text-[15px] leading-relaxed legal-prose"
          style={{ color: 'var(--lp-text-secondary)' }}
        >
          {children}
        </div>
      </main>
    </div>
  )
}
