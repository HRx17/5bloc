'use client'

import React, { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function ProjectSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams()
  const projectId = params?.id as string | undefined

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center text-center py-14 px-6 rounded-2xl"
      style={{ background: 'var(--surface-container)' }}
    >
      <span
        className="material-icons-outlined text-[48px] mb-3"
        style={{ color: 'var(--error)', opacity: 0.55 }}
        aria-hidden
      >
        error_outline
      </span>
      <h3 className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>
        This project section failed to open
      </h3>
      <p className="text-xs max-w-xs mt-1.5 leading-relaxed" style={{ color: 'var(--stone)' }}>
        The rest of the project is fine — only this tab hit an error. Retry, or switch to another tab.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-[11px]" style={{ color: 'var(--stone)' }}>
          Ref {error.digest}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={reset} className="btn-primary text-[12px] inline-flex items-center gap-1.5">
          <span className="material-icons-outlined text-[15px]" aria-hidden>
            refresh
          </span>
          Try again
        </button>
        <Link href={projectId ? `/projects/${projectId}` : '/projects'} className="btn-secondary text-[12px]">
          Project overview
        </Link>
      </div>
    </div>
  )
}
