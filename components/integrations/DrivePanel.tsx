'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface DriveFile {
  id:           string
  name:         string
  mimeType:     string
  modifiedTime: string
  size:         string
  webViewLink:  string
}

// Google Workspace editable types — can be embedded for in-app editing
const EDITABLE_TYPES: Record<string, { icon: string; color: string; label: string; embedPath: string }> = {
  'application/vnd.google-apps.document':     { icon: 'description', color: '#4285F4', label: 'Doc',   embedPath: 'document' },
  'application/vnd.google-apps.spreadsheet':  { icon: 'table_chart', color: '#0F9D58', label: 'Sheet', embedPath: 'spreadsheets' },
  'application/vnd.google-apps.presentation': { icon: 'slideshow',   color: '#F4B400', label: 'Slides',embedPath: 'presentation' },
}

const MIME_ICON: Record<string, { icon: string; color: string }> = {
  'application/vnd.google-apps.folder':       { icon: 'folder',          color: 'var(--amber)'   },
  'application/vnd.google-apps.document':     { icon: 'description',     color: '#4285F4'        },
  'application/vnd.google-apps.spreadsheet':  { icon: 'table_chart',     color: '#0F9D58'        },
  'application/vnd.google-apps.presentation': { icon: 'slideshow',       color: '#F4B400'        },
  'application/pdf':                          { icon: 'picture_as_pdf',  color: 'var(--error)'   },
  'image/':                                   { icon: 'image',           color: 'var(--purple)'  },
  'default':                                  { icon: 'insert_drive_file',color: 'var(--stone)'  },
}

function getMimeIcon(mimeType: string) {
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
  if (n < 1024)         return `${n} B`
  if (n < 1024 * 1024)  return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function relDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' })
}

/** Build the in-app edit embed URL for Google Workspace files */
function buildEmbedUrl(file: DriveFile): string | null {
  const editable = EDITABLE_TYPES[file.mimeType]
  if (!editable) return null
  // Extract fileId from webViewLink e.g. https://docs.google.com/document/d/FILE_ID/edit
  const match = file.webViewLink.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (!match) return null
  const fileId = match[1]
  return `https://docs.google.com/${editable.embedPath}/d/${fileId}/edit?embedded=true&rm=minimal`
}

// ── Embedded editor modal ─────────────────────────────────────────────────────

function GoogleEditorModal({ file, onClose }: { file: DriveFile; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const embedUrl = buildEmbedUrl(file)
  const editable = EDITABLE_TYPES[file.mimeType]

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 shrink-0"
        style={{ background: 'var(--surface-2)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="material-icons-outlined text-[18px]" style={{ color: editable?.color }}>
            {editable?.icon ?? 'insert_drive_file'}
          </span>
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--on-surface)' }}>
            {file.name}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0"
            style={{ background: `${editable?.color}20`, color: editable?.color }}>
            {editable?.label}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Changes auto-save badge */}
          <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--success)' }}>
            <span className="material-icons-outlined text-[13px]">cloud_done</span>
            Auto-saves to Drive
          </span>
          <a href={file.webViewLink} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--on-surface)' }}>
            <span className="material-icons-outlined text-[13px]">open_in_new</span>
            Open in Google
          </a>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--stone)' }}>
            <span className="material-icons-outlined text-[20px]">close</span>
          </button>
        </div>
      </div>

      {/* Editor iframe */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
            style={{ background: 'var(--surface-1)' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin mb-3"
              style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: editable?.color ?? 'var(--amber)' }} />
            <p className="text-xs" style={{ color: 'var(--stone)' }}>Loading {editable?.label ?? 'file'}…</p>
          </div>
        )}
        <iframe
          src={embedUrl ?? file.webViewLink}
          className="w-full h-full"
          style={{ border: 'none', background: '#fff' }}
          onLoad={() => setLoading(false)}
          title={file.name}
          allow="clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
        />
      </div>
    </motion.div>
  )
}

