import Link from 'next/link'

/**
 * 404 for signed-in routes. Renders inside the app shell and links to
 * `/projects`, which every role can reach — unlike `/dashboard`.
 */
export default function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-12 text-center">
      <span
        className="material-icons-outlined mb-3 text-[48px]"
        style={{ color: 'var(--stone)', opacity: 0.35 }}
        aria-hidden
      >
        explore_off
      </span>
      <h1 className="font-display text-[24px] leading-tight" style={{ color: 'var(--on-surface)' }}>
        We couldn’t find that page
      </h1>
      <p className="mt-2 max-w-sm text-[14px]" style={{ color: 'var(--stone)' }}>
        It may have been moved or deleted, or you may not have access to it with your current role.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/projects" className="btn-primary text-[12px]">
          Go to projects
        </Link>
        <Link href="/settings" className="btn-secondary text-[12px]">
          Settings
        </Link>
      </div>
    </div>
  )
}
