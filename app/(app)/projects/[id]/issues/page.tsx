'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

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
  photo_attached?: string
}

export default function IssueTracker() {
  const params = useParams()
  const projectId = params.id as string
  const { toast } = useToast()

  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [showReportModal, setShowReportModal] = useState(false)
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null)
  const [pendingStatus, setPendingStatus] = useState<{ id: string; status: Issue['status'] } | null>(null)
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Form state
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
    assigned_to: 'Amit Sharma',
  })

  useEffect(() => {
    // Mock load issues
    const timer = setTimeout(() => {
      setIssues([
        {
          id: 'iss-1',
          issue_number: 1,
          title: 'Concrete honeycombing at Column C-2 base',
          description: 'Visible honeycomb structure at the base of pour column C-2. Voids need grouting and verification.',
          severity: 'high',
          status: 'open',
          assigned_to: 'Amit Sharma (Contractor)',
          reported_by: 'Aritro Roy (Structural)',
          date_reported: '2026-06-05',
          photo_attached: 'column_honeycomb_c2.jpg'
        },
        {
          id: 'iss-2',
          issue_number: 2,
          title: 'Delayed plumbing shaft bracket arrivals',
          description: 'Heavy duty pipe mounting brackets for internal ducts are delayed. Structural bracing is pending.',
          severity: 'medium',
          status: 'in_progress',
          assigned_to: 'Rohan Deshmukh (MEP)',
          reported_by: 'Amit Sharma (Contractor)',
          date_reported: '2026-06-03'
        },
        {
          id: 'iss-3',
          issue_number: 3,
          title: 'Lobby tile layout alignment deviation',
          description: 'Tile layout deviated by 12mm over 6 meters. Resolved by laying out a layout spacer boundary.',
          severity: 'low',
          status: 'resolved',
          assigned_to: 'Amit Sharma (Contractor)',
          reported_by: 'Parth Patel (Architect)',
          date_reported: '2026-05-20'
        }
      ])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [projectId])

  const handleReportIssue = (e: React.FormEvent) => {
    e.preventDefault()

    const issueRecord: Issue = {
      id: `iss-${Date.now()}`,
      issue_number: issues.length + 1,
      title: newIssue.title,
      description: newIssue.description,
      severity: newIssue.severity,
      status: 'open',
      assigned_to: newIssue.assigned_to,
      reported_by: 'Parth Patel (Architect)',
      date_reported: new Date().toISOString().split('T')[0]
    }

    setIssues(prev => [issueRecord, ...prev])
    setShowReportModal(false)
    setNewIssue({ title: '', description: '', severity: 'medium', assigned_to: 'Amit Sharma' })
  }

  const applyStatusUpdate = (issueId: string, status: Issue['status']) => {
    setIssues(prev => 
      prev.map(i => i.id === issueId ? { ...i, status } : i)
    )
    if (activeIssue && activeIssue.id === issueId) {
      setActiveIssue(prev => prev ? { ...prev, status } : null)
    }
    toast(`Issue marked as ${status.replace('_', ' ')}`, 'success')
    setPendingStatus(null)
  }

  const requestStatusUpdate = (issueId: string, status: Issue['status']) => {
    setPendingStatus({ id: issueId, status })
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
    const matchesSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          i.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = filterSeverity === 'all' || i.severity === filterSeverity
    const matchesStatus = filterStatus === 'all' || i.status === filterStatus
    return matchesSearch && matchesSeverity && matchesStatus
  })

  return (
    <div className="space-y-6 font-body select-none relative h-full">
      {/* Search & Filters block */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <div className="search-5bloc flex-1 min-w-[200px] max-w-md">
            <span className="material-icons-outlined">search</span>
            <input
              type="text"
              placeholder="Search issues…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="select-5bloc">
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
              <option value="all">All Severity</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
            <span className="material-icons-outlined chevron">expand_more</span>
          </div>

          <div className="select-5bloc">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <span className="material-icons-outlined chevron">expand_more</span>
          </div>
        </div>

        <button onClick={() => setShowReportModal(true)} className="btn-primary py-2 text-xs font-bold">
          <span className="material-icons-outlined text-[16px]">report_problem</span>
          REPORT SITE ISSUE
        </button>
      </div>

      {/* Main Grid Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left list of issues */}
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

        {/* Right side Detail panel */}
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
                  <span className={`px-2 py-0.5 border text-[10px] font-semibold uppercase ${getStatusBadge(activeIssue.status)}`}>
                    {activeIssue.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-navy-mid border text-xs text-stone leading-relaxed">
                {activeIssue.description}
              </div>

              {activeIssue.photo_attached && (
                <div className="p-3 bg-navy-lt/30 border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-stone font-mono text-[10px]">
                    <span className="material-icons-outlined text-[16px] text-amber">photo_camera</span>
                    <span>{activeIssue.photo_attached}</span>
                  </div>
                  <button className="text-[10px] text-blue font-bold uppercase hover:underline">View Photo</button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-stone font-mono text-[9px] uppercase block">Assigned To</span>
                  <span className="font-semibold text-white mt-1 block truncate">{activeIssue.assigned_to}</span>
                </div>
                <div>
                  <span className="text-stone font-mono text-[9px] uppercase block">Reported By</span>
                  <span className="font-semibold text-white mt-1 block truncate">{activeIssue.reported_by}</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <h5 className="text-[10px] font-bold text-stone font-mono uppercase">Update Issue State</h5>
                <div className="flex gap-2">
                  {activeIssue.status !== 'resolved' && (
                    <>
                      {activeIssue.status === 'open' && (
                        <button
                          onClick={() => requestStatusUpdate(activeIssue.id, 'in_progress')}
                          className="btn-secondary py-1.5 px-3 text-[11px] font-bold flex-1"
                        >
                          START PROGRESS
                        </button>
                      )}
                      <button
                        onClick={() => requestStatusUpdate(activeIssue.id, 'resolved')}
                        className="btn-primary py-1.5 px-4 text-[11px] font-bold flex-1"
                      >
                        RESOLVE ISSUE
                      </button>
                    </>
                  )}
                  {activeIssue.status === 'resolved' && (
                    <button
                      onClick={() => requestStatusUpdate(activeIssue.id, 'open')}
                      className="btn-secondary py-1.5 px-4 text-[11px] font-bold w-full text-error"
                    >
                      REOPEN ISSUE
                    </button>
                  )}
                </div>
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

      {/* Add Issue Modal */}
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
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Assign Contractor</label>
                  <select
                    value={newIssue.assigned_to}
                    onChange={e => setNewIssue(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs font-medium"
                  >
                    <option value="Amit Sharma (Contractor)">Amit Sharma (Civil)</option>
                    <option value="Rohan Deshmukh (MEP)">Rohan Deshmukh (MEP)</option>
                  </select>
                </div>
              </div>

              {/* Upload photo mock */}
              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-2 font-mono">Attach Defect Photos (Optional)</label>
                <div className="border border-dashed border-stone/30 p-4 text-center cursor-pointer hover:border-amber transition">
                  <span className="material-icons-outlined text-[20px] text-stone">add_a_photo</span>
                  <p className="text-[10px] text-stone mt-1">Select photo from device</p>
                </div>
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

      <ConfirmDialog
        open={!!pendingStatus}
        title="Update issue status?"
        message={
          pendingStatus?.status === 'resolved'
            ? 'Mark this issue as resolved? This will close it in the project log.'
            : pendingStatus?.status === 'open'
              ? 'Reopen this issue? It will appear as open again.'
              : 'Move this issue to in progress?'
        }
        confirmLabel="Confirm"
        onConfirm={() => pendingStatus && applyStatusUpdate(pendingStatus.id, pendingStatus.status)}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  )
}
