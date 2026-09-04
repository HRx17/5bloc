import React from 'react'

type SkeletonProps = {
  className?: string
  style?: React.CSSProperties
  /** Number of stacked blocks (default 1). */
  lines?: number
}

/** Pulse placeholder block(s) using surface CSS variables. */
export function Skeleton({ className = '', style, lines = 1 }: SkeletonProps) {
  const count = Math.max(1, lines)
  if (count === 1) {
    return (
      <div
        className={`animate-pulse rounded-xl ${className}`}
        style={{
          background: 'var(--surface-container-high)',
          minHeight: 16,
          ...style,
        }}
        aria-hidden
      />
    )
  }

  return (
    <div className={`space-y-3 ${className}`} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl"
          style={{
            background: 'var(--surface-container-high)',
            height: i === count - 1 && count > 2 ? 12 : 16,
            width: i === count - 1 ? '72%' : '100%',
            ...style,
          }}
        />
      ))}
    </div>
  )
}

export default Skeleton
