'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'
import { DrivePanel } from '@/components/integrations/DrivePanel'
import { StatCard } from '@/components/ui/StatCard'

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
const PROJECTS = ['All Projects', 'Wadhwa Prime Plaza', 'Lodha Signature Residences', 'Gundecha Industrial Park']

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
  const [search,     setSearch]     = useState('')
  const [project,    setProject]    = useState('All Projects')
  const [phase,      setPhase]      = useState('All Phases')
  const [status,     setStatus]     = useState<string>('all')
  const [view,       setView]       = useState<'grid' | 'list'>('list')
  const [uploading,  setUploading]  = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

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
      // Optimistically add to list
      const newDoc: Document = {
        id: json.document?.id || `d-${Date.now()}`,
        name: file.name,
        type: (file.name.endsWith('.dwg') ? 'dwg' : file.type.includes('pdf') ? 'pdf' : file.type.includes('sheet') ? 'xlsx' : file.type.includes('word') ? 'docx' : 'image') as Document['type'],
        project: project !== 'All Projects' ? project : 'General',
        project_id: '',
        phase: phase !== 'All Phases' ? phase : 'General',
        version: 'v1',
        uploaded_by: 'You',
        uploaded_at: new Date().toISOString().split('T')[0],
        size_kb: Math.round(file.size / 1024),
        status: 'pending',
      }
      setDocs(prev => [newDoc, ...prev])
    } catch {
      toast('Upload failed. Check your connection.', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setDocs([
        { id: 'd1',  name: 'Ground Floor Plan — Rev 4',               type: 'dwg',   project: 'Wadhwa Prime Plaza',          project_id: 'proj-1', phase: 'Construction Docs',  version: 'v4', uploaded_by: 'Parth Patel',  uploaded_at: '2026-06-12', size_kb: 2400, status: 'approved' },
        { id: 'd2',  name: 'Structural Column Schedule',              type: 'dwg',   project: 'Wadhwa Prime Plaza',          project_id: 'proj-1', phase: 'Construction Docs',  version: 'v2', uploaded_by: 'Aritro Roy',   uploaded_at: '2026-06-11', size_kb: 1800, status: 'pending'  },
        { id: 'd3',  name: 'Project Brief — Lodha Signature',         type: 'docx',  project: 'Lodha Signature Residences',  project_id: 'proj-2', phase: 'Schematic Design',   version: 'v1', uploaded_by: 'Parth Patel',  uploaded_at: '2026-06-10', size_kb: 340,  status: 'approved' },
        { id: 'd4',  name: 'Schematic Design Presentation',           type: 'pdf',   project: 'Lodha Signature Residences',  project_id: 'proj-2', phase: 'Schematic Design',   version: 'v3', uploaded_by: 'Parth Patel',  uploaded_at: '2026-06-09', size_kb: 8700, status: 'approved' },
        { id: 'd5',  name: 'BOQ Estimate — Gundecha Industrial',      type: 'xlsx',  project: 'Gundecha Industrial Park',    project_id: 'proj-3', phase: 'Pre-Design',         version: 'v1', uploaded_by: 'Parth Patel',  uploaded_at: '2026-06-08', size_kb: 520,  status: 'draft'    },
        { id: 'd6',  name: 'Site Photo — Foundation Level',           type: 'image', project: 'Wadhwa Prime Plaza',          project_id: 'proj-1', phase: 'Construction Docs',  version: 'v1', uploaded_by: 'Suresh Nair',  uploaded_at: '2026-06-07', size_kb: 1200, status: 'approved' },
        { id: 'd7',  name: 'Electrical Load Schedule',                type: 'xlsx',  project: 'Wadhwa Prime Plaza',          project_id: 'proj-1', phase: 'Construction Docs',  version: 'v2', uploaded_by: 'Priya Mehta',  uploaded_at: '2026-06-06', size_kb: 410,  status: 'revision' },
        { id: 'd8',  name: 'MEP Coordination Drawing — Level 2',      type: 'dwg',   project: 'Lodha Signature Residences',  project_id: 'proj-2', phase: 'Design Development', version: 'v1', uploaded_by: 'Ravi Gupta',   uploaded_at: '2026-06-05', size_kb: 3100, status: 'pending'  },
        { id: 'd9',  name: 'Permit Application — MCGM',               type: 'pdf',   project: 'Wadhwa Prime Plaza',          project_id: 'proj-1', phase: 'Construction Docs',  version: 'v1', uploaded_by: 'Parth Patel',  uploaded_at: '2026-06-04', size_kb: 640,  status: 'pending'  },
        { id: 'd10', name: 'Detailed Project Report — Gundecha',      type: 'docx',  project: 'Gundecha Industrial Park',    project_id: 'proj-3', phase: 'Pre-Design',         version: 'v2', uploaded_by: 'Parth Patel',  uploaded_at: '2026-06-03', size_kb: 890,  status: 'draft'    },
        { id: 'd11', name: 'Landscape Layout Plan',                   type: 'dwg',   project: 'Lodha Signature Residences',  project_id: 'proj-2', phase: 'Design Development', version: 'v2', uploaded_by: 'Aritro Roy',   uploaded_at: '2026-06-02', size_kb: 1950, status: 'approved' },
        { id: 'd12', name: 'Fire Safety Compliance Checklist',        type: 'pdf',   project: 'Gundecha Industrial Park',    project_id: 'proj-3', phase: 'Pre-Design',         version: 'v1', uploaded_by: 'Parth Patel',  uploaded_at: '2026-06-01', size_kb: 230,  status: 'draft'    },
      ])
      setLoading(false)
    }, 500)
    return () => clearTimeout(t)
  }, [])

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
          <h1 className="font-display font-bold text-[28px] lg:text-[34px] leading-tight" style={{ color: 'var(--on-surface)' }}>
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
          value={loading ? '—' : docs.length}
          icon="folder_open"
          color="var(--amber)"
          active={status === 'all'}
          onClick={() => setStatus('all')}
        />
        <StatCard
          variant="filter"
          label="Pending review"
          value={loading ? '—' : docs.filter(d => d.status === 'pending').length}
          icon="schedule"
          color="var(--amber)"
          active={status === 'pending'}
          onClick={() => setStatus('pending')}
        />
        <StatCard
          variant="filter"
          label="Needs revision"
          value={loading ? '—' : docs.filter(d => d.status === 'revision').length}
          icon="edit"
          color="var(--error)"
          active={status === 'revision'}
          onClick={() => setStatus('revision')}
        />
        <StatCard
          variant="filter"
          label="Approved"
          value={loading ? '—' : docs.filter(d => d.status === 'approved').length}
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
            {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
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
              {[0,1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="material-icons-outlined text-[42px] mb-4" style={{ color: 'var(--stone)', opacity: 0.3 }}>folder_open</span>
              <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>No documents found</h3>
              <p className="text-[13px]" style={{ color: 'var(--stone)' }}>Try adjusting the filters or upload a document from a project.</p>
            </div>
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
            <p className="text-[11px]" style={{ color: 'var(--stone)' }}>Browse your connected Drive files</p>
          </div>
        </div>
        <DrivePanel className="h-[400px]" />
      </motion.div>
    </div>
  )
}
