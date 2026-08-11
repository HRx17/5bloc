import React from 'react'
import Link from 'next/link'

type EmptyStateProps = {
  icon?: string
  title: string
  description?: string
  /** Primary CTA — prefer `href` for navigation or `onClick` for actions. */
  actionLabel?: string
  href?: string
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}

/** Centered empty list state with optional CTA. */
export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  href,
  onClick,
  className = '',
  style,
}: EmptyStateProps) {
  const action =
    actionLabel && href ? (
      <Link href={href} className="btn-primary text-[12px] mt-4 inline-flex items-center gap-1.5">
        {actionLabel}
      </Link>
    ) : actionLabel && onClick ? (
      <button
        type="button"
        onClick={onClick}
        className="btn-primary text-[12px] mt-4 inline-flex items-center gap-1.5"
      >
        {actionLabel}
      </button>
    ) : null

  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-14 px-6 rounded-2xl ${className}`}
      style={{ background: 'var(--surface-container)', ...style }}
    >
      <span
        className="material-icons-outlined text-[48px] mb-3"
        style={{ color: 'var(--stone)', opacity: 0.35 }}
        aria-hidden
      >
        {icon}
      </span>
      <h3 className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>
        {title}
      </h3>
      {description ? (
        <p className="text-xs max-w-xs mt-1.5 leading-relaxed" style={{ color: 'var(--stone)' }}>
          {description}
        </p>
      ) : null}
      {action}
    </div>
  )
}

export default EmptyState
