'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { reportError } from '@/lib/observability/reportError'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    void reportError(error, { digest: error.digest, boundary: 'app/error' })
  }, [error])

  return (
    <div
      className="flex min-h-full flex-col items-center justify-center px-6 py-16 text-center"
      style={{ background: 'var(--surface-canvas)', color: 'var(--on-surface)' }}
    >
      <p
        className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: 'var(--amber-text)' }}
      >
        5Bloc
      </p>
      <h1 className="font-display text-[28px] leading-tight sm:text-[32px]">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-[15px]" style={{ color: 'var(--on-surface-variant)' }}>
        We hit an unexpected error. Try again, or head back to your workspace.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-[11px]" style={{ color: 'var(--stone)' }}>
          Ref {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl px-5 py-2.5 text-[14px] font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'var(--amber)', color: 'var(--ink-on-amber)' }}
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl px-5 py-2.5 text-[14px] font-medium transition-colors"
          style={{
            color: 'var(--on-surface)',
            border: '1px solid var(--hairline)',
            background: 'var(--surface)',
          }}
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
