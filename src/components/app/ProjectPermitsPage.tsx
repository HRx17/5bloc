import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from '@/compat/next-navigation'
import { useToast } from '@/components/ui5/Toast'
import { useConfirm } from '@/components/ui5/ConfirmProvider'
import { ErrorState } from '@/components/ui5/ErrorState'
import { EmptyState } from '@/components/ui5/EmptyState'
import { Skeleton } from '@/components/ui5/Skeleton'
import { useLiveReload } from '@/lib/live/useLiveReload'
import {
  byeLawsFor,
  complianceNotesFor,
  defaultPermitsFor,
  typologyLabel,
} from '@/lib/compliance/typology'

interface PermitItem {
  id: string
  approval_name: string
  authority: string
  status: 'not_started' | 'pending' | 'approved' | 'expired'
  submission_date?: string
  expiry_date?: string
  notes?: string
}

export default function ProjectPermitsPage() {
  const params = useParams()
  const projectId = params.id as string
  const { toast } = useToast()
  const confirm = useConfirm()

  const [permits, setPermits] = useState<PermitItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [seeding, setSeeding] = useState(false)
  const [updatingPermit, setUpdatingPermit] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState('Maharashtra')
  const [reraRegistered, setReraRegistered] = useState(true)
  const [reraNum, setReraNum] = useState('')
  const [showChecklist, setShowChecklist] = useState(false)
  const [projectType, setProjectType] = useState<string>('residential')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addingPermit, setAddingPermit] = useState(false)
  const [newPermit, setNewPermit] = useState({
    approval_name: '',
    authority: '',
    status: 'not_started' as PermitItem['status'],
    submission_date: '',
    expiry_date: '',
    notes: '',
  })

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true)
      setLoadError(null)
    }
    try {
      const [permitRes, projRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/permits`),
        fetch(`/api/projects/${projectId}`),
      ])
      const p = await permitRes.json()
      const proj = await projRes.json()
      if (!permitRes.ok) throw new Error(p.error || 'Failed to load permits')
      setPermits(p.permits || [])
      const project = proj.project
      if (projRes.ok && project) {
        setReraRegistered(!!project.is_rera_registered)
        setReraNum(project.rera_number || '')
        setProjectType(project.type || 'residential')
        if (project.state) setSelectedState(project.state === 'MH' ? 'Maharashtra' : project.state)
      }
    } catch (e) {
      if (!opts?.quiet) setLoadError(e)
    } finally {
      if (!opts?.quiet) setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  useLiveReload(load, ['permits'])

  const handleTogglePermitStatus = async (permit: PermitItem, newStatus: PermitItem['status']) => {
    if (updatingPermit) return
    if (
      newStatus === 'approved' &&
      !(await confirm({
        title: 'Approve clearance',
        message: `“${permit.approval_name}” will be recorded as approved by ${permit.authority}. Teams rely on this to release drawings for construction, and it cannot be reset from this screen.`,
        confirmLabel: 'Mark approved',
      }))
    ) {
      return
    }
    setUpdatingPermit(permit.id)
    setPermits((prev) => prev.map((p) => (p.id === permit.id ? { ...p, status: newStatus } : p)))
    try {
      const res = await fetch(`/api/projects/${projectId}/permits`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permit_id: permit.id, status: newStatus }),
      })
      if (!res.ok) {
        setPermits((prev) => prev.map((p) => (p.id === permit.id ? { ...p, status: permit.status } : p)))
        const data = await res.json().catch(() => ({}))
        toast(data.error || 'Could not update the permit status', 'error')
        return
      }
      toast(
        newStatus === 'approved' ? `${permit.approval_name} approved` : `${permit.approval_name} marked as submitted`,
        'success'
      )
    } catch (err: any) {
      setPermits((prev) => prev.map((p) => (p.id === permit.id ? { ...p, status: permit.status } : p)))
      toast(err?.message || 'Could not update the permit status', 'error')
    } finally {
      setUpdatingPermit(null)
    }
  }

  const addPermit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (addingPermit || !newPermit.approval_name.trim()) return
    setAddingPermit(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/permits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_name: newPermit.approval_name.trim(),
          authority: newPermit.authority.trim() || 'Not specified',
          status: newPermit.status,
          submission_date: newPermit.submission_date || null,
          expiry_date: newPermit.expiry_date || null,
          notes: newPermit.notes.trim() || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast(data.error || 'Could not add that clearance', 'error')
        return
      }
      setPermits((prev) => [...prev, data.permit])
      setShowAddModal(false)
      setNewPermit({
        approval_name: '',
        authority: '',
        status: 'not_started',
        submission_date: '',
        expiry_date: '',
        notes: '',
      })
      toast(`${data.permit.approval_name} added`, 'success')
    } catch (err: any) {
      toast(err?.message || 'Could not add that clearance', 'error')
    } finally {
      setAddingPermit(false)
    }
  }

  const seedDefaultPermits = async () => {
    if (permits.length > 0 || seeding) return
    const defaults = defaultPermitsFor(projectType).map((d) => ({ ...d, status: 'not_started' }))
    setSeeding(true)
    try {
      const created = []
      let failed = 0
      for (const d of defaults) {
        const res = await fetch(`/api/projects/${projectId}/permits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(d),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok) created.push(data.permit)
        else failed += 1
      }
      setPermits(created)
      if (failed) toast(`${created.length} of ${defaults.length} permits added — the rest failed`, 'warning')
      else toast(`${typologyLabel(projectType)} clearance checklist added`, 'success')
    } catch (err: any) {
      toast(err?.message || 'Could not seed the permit checklist', 'error')
    } finally {
      setSeeding(false)
    }
  }

  const complianceChecklist = complianceNotesFor(projectType)
  const byeLaws = byeLawsFor(projectType)

  const getStatusChipStyle = (st: PermitItem['status']) => {
    switch (st) {
      case 'approved': return 'bg-success/10 text-success'
      case 'pending': return 'bg-amber/10 text-amber'
      case 'not_started': return 'bg-stone/15 text-stone'
      case 'expired': return 'bg-error/15 text-error'
    }
  }

  // Calculate stats
  const approvedCount = permits.filter(p => p.status === 'approved').length
  const pendingCount = permits.filter(p => p.status === 'pending').length

  return (
    <div className="space-y-6 font-body select-none max-w-7xl mx-auto">
      {/* KPI Stats widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Approved NOCs', value: approvedCount, sub: 'Legally cleared permits', color: 'text-success' },
          { label: 'Pending Clearances', value: pendingCount, sub: 'Under municipal review', color: 'text-amber' },
          { label: 'RERA Registry Status', value: reraRegistered ? 'Certified' : 'Not Registered', sub: reraRegistered ? reraNum : 'Action required', color: reraRegistered ? 'text-blue' : 'text-error' }
        ].map((stat, idx) => (
          <div key={idx} className="card-m p-4">
            <span className="text-[10px] text-stone font-mono uppercase tracking-wider">{stat.label}</span>
            <h4 className={`text-lg font-bold mt-1 ${stat.color}`}>{stat.value}</h4>
            <p className="text-[10px] text-stone mt-1 font-mono">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Clearances Log table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-m p-5 space-y-4">
            <div className="border-b pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Sanction & NOC Checklist</h3>
                <p className="text-[10px] text-stone mt-0.5 font-mono">
                  {typologyLabel(projectType)} project — verify state building codes and certificate filings.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="label-sm font-bold text-stone">PERMITS: {permits.length}</span>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-secondary py-1 px-2.5 text-[10px] font-mono font-bold uppercase"
                >
                  <span className="material-icons-outlined text-[13px]">add</span>
                  Add clearance
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : loadError ? (
              <ErrorState
                compact
                title="Could not load the clearance checklist"
                error={loadError}
                onRetry={load}
              />
            ) : permits.length === 0 ? (
              <EmptyState
                icon="verified_user"
                title="No approvals tracked yet"
                description={`Seed the standard ${typologyLabel(projectType).toLowerCase()} checklist — ${defaultPermitsFor(projectType).length} clearances tuned to this typology — or add your own with “Add clearance”.`}
                actionLabel={seeding ? 'Adding…' : `Seed ${typologyLabel(projectType).toLowerCase()} checklist`}
                onClick={seedDefaultPermits}
              />
            ) : (
              <div className="divide-y divide-navy-lt/30">
                {permits.map(permit => (
                  <div key={permit.id} className="py-4 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-white">{permit.approval_name}</h4>
                        <span className="text-[10px] text-stone font-mono">Authority: {permit.authority}</span>
                      </div>
                      <span className={`px-2 py-0.5 border text-[9px] font-mono font-semibold uppercase ${getStatusChipStyle(permit.status)}`}>
                        {permit.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone leading-relaxed">{permit.notes}</p>

                    {permit.submission_date && (
                      <div className="flex gap-4 text-[9px] font-mono text-stone">
                        <span>Submitted: {permit.submission_date}</span>
                        {permit.expiry_date && <span className="text-error">Expiry: {permit.expiry_date}</span>}
                      </div>
                    )}

                    <div className="flex gap-2 justify-end pt-1">
                      {permit.status !== 'approved' && (
                        <button
                          onClick={() => handleTogglePermitStatus(permit, 'approved')}
                          disabled={updatingPermit === permit.id}
                          className="bg-success/10 hover:bg-success/20 text-success border border-success/30 px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition disabled:opacity-50"
                        >
                          {updatingPermit === permit.id ? 'Saving…' : 'Approve Clearance'}
                        </button>
                      )}
                      {permit.status !== 'pending' && permit.status !== 'approved' && (
                        <button
                          onClick={() => handleTogglePermitStatus(permit, 'pending')}
                          disabled={updatingPermit === permit.id}
                          className="bg-amber/10 hover:bg-amber/20 text-amber border border-amber/30 px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition disabled:opacity-50"
                        >
                          {updatingPermit === permit.id ? 'Saving…' : 'Mark as Submitted'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Building codes zonation checking tool */}
        <div className="card-m p-5 space-y-5">
          <div className="border-b pb-3">
            <h3 className="text-xs font-bold font-mono text-amber uppercase tracking-wider">Bye-Laws Bye-laws checking</h3>
            <p className="text-[10px] text-stone mt-0.5">Automated local authority codes lookup checklist.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Select State / Corporation</label>
              <select
                value={selectedState}
                onChange={e => setSelectedState(e.target.value)}
                className="input-5bloc py-1.5 text-xs font-medium"
              >
                <option value="Maharashtra">MahaRERA (Maharashtra)</option>
                <option value="Karnataka">RERA Karnataka (Karnataka)</option>
                <option value="Delhi">DDA Zoning Rules (Delhi)</option>
              </select>
            </div>

            <div className="p-3.5 bg-navy/40 border space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                <span className="material-icons-outlined text-amber text-[15px]">info</span>
                Zoning Bye-Laws ({typologyLabel(projectType).toLowerCase()})
              </h4>
              <div className="space-y-2 text-[10px] text-stone font-mono leading-normal">
                {byeLaws.map((rule, i) => (
                  <div
                    key={rule.label}
                    className={`flex justify-between gap-3 ${i < byeLaws.length - 1 ? 'border-b pb-1 border-navy-lt/60' : ''}`}
                  >
                    <span>{rule.label}:</span>
                    <span className="text-white text-right">{rule.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <a
              href="/ai/building-code"
              className="w-full btn-secondary py-2 text-xs font-bold flex items-center justify-center gap-1"
            >
              <span className="material-icons-outlined text-[15px]">auto_awesome</span>
              RUN AI CODE CHECK
            </a>

            <button
              onClick={() => setShowChecklist((v) => !v)}
              aria-expanded={showChecklist}
              className="w-full btn-primary py-2 text-xs font-bold flex items-center justify-center gap-1"
            >
              <span className="material-icons-outlined text-[15px]">verified_user</span>
              {showChecklist ? 'HIDE COMPLIANCE CHECKLIST' : 'SHOW COMPLIANCE CHECKLIST'}
            </button>

            {showChecklist && (
              <div className="p-3.5 bg-navy/40 border space-y-2 animate-fade-in">
                <h4 className="text-[11px] font-bold text-white font-mono">
                  {selectedState} zoning quick-check
                </h4>
                <p className="text-[10px] text-stone font-mono">Reference only — verify with the local authority.</p>
                <ul className="list-disc pl-4 space-y-1.5 text-[10px] text-stone leading-relaxed">
                  {complianceChecklist.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="text-[10px] pt-1" style={{ color: 'var(--amber)' }}>
                  This check does not replace a licensed municipal submission.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-navy/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-navy-mid border rounded-lg shadow-xl">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Add a clearance</h3>
                <p className="text-[10px] text-stone mt-0.5">
                  Track any approval this project needs, beyond the standard checklist.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone hover:text-white p-1 rounded-md hover:bg-navy-lt"
                aria-label="Close"
              >
                <span className="material-icons-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={addPermit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-stone mb-1 font-medium">Clearance name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Coastal Zone NOC"
                  value={newPermit.approval_name}
                  onChange={(e) => setNewPermit((p) => ({ ...p, approval_name: e.target.value }))}
                  className="input-5bloc py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-stone mb-1 font-medium">Authority</label>
                  <input
                    type="text"
                    placeholder="e.g. State Coastal Zone Authority"
                    value={newPermit.authority}
                    onChange={(e) => setNewPermit((p) => ({ ...p, authority: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone mb-1 font-medium">Status</label>
                  <select
                    value={newPermit.status}
                    onChange={(e) =>
                      setNewPermit((p) => ({ ...p, status: e.target.value as PermitItem['status'] }))
                    }
                    className="input-5bloc py-1.5 text-xs"
                  >
                    <option value="not_started">Not started</option>
                    <option value="pending">Submitted / pending</option>
                    <option value="approved">Approved</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-stone mb-1 font-medium">Submitted on</label>
                  <input
                    type="date"
                    value={newPermit.submission_date}
                    onChange={(e) => setNewPermit((p) => ({ ...p, submission_date: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone mb-1 font-medium">Expires on</label>
                  <input
                    type="date"
                    value={newPermit.expiry_date}
                    onChange={(e) => setNewPermit((p) => ({ ...p, expiry_date: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-stone mb-1 font-medium">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Conditions, file numbers, who is following up…"
                  value={newPermit.notes}
                  onChange={(e) => setNewPermit((p) => ({ ...p, notes: e.target.value }))}
                  className="input-5bloc text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={addingPermit}
                  className="btn-secondary py-1.5 px-4 text-xs mt-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingPermit || !newPermit.approval_name.trim()}
                  className="btn-primary py-1.5 px-6 text-xs mt-3 disabled:opacity-50"
                >
                  {addingPermit ? 'Adding…' : 'Add clearance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