// ── Drive Panel ───────────────────────────────────────────────────────────────

export function DrivePanel({ className = '' }: { className?: string }) {
  const [files, setFiles]               = useState<DriveFile[]>([])
  const [loading, setLoading]           = useState(true)
  const [notConnected, setNotConnected] = useState(false)
  const [search, setSearch]             = useState('')
  const [view, setView]                 = useState<'grid' | 'list'>('list')
  const [openFile, setOpenFile]         = useState<DriveFile | null>(null)

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

  const handleFileClick = (f: DriveFile) => {
    if (EDITABLE_TYPES[f.mimeType]) {
      setOpenFile(f) // open in embedded editor
    } else {
      window.open(f.webViewLink, '_blank', 'noreferrer')
    }
  }

  if (notConnected) {
    return (
      <div className={`flex flex-col items-center justify-center py-10 text-center ${className}`}>
        <span className="material-icons-outlined text-[32px] mb-3" style={{ color: 'var(--stone)' }}>cloud_queue</span>
        <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>Google Drive not connected</p>
        <p className="text-xs mt-1 mb-4" style={{ color: 'var(--stone)' }}>Connect to browse and edit your project files</p>
        <Link href="/integrations" className="btn-primary py-2 px-4 text-xs rounded-lg">Connect Google</Link>
      </div>
    )
  }

  return (
    <>
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

        {/* Legend */}
        <p className="text-[10px] mb-2 flex items-center gap-1" style={{ color: 'var(--stone)' }}>
          <span className="material-icons-outlined text-[11px]" style={{ color: '#4285F4' }}>edit</span>
          Docs, Sheets &amp; Slides open in-app — edits save automatically to Drive
        </p>

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
                const { icon, color } = getMimeIcon(f.mimeType)
                const isEditable = !!EDITABLE_TYPES[f.mimeType]
                return (
                  <button key={f.id} onClick={() => handleFileClick(f)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all text-center hover:bg-white/5 group"
                    style={{ border: `1px solid ${isEditable ? 'rgba(66,133,244,0.12)' : 'rgba(255,255,255,0.05)'}` }}>
                    <span className="material-icons-outlined text-[28px]" style={{ color }}>{icon}</span>
                    <span className="text-[11px] font-medium leading-tight line-clamp-2 w-full"
                      style={{ color: 'var(--on-surface)' }}>{f.name}</span>
                    {isEditable ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: `${color}20`, color }}>
                        Click to edit
                      </span>
                    ) : (
                      <span className="text-[10px]" style={{ color: 'var(--stone)' }}>{formatSize(f.size)}</span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-1">
              {files.map(f => {
                const { icon, color } = getMimeIcon(f.mimeType)
                const isEditable = !!EDITABLE_TYPES[f.mimeType]
                const editable   = EDITABLE_TYPES[f.mimeType]
                return (
                  <button key={f.id} onClick={() => handleFileClick(f)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:bg-white/5 group"
                    style={{ border: '1px solid transparent' }}>
                    <span className="material-icons-outlined text-[20px] shrink-0" style={{ color }}>{icon}</span>
                    <span className="flex-1 text-xs font-medium truncate" style={{ color: 'var(--on-surface)' }}>{f.name}</span>
                    {isEditable && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: `${editable.color}15`, color: editable.color }}>
                        Edit in-app
                      </span>
                    )}
                    <span className="text-[10px] shrink-0" style={{ color: 'var(--stone)' }}>{relDate(f.modifiedTime)}</span>
                    <span className="text-[10px] shrink-0 w-14 text-right" style={{ color: 'var(--stone)' }}>{formatSize(f.size)}</span>
                    <span className="material-icons-outlined text-[14px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: isEditable ? color : 'var(--stone)' }}>
                      {isEditable ? 'edit' : 'open_in_new'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen editor modal */}
      <AnimatePresence>
        {openFile && (
          <GoogleEditorModal key={openFile.id} file={openFile} onClose={() => setOpenFile(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
