import React from 'react'

/**
 * Suspense fallback for the auth screens, which read search params and so must
 * render on the client. Without this the user sees an empty coloured page.
 */
export function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div
        className="w-full max-w-md rounded-2xl p-8 space-y-5"
        style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-2)' }}
      >
        <div className="h-9 w-9 animate-pulse rounded-xl" style={{ background: 'var(--surface-container-high)' }} />
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse rounded" style={{ background: 'var(--surface-container-high)' }} />
          <div className="h-4 w-64 animate-pulse rounded" style={{ background: 'var(--surface-container-high)' }} />
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-11 w-full animate-pulse rounded-xl" style={{ background: 'var(--surface-container-high)' }} />
          <div className="h-11 w-full animate-pulse rounded-xl" style={{ background: 'var(--surface-container-high)' }} />
        </div>
        <div className="h-11 w-full animate-pulse rounded-xl" style={{ background: 'var(--surface-container-high)' }} />
      </div>
    </div>
  )
}

export default AuthSkeleton
