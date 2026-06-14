'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface DriveFile {
  id:           string
  name:         string
  mimeType:     string
  modifiedTime: string
  size:         string
  webViewLink:  string
  iconLink?:    string
}

const MIME_ICON: Record<string, { icon: string; color: string }> = {
  'application/vnd.google-apps.folder':       { icon: 'folder', color: 'var(--amber)' },
  'application/vnd.google-apps.document':     { icon: 'description', color: 'var(--blue)' },
  'application/vnd.google-apps.spreadsheet':  { icon: 'table_chart', color: 'var(--success)' },
  'application/vnd.google-apps.presentation': { icon: 'slideshow', color: 'var(--purple)' },
  'application/pdf':                          { icon: 'picture_as_pdf', color: 'var(--error)' },
  'image/':                                   { icon: 'image', color: 'var(--purple)' },
  'application/acad':                         { icon: 'architecture', color: 'var(--amber)' },
  'default':                                  { icon: 'insert_drive_file', color: 'var(--stone)' },
}

function mimeIcon(mimeType: string) {
  if (MIME_ICON[mimeType]) return MIME_ICON[mimeType]
  for (const [key, val] of Object.entries(MIME_ICON)) {
    if (mimeType.startsWith(key)) return val
  }
  return MIME_ICON['default']
}

function formatSize(bytes?: string) {
  if (!bytes) return ''
  const n = parseInt(bytes)
  if (isNaN(n)) return ''
  if (n < 1024)        return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function relDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' })
}

export function DrivePanel({ className = '' }: { className?: string }) {
  const [files, setFiles]             = useState<DriveFile[]>([])
  const [loading, setLoading]         = useState(true)
  const [notConnected, setNotConnected] = useState(false)
  const [search, setSearch]           = useState('')
  const [view, setView]               = useState<'grid' | 'list'>('list')

  const fetchFiles = useCallback(async (q = '') => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/integrations/google/drive?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.notConnected) { setNotConnected(true); return }
      setFiles(data.files ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  if (notConnected) {
    return (
      <div className={`flex flex-col items-center justify-center py-10 text-center ${className}`}>
        <span className="material-icons-outlined text-[32px] mb-3" style={{ color: 'var(--stone)' }}>cloud_queue</span>
        <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>Google Drive not connected</p>
        <p className="text-xs mt-1 mb-4" style={{ color: 'var(--stone)' }}>Connect to browse your project files</p>
        <Link href="/integrations" className="btn-primary py-2 px-4 text-xs rounded-lg">Connect Google</Link>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="material-icons-outlined text-[16px]" style={{ color: 'var(--stone)' }}>search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchFiles(search)}
            placeholder="Search Drive…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--on-surface)' }}
          />
        </div>
        <button onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')}
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <span className="material-icons-outlined text-[16px]" style={{ color: 'var(--stone)' }}>
            {view === 'grid' ? 'view_list' : 'grid_view'}
          </span>
        </button>
        <button onClick={() => fetchFiles(search)}
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <span className="material-icons-outlined text-[16px]" style={{ color: 'var(--stone)' }}>refresh</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {loading ? (
          <div className={view === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-1'}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className={`animate-pulse rounded-xl ${view === 'grid' ? 'h-20' : 'h-10'}`}
                style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-10 text-sm" style={{ color: 'var(--stone)' }}>No files found</div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-3 gap-2">
            {files.map(f => {
              const { icon, color } = mimeIcon(f.mimeType)
              return (
                <a key={f.id} href={f.webViewLink} target="_blank" rel="noreferrer"
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-colors text-center hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="material-icons-outlined text-[28px]" style={{ color }}>{icon}</span>
                  <span className="text-[11px] font-medium leading-tight line-clamp-2 w-full"
                    style={{ color: 'var(--on-surface)' }}>{f.name}</span>
                  <span className="text-[10px]" style={{ color: 'var(--stone)' }}>{formatSize(f.size)}</span>
                </a>
              )
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {files.map(f => {
              const { icon, color } = mimeIcon(f.mimeType)
              return (
                <a key={f.id} href={f.webViewLink} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:bg-white/5"
                  style={{ border: '1px solid transparent' }}>
                  <span className="material-icons-outlined text-[20px] shrink-0" style={{ color }}>{icon}</span>
                  <span className="flex-1 text-xs font-medium truncate" style={{ color: 'var(--on-surface)' }}>{f.name}</span>
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--stone)' }}>{relDate(f.modifiedTime)}</span>
                  <span className="text-[10px] shrink-0 w-14 text-right" style={{ color: 'var(--stone)' }}>{formatSize(f.size)}</span>
                  <span className="material-icons-outlined text-[14px] shrink-0" style={{ color: 'var(--stone)' }}>open_in_new</span>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
