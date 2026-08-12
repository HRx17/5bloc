'use client'

/**
 * Portal visitors are clients of the architect, not 5Bloc users — they have no
 * dashboard to fall back to, so this only offers a retry.
 */
export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-body" style={{ background: '#F7F5F0' }}>
      <div className="max-w-md text-center" role="alert">
        <h1 className="text-2xl font-semibold" style={{ color: '#0C1220' }}>
          Something went wrong
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#6B7485' }}>
          This page hit an unexpected error. Your project and any approvals you have already given are
          unaffected.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-[11px]" style={{ color: '#9E9687' }}>
            Ref {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-6 px-4 py-2 text-[13px] font-semibold rounded-lg"
          style={{ background: '#F5A623', color: '#0C1220' }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
