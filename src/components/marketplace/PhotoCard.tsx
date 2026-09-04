import React, { useEffect, useState } from 'react'
import Link from '@/compat/next-link'

export function CoverImage({
  src,
  alt,
  fallback,
  className,
}: {
  src: string
  alt: string
  fallback?: string
  className?: string
}) {
  const [current, setCurrent] = useState(src)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setCurrent(src)
    setFailed(false)
  }, [src])

  if (failed && !fallback) {
    return (
      <div
        className={className}
        style={{
          background:
            'linear-gradient(145deg, rgba(245,166,35,0.28) 0%, rgba(26,28,28,0.92) 55%, #141616 100%)',
        }}
        aria-hidden
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={failed && fallback ? fallback : current}
      alt={alt}
      className={className}
      onError={() => {
        if (fallback && current !== fallback) {
          setCurrent(fallback)
          return
        }
        setFailed(true)
      }}
    />
  )
}

type PhotoCardProps = {
  href?: string
  cover: string
  alt: string
  overlay?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function PhotoCard({ href, cover, alt, overlay, children, className = '' }: PhotoCardProps) {
  const inner = (
    <>
      <div className="relative aspect-16/10 overflow-hidden">
        <CoverImage
          src={cover}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(8,9,9,0.72) 0%, rgba(8,9,9,0.18) 42%, rgba(8,9,9,0.04) 100%)',
          }}
        />
        {overlay && <div className="absolute inset-x-3 top-3 z-1 flex items-start justify-between gap-2">{overlay}</div>}
      </div>
      <div className="flex flex-1 flex-col p-4">{children}</div>
    </>
  )

  const shell =
    'group flex flex-col overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-0.5 ' +
    className

  const style: React.CSSProperties = {
    background: 'var(--surface-container)',
    boxShadow: 'var(--shadow-2)',
  }

  if (href) {
    return (
      <Link href={href} className={shell} style={style}>
        {inner}
      </Link>
    )
  }

  return (
    <div className={shell} style={style}>
      {inner}
    </div>
  )
}

export function CardBadge({
  children,
  tone = 'stone',
}: {
  children: React.ReactNode
  tone?: 'stone' | 'amber' | 'success' | 'dark'
}) {
  const color =
    tone === 'amber'
      ? 'var(--amber)'
      : tone === 'success'
        ? 'var(--success)'
        : tone === 'dark'
          ? '#fff'
          : 'var(--stone)'
  const background =
    tone === 'dark'
      ? 'rgba(8,9,9,0.62)'
      : tone === 'amber'
        ? 'rgba(245,166,35,0.92)'
        : tone === 'success'
          ? 'rgba(46,204,138,0.92)'
          : 'rgba(8,9,9,0.55)'
  return (
    <span
      className="chip text-[10px] backdrop-blur-sm"
      style={{
        color: tone === 'amber' || tone === 'success' ? '#1d1d1f' : color,
        background,
        border: 'none',
      }}
    >
      {children}
    </span>
  )
}

export function PhotoCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--surface-container)' }}>
      <div className="aspect-16/10 animate-pulse" style={{ background: 'var(--surface-container-high)' }} />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/5 rounded animate-pulse" style={{ background: 'var(--surface-container-high)' }} />
        <div className="h-3 w-2/5 rounded animate-pulse" style={{ background: 'var(--surface-container-high)' }} />
        <div className="h-3 w-full rounded animate-pulse" style={{ background: 'var(--surface-container-high)' }} />
      </div>
    </div>
  )
}
