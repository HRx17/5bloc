import { useEffect, useState } from 'react'
import { isImageFilename, signedFileUrl } from '@/lib/messages/files'

export function ChatAttachment({
  fileKey,
  filename,
  compact,
}: {
  fileKey: string
  filename: string
  compact?: boolean
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const image = isImageFilename(filename)

  useEffect(() => {
    let cancelled = false
    setError(false)
    signedFileUrl(fileKey, filename, image)
      .then((u) => {
        if (!cancelled) setUrl(u)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [fileKey, filename, image])

  if (error) {
    return (
      <p className="text-[11px] mt-1" style={{ color: 'var(--stone)' }}>
        Could not load {filename}
      </p>
    )
  }

  if (image) {
    if (!url) {
      return (
        <div
          className="mt-1 rounded-lg"
          style={{ width: compact ? 160 : 220, height: 120, background: 'var(--surface-container-high)' }}
        />
      )
    }
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block mt-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={filename}
          className="rounded-lg max-h-56 object-cover"
          style={{ maxWidth: compact ? 180 : 240 }}
        />
      </a>
    )
  }

  return (
    <a
      href={url || '#'}
      onClick={(e) => {
        if (!url) e.preventDefault()
      }}
      target="_blank"
      rel="noreferrer"
      className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium"
      style={{
        background: 'rgba(245,166,35,0.12)',
        color: 'var(--amber-text, var(--amber))',
      }}
    >
      <span className="material-icons-outlined text-[16px]">attach_file</span>
      <span className="truncate max-w-[180px]">{filename}</span>
    </a>
  )
}
