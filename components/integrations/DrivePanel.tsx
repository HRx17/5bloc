'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useGooglePicker } from './useGooglePicker'

interface DriveFile {
  id:           string
  name:         string
  mimeType:     string
  modifiedTime: string
  size:         string
  webViewLink:  string
}

const FOLDER_MIME = 'application/vnd.google-apps.folder'

type LinkedRoot = { id: string; name: string }
type Crumb = { id: string | null; name: string }
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
  const [roots, setRoots]               = useState<LinkedRoot[]>([])
  const [loading, setLoading]           = useState(true)
  const [notConnected, setNotConnected] = useState(false)
  const [search, setSearch]             = useState('')
  const [linked, setLinked]             = useState({ files: 0, folders: 0 })
  const [view, setView]                 = useState<'grid' | 'list'>('list')
  const [openFile, setOpenFile]         = useState<DriveFile | null>(null)
  const [linking, setLinking]           = useState(false)
  const [breadcrumbs, setBreadcrumbs]   = useState<Crumb[]>([{ id: null, name: 'Vault' }])

  const currentFolderId = breadcrumbs[breadcrumbs.length - 1]?.id ?? null

  const fetchFiles = useCallback(async (q = '', folderId: string | null = null) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (folderId) params.set('folderId', folderId)
      const res  = await fetch(`/api/integrations/google/drive?${params}`)
      const data = await res.json()
      if (data.notConnected) { setNotConnected(true); return }
      setFiles(data.files ?? [])
      setRoots(data.roots ?? [])
      if (data.linked) setLinked(data.linked)
    } finally {
      setLoading(false)
    }
  }, [])

  const linkPickedFiles = useCallback(async (picks: { id: string; name: string; mimeType: string }[]) => {
    setLinking(true)
    try {
      const res = await fetch('/api/integrations/google/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ picks }),
      })
      const data = await res.json()
      if (res.ok) {
        setFiles(data.files ?? [])
        setRoots(data.roots ?? [])
        if (data.linked) setLinked(data.linked)
        setBreadcrumbs([{ id: null, name: 'Vault' }])
      }
    } finally {
      setLinking(false)
    }
  }, [])

  const { openPicker: openFolderPicker, opening: folderPickerOpening, ready: pickerReady } =
    useGooglePicker(linkPickedFiles, { foldersOnly: true })
  const { openPicker: openFilePicker, opening: filePickerOpening } =
    useGooglePicker(linkPickedFiles)

  useEffect(() => {
    fetchFiles('', currentFolderId)
  }, [fetchFiles, currentFolderId])

  const navigateTo = (crumbIndex: number) => {
    const next = breadcrumbs.slice(0, crumbIndex + 1)
    setBreadcrumbs(next)
  }

  const openFolder = (folder: DriveFile | LinkedRoot) => {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }])
  }

  const handleItemClick = (f: DriveFile) => {
    if (f.mimeType === FOLDER_MIME) {
      openFolder(f)
      return
    }
    if (EDITABLE_TYPES[f.mimeType]) {
      setOpenFile(f)
    } else {
      window.open(f.webViewLink, '_blank', 'noreferrer')
    }
  }

  const pickerBusy = folderPickerOpening || filePickerOpening || linking
  const hasVault = linked.folders > 0 || linked.files > 0

  if (notConnected) {
    return (
      <div className={`flex flex-col items-center justify-center py-10 text-center ${className}`}>
        <span className="material-icons-outlined text-[32px] mb-3" style={{ color: 'var(--stone)' }}>cloud_queue</span>
        <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>Google Drive not connected</p>
        <p className="text-xs mt-1 mb-4" style={{ color: 'var(--stone)' }}>
          Connect Google, then link your project folder to browse it here.
        </p>
        <Link href="/integrations" className="btn-primary py-2 px-4 text-xs rounded-lg">Connect Google</Link>
      </div>
    )
  }

  return (
    <>
      <div className={`flex flex-col h-full ${className}`}>
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={openFolderPicker}
            disabled={!pickerReady || pickerBusy}
            className="btn-primary py-2 px-3 text-xs shrink-0 flex items-center gap-1.5"
          >
            <span className="material-icons-outlined text-[14px]">create_new_folder</span>
            {pickerBusy ? 'Linking…' : 'Link project folder'}
          </button>
          {hasVault && (
            <button
              type="button"
              onClick={openFilePicker}
              disabled={!pickerReady || pickerBusy}
              className="btn-secondary py-2 px-3 text-xs shrink-0 flex items-center gap-1.5"
            >
              <span className="material-icons-outlined text-[14px]">note_add</span>
              Add file
            </button>
          )}
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="material-icons-outlined text-[16px]" style={{ color: 'var(--stone)' }}>search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchFiles(search, currentFolderId)}
              placeholder={hasVault ? 'Search vault…' : 'Search after linking a folder'}
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
          <button onClick={() => fetchFiles(search, currentFolderId)}
            className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <span className="material-icons-outlined text-[16px]" style={{ color: 'var(--stone)' }}>refresh</span>
          </button>
        </div>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 1 && (
          <div className="flex items-center gap-1 mb-2 flex-wrap text-[11px]">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={`${crumb.id ?? 'root'}-${i}`}>
                {i > 0 && (
                  <span className="material-icons-outlined text-[12px]" style={{ color: 'var(--stone)', opacity: 0.5 }}>
                    chevron_right
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => navigateTo(i)}
                  className="px-1.5 py-0.5 rounded-md transition-colors hover:bg-white/5"
                  style={{
                    color: i === breadcrumbs.length - 1 ? 'var(--on-surface)' : 'var(--stone)',
                    fontWeight: i === breadcrumbs.length - 1 ? 500 : 400,
                  }}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Linked project folders (vault root) */}
        {!currentFolderId && roots.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wide mb-1.5" style={{ color: 'var(--stone)', opacity: 0.7 }}>
              Project folders
            </p>
            <div className="flex flex-wrap gap-2">
              {roots.map((root) => (
                <button
                  key={root.id}
                  type="button"
                  onClick={() => openFolder(root)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] transition-colors hover:bg-white/5"
                  style={{
                    background: 'rgba(245,166,35,0.08)',
                    color: 'var(--amber)',
                    boxShadow: 'inset 0 0 0 1px rgba(245,166,35,0.15)',
                  }}
                >
                  <span className="material-icons-outlined text-[14px]">folder</span>
                  {root.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <p className="text-[10px] mb-2 flex items-center gap-1 flex-wrap" style={{ color: 'var(--stone)' }}>
          <span className="material-icons-outlined text-[11px]" style={{ color: '#4285F4' }}>edit</span>
          Link a project folder once — then browse, search, and edit Docs/Sheets inside it.
          {hasVault && (
            <span className="ml-1 opacity-80">
              · {linked.folders} folder{linked.folders === 1 ? '' : 's'}{linked.files > 0 ? `, ${linked.files} file${linked.files === 1 ? '' : 's'}` : ''}
            </span>
          )}
        </p>

        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {loading ? (
            <div className={view === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-1'}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={`animate-pulse rounded-xl ${view === 'grid' ? 'h-20' : 'h-10'}`}
                  style={{ background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          ) : !hasVault ? (
            <div className="text-center py-10 px-4">
              <span className="material-icons-outlined text-[28px] mb-3 block" style={{ color: 'var(--stone)', opacity: 0.35 }}>
                folder_shared
              </span>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--on-surface)' }}>
                Set up your project vault
              </p>
              <p className="text-xs mb-4 max-w-[280px] mx-auto" style={{ color: 'var(--stone)' }}>
                Pick the Google Drive folder for this project. Everything inside becomes browsable here.
              </p>
              <button
                type="button"
                onClick={openFolderPicker}
                disabled={!pickerReady || pickerBusy}
                className="btn-primary py-2.5 px-5 text-xs inline-flex items-center gap-1.5"
              >
                <span className="material-icons-outlined text-[14px]">create_new_folder</span>
                Link project folder
              </button>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: 'var(--stone)' }}>
              No files in this folder{search ? ' matching your search' : ''}.
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-3 gap-2">
              {files.map(f => {
                const { icon, color } = getMimeIcon(f.mimeType)
                const isEditable = !!EDITABLE_TYPES[f.mimeType]
                return (
                  <button key={f.id} onClick={() => handleItemClick(f)}
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
                  <button key={f.id} onClick={() => handleItemClick(f)}
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
