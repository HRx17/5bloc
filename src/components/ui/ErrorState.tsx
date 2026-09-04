import React from 'react'

type ErrorStateProps = {
  /** Short headline. Defaults to a generic load failure. */
  title?: string
  /** Shown under the title. Falls back to the error message when one is given. */
  description?: string
  /** Raw error to surface a message from. Never rendered when `description` is set. */
  error?: unknown
  icon?: string
  retryLabel?: string
  onRetry?: () => void
  /** Tighter padding for use inside a card or a column. */
  compact?: boolean
  className?: string
  style?: React.CSSProperties
}

/** Network/permission messages are useful to a user; stack traces are not. */
function readableMessage(error: unknown): string | null {
  if (!error) return null
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : null
  if (!raw) return null
  const value = raw.trim()
  if (!value || value.length > 180) return null
  if (/^\s*[{[<]/.test(value)) return null
  if (/failed to fetch|networkerror|load failed/i.test(value)) {
    return 'Could not reach the server. Check your connection and try again.'
  }
  return value
}

/**
 * Inline failure state for a view whose data could not be loaded.
 *
 * For a crashed render use the route `error.tsx` boundary instead — this is for
 * a fetch that returned an error while the page itself is still fine.
 */
export function ErrorState({
  title = 'Could not load this',
  description,
  error,
  icon = 'error_outline',
  retryLabel = 'Try again',
  onRetry,
  compact = false,
  className = '',
  style,
}: ErrorStateProps) {
  const detail = description ?? readableMessage(error) ?? 'Something went wrong on our side. Try again in a moment.'

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center text-center rounded-2xl ${
        compact ? 'py-8 px-5' : 'py-14 px-6'
      } ${className}`}
      style={{ background: 'var(--surface-container)', ...style }}
    >
      <span
        className={`material-icons-outlined mb-3 ${compact ? 'text-[32px]' : 'text-[48px]'}`}
        style={{ color: 'var(--error)', opacity: 0.55 }}
        aria-hidden
      >
        {icon}
      </span>
      <h3 className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>
        {title}
      </h3>
      <p className="text-xs max-w-xs mt-1.5 leading-relaxed" style={{ color: 'var(--stone)' }}>
        {detail}
      </p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn-secondary btn-sm mt-4 inline-flex items-center gap-1.5">
          <span className="material-icons-outlined text-[15px]" aria-hidden>
            refresh
          </span>
          {retryLabel}
        </button>
      ) : null}
    </div>
  )
}

export default ErrorState
