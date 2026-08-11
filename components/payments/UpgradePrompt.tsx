'use client'

import Link from 'next/link'

type UpgradePromptProps = {
  title?: string
  message?: string
  ctaLabel?: string
  href?: string
  className?: string
}

export function UpgradePrompt({
  title = 'Upgrade to unlock',
  message = 'This feature is available on Solo, Team, or with the AI add-on. Upgrade your plan to continue.',
  ctaLabel = 'View billing plans',
  href = '/settings?tab=billing',
  className = '',
}: UpgradePromptProps) {
  return (
    <div className={`card-5bloc p-6 space-y-4 ${className}`.trim()}>
      <div className="flex items-start gap-3">
        <span
          className="material-icons-outlined text-[28px] shrink-0"
          style={{ color: 'var(--amber)' }}
        >
          lock
        </span>
        <div className="space-y-2 min-w-0">
          <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
            {title}
          </h3>
          <p className="text-xs text-stone leading-relaxed">{message}</p>
        </div>
      </div>
      <div>
        <Link href={href} className="btn-primary inline-flex items-center gap-1.5">
          <span className="material-icons-outlined text-[16px]">workspace_premium</span>
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}

export default UpgradePrompt
