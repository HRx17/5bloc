'use client'

import Link from 'next/link'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-12 text-center">
      <span
        className="material-symbols-outlined mb-4 text-[40px]"
        style={{ color: 'var(--amber)' }}
        aria-hidden
      >
        error_outline
      </span>
      <h1 className="font-display text-[22px] leading-tight" style={{ color: 'var(--on-surface)' }}>
        This page failed to load
      </h1>
      <p className="mt-2 max-w-sm text-[14px]" style={{ color: 'var(--on-surface-variant)' }}>
        Your session is fine — only this view hit an error. Retry or return to the dashboard.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-[11px]" style={{ color: 'var(--stone)' }}>
          Ref {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl px-4 py-2 text-[13px] font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'var(--amber)', color: 'var(--ink-on-amber)' }}
        >
          Retry
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl px-4 py-2 text-[13px] font-medium"
          style={{
            color: 'var(--on-surface)',
            border: '1px solid var(--hairline)',
            background: 'var(--surface)',
          }}
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}
