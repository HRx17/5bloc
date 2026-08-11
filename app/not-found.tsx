import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center font-body"
      style={{ background: 'var(--surface-canvas, #0C1220)', color: 'var(--on-surface, #F7F5F0)' }}
    >
      <p
        className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: 'var(--amber-text, #F5A623)' }}
      >
        5Bloc
      </p>
      <h1 className="font-display text-[28px] leading-tight sm:text-[32px]">Page not found</h1>
      <p className="mt-3 max-w-md text-[15px]" style={{ color: 'var(--on-surface-variant, #9E9687)' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <p className="mt-2 font-mono text-[11px]" style={{ color: 'var(--stone, #9E9687)' }}>
        Error 404
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl px-5 py-2.5 text-[14px] font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'var(--amber, #F5A623)', color: 'var(--ink-on-amber, #0C1220)' }}
        >
          Go to dashboard
        </Link>
        <Link
          href="/"
          className="rounded-xl px-5 py-2.5 text-[14px] font-medium transition-colors"
          style={{
            color: 'var(--on-surface, #F7F5F0)',
            border: '1px solid var(--hairline, #1C2A3E)',
            background: 'var(--surface, #141E30)',
          }}
        >
          Home
        </Link>
      </div>
    </div>
  )
}
