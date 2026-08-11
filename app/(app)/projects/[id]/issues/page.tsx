'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

interface Issue {
  id: string
  issue_number: number
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'resolved'
  assigned_to: string
  reported_by: string
  date_reported: string
  photo_attached?: string | null
}

export default function IssueTracker() {
  const params = useParams()
  const projectId = params.id as string
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [showReportModal, setShowReportModal] = useState(false)
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
    assigned_to: '',
    photo_attached: '' as string,
  })

  useEffect(() => {
    fetch(`/api/projects/${projectId}/issues`)
      .then((r) => r.json())
      .then((d) => setIssues(d.issues || []))
      .finally(() => setLoading(false))
  }, [projectId])

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('projectId', projectId)
      const res = await fetch('/api/files/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Upload failed')
        return
      }
      const url = data.url || data.storage_path || data.r2_key || ''
      setNewIssue((prev) => ({ ...prev, photo_attached: url }))
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/projects/${projectId}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newIssue,
        photo_attached: newIssue.photo_attached || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || 'Failed to report')
      return
    }
    setIssues((prev) => [data.issue, ...prev])
    setShowReportModal(false)
    setNewIssue({ title: '', description: '', severity: 'medium', assigned_to: '', photo_attached: '' })
  }

  const handleSaveIssue = async () => {
    if (!activeIssue) return
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/issues`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_id: activeIssue.id,
          status: activeIssue.status,
          assigned_to: activeIssue.assigned_to,
          description: activeIssue.description,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to save')
        return
      }
      setIssues((prev) =>
        prev.map((i) => (i.id === activeIssue.id ? { ...i, ...activeIssue } : i))
      )
    } finally {
      setSaving(false)
    }
  }

  const openPhoto = (url?: string | null) => {
    if (!url) return
    if (url.startsWith('http') || url.startsWith('/')) {
      window.open(url, '_blank')
      return
    }
    const key = url.replace(/^mock:\/\//, '')
    fetch(`/api/files/upload?key=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.url) window.open(d.url, '_blank')
        else alert('Could not open photo')
      })
      .catch(() => alert('Could not open photo'))
  }

  const getSeverityStyle = (s: Issue['severity']) => {
    switch (s) {
      case 'high': return { background: 'rgba(255,180,171,.12)', color: 'var(--error)' }
      case 'medium': return { background: 'rgba(245,166,35,.12)', color: 'var(--amber)' }
      default: return { background: 'rgba(122,184,255,.12)', color: 'var(--blue)' }
    }
  }

  const getStatusBadge = (st: Issue['status']) => {
    switch (st) {
      case 'open': return 'bg-error/15 text-error '
      case 'in_progress': return 'bg-amber/10 text-amber '
      case 'resolved': return 'bg-success/15 text-success '
    }
  }

  const filtered = issues.filter(i => {
    const matchesSearch = (i.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (i.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = filterSeverity === 'all' || i.severity === filterSeverity
    const matchesStatus = filterStatus === 'all' || i.status === filterStatus
    return matchesSearch && matchesSeverity && matchesStatus
  })

  return (
    <div className="space-y-6 font-body select-none relative h-full">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Search issues..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-5bloc py-2 text-xs flex-1 min-w-[200px]"
          />
          
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="input-5bloc py-2 text-xs w-32 font-medium"
          >
            <option value="all">All Severity</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="input-5bloc py-2 text-xs w-32 font-medium"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <button onClick={() => setShowReportModal(true)} className="btn-primary py-2 text-xs font-bold">
          <span className="material-icons-outlined text-[16px]">report_problem</span>
          REPORT SITE ISSUE
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-5bloc space-y-4">
            <div className="border-b pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Site Issue Register</h3>
                <p className="text-[10px] text-stone mt-0.5">Logs of active construction delays or design non-compliance.</p>
              </div>
              <span className="label-sm font-bold text-stone">COUNT: {filtered.length}</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-stone animate-pulse">Loading issue records...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-stone">No logged issues match filter criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-stone font-mono uppercase text-[10px] tracking-wider border-b pb-2">
                      <th className="pb-3 pl-2"># ID</th>
                      <th className="pb-3">Issue Title</th>
                      <th className="pb-3">Assigned To</th>
                      <th className="pb-3">Severity</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-lt/30">
                    {filtered.map(i => (
                      <tr
                        key={i.id}
                        onClick={() => setActiveIssue(i)}
                        className="hover:bg-navy-lt/20 cursor-pointer transition-colors group"
                      >
                        <td className="py-4 pl-2 font-mono text-stone">ISS-{String(i.issue_number).padStart(3, '0')}</td>
                        <td className="py-4 font-semibold pr-4">
                          <span className="text-white group-hover:text-amber transition-colors line-clamp-1">{i.title}</span>
                          <span className="text-[10px] text-stone block font-mono mt-0.5">Reported: {i.date_reported}</span>
                        </td>
                        <td className="py-4 text-stone">{i.assigned_to}</td>
                        <td className="py-4">
                          <span className="chip" style={getSeverityStyle(i.severity)}>{i.severity}</span>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 border text-[10px] font-semibold uppercase ${getStatusBadge(i.status)}`}>
                            {i.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 pr-2 text-right">
                          <span className="material-icons-outlined text-stone group-hover:text-white transition-colors text-[18px]">
                            chevron_right
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          {activeIssue ? (
            <div className="card-5bloc space-y-5 animate-fade-in">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold font-mono text-amber uppercase tracking-wide">
                    Issue Details
                  </h4>
                  <span className="text-[10px] text-stone font-mono">ISS-{String(activeIssue.issue_number).padStart(3, '0')}</span>
                </div>
                <button onClick={() => setActiveIssue(null)} className="text-stone hover:text-white transition">
                  <span className="material-icons-outlined text-[16px]">close</span>
                </button>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white leading-snug">{activeIssue.title}</h3>
                <div className="flex gap-2 mt-2">
                  <span className="chip" style={getSeverityStyle(activeIssue.severity)}>{activeIssue.severity} severity</span>
                </div>
              </div>

              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Status</label>
                <select
                  value={activeIssue.status}
                  onChange={(e) =>
                    setActiveIssue((prev) =>
                      prev ? { ...prev, status: e.target.value as Issue['status'] } : null
                    )
                  }
                  className="input-5bloc py-1.5 text-xs font-medium"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Assigned To</label>
                <input
                  type="text"
                  value={activeIssue.assigned_to || ''}
                  onChange={(e) =>
                    setActiveIssue((prev) => (prev ? { ...prev, assigned_to: e.target.value } : null))
                  }
                  className="input-5bloc py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Description</label>
                <textarea
                  rows={4}
                  value={activeIssue.description || ''}
                  onChange={(e) =>
                    setActiveIssue((prev) => (prev ? { ...prev, description: e.target.value } : null))
                  }
                  className="input-5bloc text-xs resize-none"
                />
              </div>

              {activeIssue.photo_attached ? (
                <div className="p-3 bg-navy-lt/30 border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-stone font-mono text-[10px] min-w-0">
                    <span className="material-icons-outlined text-[16px] text-amber shrink-0">photo_camera</span>
                    <span className="truncate">{activeIssue.photo_attached}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openPhoto(activeIssue.photo_attached)}
                    className="text-[10px] text-blue font-bold uppercase hover:underline shrink-0 ml-2"
                  >
                    View Photo
                  </button>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-stone font-mono text-[9px] uppercase block">Reported By</span>
                  <span className="font-semibold text-white mt-1 block truncate">{activeIssue.reported_by}</span>
                </div>
                <div>
                  <span className="text-stone font-mono text-[9px] uppercase block">Date</span>
                  <span className="font-semibold text-white mt-1 block truncate">{activeIssue.date_reported}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={handleSaveIssue}
                  disabled={saving}
                  className="btn-primary py-1.5 px-4 text-[11px] font-bold w-full"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="card-5bloc text-center py-12 text-stone text-xs">
              <span className="material-icons-outlined text-[32px] text-stone/25 mb-2">check_circle_outline</span>
              <p>Select a reported issue from the log to view detailed descriptions, photos, and change execution status.</p>
            </div>
          )}
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-navy-mid border p-6 space-y-4">
            <div className="border-b pb-3 flex justify-between items-center">
              <h3 className="text-xs font-bold font-mono text-amber uppercase tracking-wider">Report Site Defect/Issue</h3>
              <button onClick={() => setShowReportModal(false)} className="text-stone hover:text-white transition">
                <span className="material-icons-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleReportIssue} className="space-y-4">
              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lobby slab reinforcement misalignment"
                  value={newIssue.title}
                  onChange={e => setNewIssue(prev => ({ ...prev, title: e.target.value }))}
                  className="input-5bloc py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Detailed Defect Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain structural faults, code violations, or delays..."
                  value={newIssue.description}
                  onChange={e => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                  className="input-5bloc text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Risk Severity</label>
                  <select
                    value={newIssue.severity}
                    onChange={e => setNewIssue(prev => ({ ...prev, severity: e.target.value as any }))}
                    className="input-5bloc py-1.5 text-xs font-medium"
                  >
                    <option value="low">Low (Defect/Aesthetic)</option>
                    <option value="medium">Medium (Layout variance)</option>
                    <option value="high">High (Structural risk)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Assign To</label>
                  <input
                    type="text"
                    placeholder="Contractor name"
                    value={newIssue.assigned_to}
                    onChange={e => setNewIssue(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-2 font-mono">Attach Defect Photos (Optional)</label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePhotoUpload(file)
                  }}
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-full border border-dashed border-stone/30 p-4 text-center hover:border-amber transition"
                >
                  <span className="material-icons-outlined text-[20px] text-stone">add_a_photo</span>
                  <p className="text-[10px] text-stone mt-1">
                    {uploadingPhoto
                      ? 'Uploading…'
                      : newIssue.photo_attached
                        ? 'Photo attached — click to replace'
                        : 'Select photo from device'}
                  </p>
                </button>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setShowReportModal(false)} className="btn-secondary py-1.5 px-4 text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-1.5 px-6 text-xs font-bold">
                  Submit Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
