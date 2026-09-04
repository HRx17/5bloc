import React from 'react'
import { Skeleton } from './Skeleton'

type Layout = 'cards' | 'list' | 'detail' | 'board'

type PageSkeletonProps = {
  /** Shape of the content below the header. */
  layout?: Layout
  /** Number of placeholder blocks. Sensible per-layout default when omitted. */
  count?: number
  /** Render the title/subtitle block. Off for segments that keep their own header. */
  header?: boolean
  /** Render the filter/search bar placeholder. */
  toolbar?: boolean
  className?: string
}

const DEFAULT_COUNT: Record<Layout, number> = { cards: 6, list: 5, detail: 3, board: 4 }

/**
 * Route-level loading placeholder matching the standard page container
 * (`p-6 md:p-8 max-w-6xl mx-auto space-y-6`) so nothing shifts when data lands.
 */
export function PageSkeleton({
  layout = 'cards',
  count,
  header = true,
  toolbar = false,
  className = '',
}: PageSkeletonProps) {
  const blocks = count ?? DEFAULT_COUNT[layout]

  return (
    <div className={`p-6 md:p-8 max-w-6xl mx-auto space-y-6 ${className}`} aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      {header ? (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      ) : null}

      {toolbar ? <Skeleton className="h-10 w-full max-w-md rounded-xl" /> : null}

      {layout === 'cards' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: blocks }, (_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : null}

      {layout === 'list' ? (
        <div className="space-y-3">
          {Array.from({ length: blocks }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : null}

      {layout === 'board' ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: blocks }, (_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : null}

      {layout === 'detail' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 w-full" />
            {Array.from({ length: blocks }, (_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default PageSkeleton
