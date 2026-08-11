'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#f2f2f7',
          color: '#1d1d1f',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', color: '#8a5a00' }}>
            5BLOC
          </p>
          <h1 style={{ margin: 0, fontSize: 24 }}>Something went wrong</h1>
          <p style={{ margin: '12px 0 0', fontSize: 14, color: '#6e6e73' }}>
            A critical error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              border: 'none',
              borderRadius: 12,
              padding: '10px 20px',
              background: '#f5a623',
              color: '#1d1d1f',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
