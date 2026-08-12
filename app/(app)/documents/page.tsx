'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { DrivePanel } from '@/components/integrations/DrivePanel'
import { StatCard } from '@/components/ui/StatCard'
import { supabaseClient } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/data/client-data'

const PHASE_LABELS: Record<string, string> = {
  pre_design: 'Pre-Design',
  schematic_design: 'Schematic Design',
  design_development: 'Design Development',
  construction_docs: 'Construction Docs',
  bidding: 'Construction Docs',
  permits: 'Construction Docs',
  construction_admin: 'Construction',
  complete: 'Construction',
}

function docTypeFromName(name: string, fileType?: string | null): Document['type'] {
  const n = (name || '').toLowerCase()
  const t = (fileType || '').toLowerCase()
  if (n.endsWith('.dwg') || t === 'dwg') return 'dwg'
  if (n.endsWith('.pdf') || t === 'pdf') return 'pdf'
  if (n.endsWith('.xlsx') || n.endsWith('.xls') || t.includes('sheet') || t === 'xlsx') return 'xlsx'
  if (n.endsWith('.docx') || n.endsWith('.doc') || t.includes('word') || t === 'docx') return 'docx'
  return 'image'
}

interface Document {
  id: string
  name: string
  type: 'dwg' | 'pdf' | 'docx' | 'xlsx' | 'image'
  project: string
  project_id: string
  phase: string
  version: string
  uploaded_by: string
  uploaded_at: string
  size_kb: number
  status: 'approved' | 'pending' | 'revision' | 'draft'
}

const TYPE_META: Record<string, { icon: string; color: string; bg: string }> = {
  dwg:   { icon: 'architecture', color: 'var(--amber)',   bg: 'rgba(245,166,35,.10)' },
  pdf:   { icon: 'picture_as_pdf', color: 'var(--error)', bg: 'rgba(255,138,128,.10)' },
  docx:  { icon: 'description',   color: 'var(--blue)',   bg: 'rgba(122,184,255,.10)' },
  xlsx:  { icon: 'table_chart',   color: 'var(--success)',bg: 'rgba(46,204,138,.10)'  },
  image: { icon: 'image',         color: 'var(--purple)', bg: 'rgba(167,139,250,.10)' },
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: 'Approved',         color: 'var(--success)', bg: 'rgba(46,204,138,.10)'  },
  pending:  { label: 'Pending Review',   color: 'var(--amber)',   bg: 'rgba(245,166,35,.10)'  },
  revision: { label: 'Needs Revision',   color: 'var(--error)',   bg: 'rgba(255,138,128,.10)' },
  draft:    { label: 'Draft',            color: 'var(--stone)',   bg: 'rgba(138,128,120,.10)' },
}

const PHASES = ['All Phases', 'Pre-Design', 'Schematic Design', 'Design Development', 'Construction Docs', 'Construction']

function FileIcon({ type }: { type: string }) {
  const m = TYPE_META[type] ?? TYPE_META.pdf
  return (
    <div
      className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0"
      style={{ background: m.bg, color: m.color }}
    >
      <span className="material-icons-outlined text-[17px]">{m.icon}</span>
    </div>
  )
}

