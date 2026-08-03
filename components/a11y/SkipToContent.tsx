'use client'

/**
 * Skip link + shared a11y helpers. Keep this tiny and always mounted in root layout.
 */
export function SkipToContent({ href = '#main-content' }: { href?: string }) {
  return (
    <a href={href} className="skip-link">
      Skip to main content
    </a>
  )
}
