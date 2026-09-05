import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from '@/compat/next-link'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui5/Toast'
import { EmptyState } from '@/components/ui5/EmptyState'
import { ErrorState } from '@/components/ui5/ErrorState'
import { Skeleton } from '@/components/ui5/Skeleton'
import { DrivePanel } from '@/components/integrations/DrivePanel'
import { supabaseClient } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/data/client-data'
import { useLiveReload } from '@/lib/live/useLiveReload'

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

const TYPE_META: Record<string, { icon: string; chipClass: string }> = {
  dwg:   { icon: 'architecture',   chipClass: 'chip-m chip-m-amber' },
  pdf:   { icon: 'picture_as_pdf', chipClass: 'chip-m chip-m-red' },
  docx:  { icon: 'description',    chipClass: 'chip-m chip-m-blue' },
  xlsx:  { icon: 'table_chart',    chipClass: 'chip-m chip-m-green' },
  image: { icon: 'image',          chipClass: 'chip-m' },
}

const STATUS_META: Record<string, { label: string; chipClass: string }> = {
  approved: { label: 'Approved',         chipClass: 'chip-m chip-m-green' },
  pending:  { label: 'Pending Review',   chipClass: 'chip-m chip-m-amber' },
  revision: { label: 'Needs Revision',   chipClass: 'chip-m chip-m-red' },
  draft:    { label: 'Draft',            chipClass: 'chip-m' },
}

const PHASES = ['All Phases', 'Pre-Design', 'Schematic Design', 'Design Development', 'Construction Docs', 'Construction']

function FileIcon({ type }: { type: string }) {
  const m = TYPE_META[type] ?? TYPE_META.pdf
  return (
    <div className={`feed-m-icon`}>
      <span className="material-icons-outlined">{m.icon}</span>
    </div>
  )
}