export default function DocumentVault() {
  const [docs,       setDocs]       = useState<Document[]>([])
  const [loading,    setLoading]    = useState(true)
  const [loadError,  setLoadError]  = useState<unknown>(null)
  const [search,     setSearch]     = useState('')
  const [project,    setProject]    = useState('All Projects')
  const [phase,      setPhase]      = useState('All Phases')
  const [status,     setStatus]     = useState<string>('all')
  const [view,       setView]       = useState<'grid' | 'list'>('list')
  const [uploading,  setUploading]  = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      if (!hasSupabaseEnv()) throw new Error('The document vault is not configured in this environment.')
      const { data, error } = await supabaseClient
        .from('documents')
        .select('*, projects(name)')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message || 'Could not load the document vault')
      setDocs(
        (data || []).map((d: any) => {
          const projName = (d as { projects?: { name?: string } | null }).projects?.name ?? 'General'
          const phaseKey = d.phase ?? ''
          return {
            id: d.id,
            name: d.original_filename,
            type: docTypeFromName(d.original_filename, d.file_type),
            project: projName,
            project_id: d.project_id ?? '',
            phase: PHASE_LABELS[phaseKey] ?? 'General',
            version: 'v1',
            uploaded_by: 'Team',
            uploaded_at: (d.created_at ?? '').split('T')[0],
            size_kb: Math.round(Number(d.file_size ?? 0) / 1024),
            status: (['approved', 'pending', 'revision', 'draft'].includes(d.status) ? d.status : 'draft') as Document['status'],
          }
        })
      )
    } catch (err) {
      setLoadError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('phase', phase !== 'All Phases' ? phase : 'General')
      const res = await fetch('/api/files/upload', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || 'Upload failed', 'error')
        return
      }
      toast(`${file.name} uploaded successfully`, 'success')
      await load()
    } catch {
      toast('Upload failed. Check your connection.', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const filtered = docs.filter((d) => {
    if (project !== 'All Projects' && d.project !== project) return false
    if (phase !== 'All Phases' && d.phase !== phase) return false
    if (status !== 'all' && d.status !== status) return false
    if (search) {
      const q = search.toLowerCase()
      return d.name.toLowerCase().includes(q) || d.project.toLowerCase().includes(q) || d.uploaded_by.toLowerCase().includes(q)
    }
    return true
  })

  const statsPending = loading || !!loadError

  const projectOptions = useMemo(
    () => ['All Projects', ...Array.from(new Set(docs.map((d) => d.project).filter(Boolean))).sort()],
    [docs]
  )

  const filtersActive = project !== 'All Projects' || phase !== 'All Phases' || status !== 'all' || !!search.trim()

  const clearFilters = () => {
    setProject('All Projects')
    setPhase('All Phases')
    setStatus('all')
    setSearch('')
  }

  const formatSize = (kb: number) =>
    kb >= 1000 ? `${(kb / 1000).toFixed(1)} MB` : `${kb} KB`

  return (
    <div className="p-5 lg:p-7 max-w-[1240px] mx-auto space-y-6">

      {/* ── Header ── */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <p className="text-[12px] mb-1" style={{ color: 'var(--stone)' }}>All projects</p>
          <h1 className="font-display text-[22px] lg:text-[26px] leading-tight" style={{ color: 'var(--on-surface)' }}>
            Document Vault
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--on-surface-variant)' }}>
            Every drawing, report and file — across all projects. One searchable archive.
          </p>
        </div>
        <button
          className="btn-primary shrink-0 text-[13px]"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <span className="material-icons-outlined text-[15px] animate-spin">refresh</span>
          ) : (
            <span className="material-icons-outlined text-[15px]">upload_file</span>
          )}
          {uploading ? 'Uploading…' : 'Upload document'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.dwg,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
          onChange={handleUpload}
        />
      </motion.div>

      {/* ── Stats (click to filter) ── */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
      >
        <StatCard
          variant="filter"
          label="Total files"
          value={statsPending ? '—' : docs.length}
          icon="folder_open"
          color="var(--amber)"
          active={status === 'all'}
          onClick={() => setStatus('all')}
        />
        <StatCard
          variant="filter"
          label="Pending review"
          value={statsPending ? '—' : docs.filter(d => d.status === 'pending').length}
          icon="schedule"
          color="var(--amber)"
          active={status === 'pending'}
          onClick={() => setStatus('pending')}
        />
        <StatCard
          variant="filter"
          label="Needs revision"
          value={statsPending ? '—' : docs.filter(d => d.status === 'revision').length}
          icon="edit"
          color="var(--error)"
          active={status === 'revision'}
          onClick={() => setStatus('revision')}
        />
        <StatCard
          variant="filter"
          label="Approved"
          value={statsPending ? '—' : docs.filter(d => d.status === 'approved').length}
          icon="verified"
          color="var(--success)"
          active={status === 'approved'}
          onClick={() => setStatus('approved')}
        />
      </motion.div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="search-5bloc flex-1 min-w-[200px] max-w-[280px]">
          <span className="material-icons-outlined">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
          />
        </div>

        <div className="select-5bloc">
          <select value={project} onChange={(e) => setProject(e.target.value)}>
            {projectOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <span className="material-icons-outlined chevron">expand_more</span>
        </div>

        <div className="select-5bloc">
          <select value={phase} onChange={(e) => setPhase(e.target.value)}>
            {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <span className="material-icons-outlined chevron">expand_more</span>
        </div>

        {/* Status filter chips */}
        <div className="flex gap-1.5">
          {(['all', 'pending', 'revision', 'approved', 'draft'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className="px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-all capitalize"
              style={{
                background: status === s ? 'var(--surface-container-high)' : 'transparent',
                color: status === s ? 'var(--on-surface)' : 'var(--stone)',
                boxShadow: status === s ? 'inset 0 0 0 1px rgba(255,255,255,0.08)' : 'none',
              }}
            >
              {s === 'all' ? 'All' : STATUS_META[s].label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-xl p-1" style={{ background: 'var(--surface-container)' }}>
          {(['list', 'grid'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="h-7 w-7 flex items-center justify-center rounded-lg transition-all"
              style={{ background: view === v ? 'var(--surface-container-high)' : 'transparent', color: view === v ? 'var(--on-surface)' : 'var(--stone)' }}
            >
              <span className="material-icons-outlined text-[15px]">{v === 'list' ? 'view_list' : 'grid_view'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Document list / grid ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {loading ? (
            <div className="space-y-2">
              {[0,1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : loadError ? (
            <ErrorState
              title="Could not load the document vault"
              description="Nothing has been deleted — we could not read your files. Retry, or open the documents tab inside a project."
              error={loadError}
              onRetry={load}
            />
          ) : filtered.length === 0 ? (
            filtersActive ? (
              <EmptyState
                icon="filter_alt_off"
                title="No documents match these filters"
                description="There are documents in the vault, just none in this project, phase or status combination."
                actionLabel="Clear filters"
                onClick={clearFilters}
              />
            ) : (
              <EmptyState
                icon="folder_open"
                title="The vault is empty"
                description="Every drawing, report and file your team uploads to a project lands here automatically. Upload one now to start the archive."
                actionLabel="Upload document"
                onClick={() => fileInputRef.current?.click()}
              />
            )
          ) : view === 'list' ? (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--surface-container)' }}
            >
              <table className="w-full text-[13px]">
                <thead>
                  <tr style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.04)' }}>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--stone)' }}>Document</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--stone)' }}>Project</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--stone)' }}>Phase</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--stone)' }}>Uploaded</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--stone)' }}>Status</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc, idx) => (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.03 }}
                      className="transition-colors cursor-pointer"
                      style={idx > 0 ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' } : {}}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <FileIcon type={doc.type} />
                          <div className="min-w-0">
                            <p className="font-medium line-clamp-1" style={{ color: 'var(--on-surface)' }}>{doc.name}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--stone)' }}>
                              {doc.version} · {formatSize(doc.size_kb)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell" style={{ color: 'var(--on-surface-variant)' }}>
                        <span className="line-clamp-1">{doc.project}</span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-[11.5px]" style={{ color: 'var(--stone)' }}>{doc.phase}</td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <p className="text-[11.5px]" style={{ color: 'var(--stone)' }}>{doc.uploaded_by}</p>
                        <p className="font-mono text-[10px]" style={{ color: 'var(--stone)', opacity: 0.5 }}>{doc.uploaded_at}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: STATUS_META[doc.status].bg, color: STATUS_META[doc.status].color }}
                        >
                          {STATUS_META[doc.status].label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/projects/${doc.project_id}/documents`}
                          className="flex items-center gap-1 text-[11px] font-medium transition-colors"
                          style={{ color: 'var(--stone)' }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--amber)')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--stone)')}
                        >
                          <span className="material-icons-outlined text-[13px]">open_in_new</span>
                          View
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid view */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((doc, idx) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  whileHover={{ y: -2 }}
                >
                  <Link
                    href={`/projects/${doc.project_id}/documents`}
                    className="block rounded-2xl p-4 transition-all"
                    style={{ background: 'var(--surface-container)' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-amber)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}
                  >
                    <FileIcon type={doc.type} />
                    <p className="mt-3 text-[13px] font-semibold line-clamp-2" style={{ color: 'var(--on-surface)' }}>{doc.name}</p>
                    <p className="text-[11px] mt-1 line-clamp-1" style={{ color: 'var(--stone)' }}>{doc.project}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-mono text-[10px]" style={{ color: 'var(--stone)', opacity: 0.6 }}>{doc.version}</span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: STATUS_META[doc.status].bg, color: STATUS_META[doc.status].color }}
                      >
                        {STATUS_META[doc.status].label}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Google Drive Panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="rounded-2xl p-5"
        style={{ background: 'var(--surface-container)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(66,133,244,0.12)', color: '#4285F4' }}>
            <span className="material-icons-outlined text-[18px]">cloud_queue</span>
          </div>
          <div>
            <h3 className="text-[13px] font-bold" style={{ color: 'var(--on-surface)' }}>Google Drive</h3>
            <p className="text-[11px]" style={{ color: 'var(--stone)' }}>Project folder vault — link once, browse everything inside</p>
          </div>
        </div>
        <DrivePanel className="h-[400px]" />
      </motion.div>
    </div>
  )
}