export default function DocumentsPage() {
  const [docs,       setDocs]       = useState<Document[]>([])
  const [loading,    setLoading]    = useState(true)
  const [loadError,  setLoadError]  = useState<unknown>(null)
  const [search,     setSearch]     = useState('')
  const [project,    setProject]    = useState('All Projects')
  const [phase,      setPhase]      = useState('All Phases')
  const [status,     setStatus]     = useState<string>('all')
  const [view,       setView]       = useState<'grid' | 'list'>('list')
  const [uploading,  setUploading]  = useState(false)
  const [projectList, setProjectList] = useState<{ id: string; name: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true)
      setLoadError(null)
    }
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
            version: `v${d.version ?? 1}`,
            uploaded_by: 'Team',
            uploaded_at: (d.created_at ?? '').split('T')[0],
            size_kb: Math.round(Number(d.file_size ?? 0) / 1024),
            status: (['approved', 'pending', 'revision', 'draft'].includes(d.status) ? d.status : 'draft') as Document['status'],
          }
        })
      )
    } catch (err) {
      if (!opts?.quiet) setLoadError(err)
    } finally {
      if (!opts?.quiet) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!hasSupabaseEnv()) return
    supabaseClient
      .from('projects')
      .select('id, name')
      .order('name')
      .then((res: { data: { id: string; name: string }[] | null }) =>
        setProjectList(res.data || [])
      )
  }, [])

  useLiveReload(load, ['documents'])

  const uploadTarget = useMemo(
    () => (project === 'All Projects' ? null : projectList.find((p) => p.name === project) || null),
    [project, projectList]
  )

  const startUpload = () => {
    if (!uploadTarget) {
      toast('Pick a project in the filter above first — files are filed under a project.', 'warning', 5000)
      return
    }
    fileInputRef.current?.click()
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadTarget) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('projectId', uploadTarget.id)
      const res = await fetch('/api/files/upload', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || 'Upload failed', 'error')
        return
      }

      const ext = (file.name.split('.').pop() || 'dat').toLowerCase()
      const metaRes = await fetch(`/api/projects/${uploadTarget.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
          original_filename: file.name,
          extension: ext,
          size_bytes: file.size,
          folder: 'general',
          r2_key: json.r2_key,
        }),
      })
      const metaJson = await metaRes.json()
      if (!metaRes.ok) {
        toast(metaJson.error || 'File stored but could not be indexed', 'error')
        return
      }

      toast(`${file.name} uploaded to ${uploadTarget.name}`, 'success')
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
    <div className="page-m space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="page-m-title">Document Vault</h1>
          <p className="page-m-sub">
            Every drawing, report and file — across all projects. One searchable archive.
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-start sm:items-end gap-2">
          <button
            className="btn-primary"
            onClick={startUpload}
            disabled={uploading}
          >
            {uploading ? (
              <span className="material-icons-outlined animate-spin">refresh</span>
            ) : (
              <span className="material-icons-outlined">upload_file</span>
            )}
            {uploading ? 'Uploading…' : uploadTarget ? `Upload to ${uploadTarget.name}` : 'Upload document'}
          </button>
          {!uploadTarget && (
            <span className="text-[11px] text-stone">
              Choose a project below to enable upload
            </span>
          )}
        </div>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total files', value: statsPending ? '—' : docs.length, icon: 'folder_open', color: 'text-amber', s: 'all' },
          { label: 'Pending review', value: statsPending ? '—' : docs.filter(d => d.status === 'pending').length, icon: 'schedule', color: 'text-amber', s: 'pending' },
          { label: 'Needs revision', value: statsPending ? '—' : docs.filter(d => d.status === 'revision').length, icon: 'edit', color: 'text-error', s: 'revision' },
          { label: 'Approved', value: statsPending ? '—' : docs.filter(d => d.status === 'approved').length, icon: 'verified', color: 'text-success', s: 'approved' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`card-m stat-m cursor-pointer transition-all ${status === stat.s ? 'ring-2 ring-amber/30 bg-amber/5' : ''}`}
            onClick={() => setStatus(stat.s)}
          >
            <div className="flex items-center justify-between">
              <span className="stat-m-label">{stat.label}</span>
              <span className={`material-icons-outlined text-[18px] ${stat.color}`}>{stat.icon}</span>
            </div>
            <div className="stat-m-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-4 items-center">
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

        <div className="ml-auto flex items-center gap-1 rounded-xl p-1 bg-surface-container-low border border-hairline">
          {(['list', 'grid'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${view === v ? 'bg-white shadow-sm text-amber' : 'text-stone hover:text-on-surface'}`}
            >
              <span className="material-icons-outlined text-[18px]">{v === 'list' ? 'view_list' : 'grid_view'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {loading ? (
            <div className="card-m p-6 space-y-4">
              {[0,1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : loadError ? (
            <div className="card-m p-12">
              <ErrorState
                title="Could not load the document vault"
                description="Retry, or open the documents tab inside a project."
                error={loadError}
                onRetry={load}
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card-m p-16">
              {filtersActive ? (
                <EmptyState
                  icon="filter_alt_off"
                  title="No documents match these filters"
                  description="Try adjusting your project, phase or search query."
                  actionLabel="Clear filters"
                  onClick={clearFilters}
                />
              ) : (
                <EmptyState
                  icon="folder_open"
                  title="The vault is empty"
                  description="Every drawing, report and file lands here automatically. Upload one now to start the archive."
                  actionLabel="Upload document"
                  onClick={() => fileInputRef.current?.click()}
                />
              )}
            </div>
          ) : view === 'list' ? (
            <div className="card-m overflow-hidden">
              <table className="table-m">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th className="hidden md:table-cell">Project</th>
                    <th className="hidden lg:table-cell">Phase</th>
                    <th className="hidden lg:table-cell">Uploaded By</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <FileIcon type={doc.type} />
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{doc.name}</p>
                            <p className="text-[11px] text-stone">
                              {doc.version} · {formatSize(doc.size_kb)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="chip-m">{doc.project}</span>
                      </td>
                      <td className="hidden lg:table-cell text-stone text-[12px]">{doc.phase}</td>
                      <td className="hidden lg:table-cell">
                        <p className="text-[12px]">{doc.uploaded_by}</p>
                        <p className="font-mono text-[10px] text-stone opacity-60">{doc.uploaded_at}</p>
                      </td>
                      <td>
                        <span className={STATUS_META[doc.status].chipClass}>
                          {STATUS_META[doc.status].label}
                        </span>
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/projects/${doc.project_id}/documents`}
                          className="btn-icon"
                          title="View"
                        >
                          <span className="material-icons-outlined">open_in_new</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filtered.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/projects/${doc.project_id}/documents`}
                  className="card-m p-5 space-y-4 hover:ring-2 hover:ring-amber/20 transition-all block"
                >
                  <div className="flex items-start justify-between">
                    <FileIcon type={doc.type} />
                    <span className={STATUS_META[doc.status].chipClass}>{STATUS_META[doc.status].label}</span>
                  </div>
                  <div>
                    <p className="font-semibold line-clamp-2 leading-snug">{doc.name}</p>
                    <p className="text-[11px] text-stone mt-1">{doc.project} · {doc.version}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-hairline">
                    <span className="text-[10px] font-mono text-stone">{formatSize(doc.size_kb)}</span>
                    <span className="text-[10px] text-stone">{doc.uploaded_at}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Google Drive Panel ── */}
      <div className="card-m p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="feed-m-icon bg-blue/10 text-blue">
            <span className="material-icons-outlined">cloud_queue</span>
          </div>
          <div>
            <h3 className="card-m-title">Google Drive Integration</h3>
            <p className="page-m-sub !mt-0.5">Project folder vault — link once, browse everything inside</p>
          </div>
        </div>
        <DrivePanel className="h-[450px] border border-hairline rounded-xl overflow-hidden" />
      </div>
    </div>
  )
}
