'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useLiveReload } from '@/lib/live/useLiveReload'

interface VisitReport {
  id: string
  visit_number: number
  date: string
  supervisor: string
  gps_coordinates: string
  observations: string
  photos: string[]
}

interface MaterialLog {
  id: string
  material_name: string
  specified_standard: string
  delivered_material: string
  status: 'compliant' | 'substitution_flagged' | 'pending_testing'
  contractor: string
  notes?: string
}

interface PunchItem {
  id: string
  item_number: number
  defect: string
  location: string
  assigned_to: string
  status: 'open' | 'resolved'
  photo?: string
}

export default function SiteAndField() {
  const params = useParams()
  const projectId = params.id as string
  const { toast } = useToast()

  const [activeSubTab, setActiveSubTab] = useState<'visits' | 'materials' | 'punch'>('visits')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [submitting, setSubmitting] = useState(false)

  // Sub-tabs State
  const [visitReports, setVisitReports] = useState<VisitReport[]>([])
  const [materialLogs, setMaterialLogs] = useState<MaterialLog[]>([])
  const [punchList, setPunchList] = useState<PunchItem[]>([])

  // Visit Form state
  const [newVisit, setNewVisit] = useState({
    supervisor: 'Amit Sharma',
    observations: '',
    gps_coordinates: '19.0760° N, 72.8777° E',
  })

  // Material Form state
  const [newMaterial, setNewMaterial] = useState({
    material_name: '',
    specified_standard: '',
    delivered_material: '',
    contractor: 'Amit Sharma',
  })

  // Punch Form state
  const [newPunch, setNewPunch] = useState({
    defect: '',
    location: '',
    assigned_to: 'Amit Sharma',
  })

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true)
      setLoadError(null)
    }
    try {
      const res = await fetch(`/api/projects/${projectId}/site`)
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to load site records')
      setVisitReports(d.visits || [])
      setMaterialLogs(d.materials || [])
      setPunchList(d.punch || [])
    } catch (e) {
      if (!opts?.quiet) setLoadError(e)
    } finally {
      if (!opts?.quiet) setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  useLiveReload(load, ['site_visits', 'issues'])

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'visit', ...newVisit }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || 'Failed to save the visit report', 'error')
        return
      }
      setVisitReports(prev => [data.visit, ...prev])
      setNewVisit(prev => ({ ...prev, observations: '' }))
      toast('Visit report logged', 'success')
    } catch (err: any) {
      toast(err?.message || 'Failed to save the visit report', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'material', ...newMaterial }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || 'Failed to log the material delivery', 'error')
        return
      }
      setMaterialLogs(prev => [data.material, ...prev])
      setNewMaterial({ material_name: '', specified_standard: '', delivered_material: '', contractor: '' })
      toast('Material delivery logged', 'success')
    } catch (err: any) {
      toast(err?.message || 'Failed to log the material delivery', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddPunch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'punch', ...newPunch }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || 'Failed to add the punch item', 'error')
        return
      }
      setPunchList(prev => [data.punch, ...prev])
      setNewPunch({ defect: '', location: '', assigned_to: '' })
      toast('Punch item added', 'success')
    } catch (err: any) {
      toast(err?.message || 'Failed to add the punch item', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTogglePunch = async (id: string) => {
    const item = punchList.find((p) => p.id === id)
    if (!item) return
    const next = item.status === 'open' ? 'resolved' : 'open'
    try {
      const res = await fetch(`/api/projects/${projectId}/site`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ punch_id: id, status: next }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast(data.error || 'Could not update the punch item', 'error')
        return
      }
      setPunchList((prev) => prev.map((p) => (p.id === id ? { ...p, status: next } : p)))
      toast(next === 'resolved' ? 'Punch item resolved' : 'Punch item reopened', 'success')
    } catch (err: any) {
      toast(err?.message || 'Could not update the punch item', 'error')
    }
  }

  const handleFlagSubstitution = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/site`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material_id: id, status: 'substitution_flagged' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast(data.error || 'Could not flag the substitution', 'error')
        return
      }
      setMaterialLogs((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'substitution_flagged' } : m))
      )
      toast('Material flagged as a substitution', 'success')
    } catch (err: any) {
      toast(err?.message || 'Could not flag the substitution', 'error')
    }
  }

  return (
    <div className="space-y-6 font-body select-none">
      {/* Sub-tabs Selection bar */}
      <div className="flex border-b pb-2.5 gap-6">
        {[
          { id: 'visits', label: 'Site Visit Reports' },
          { id: 'materials', label: 'Material Delivery Log' },
          { id: 'punch', label: 'Punch / Snag List' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`text-xs font-semibold pb-1.5 border-b-2 transition-all uppercase tracking-wider ${
              activeSubTab === tab.id ? 'text-amber border-amber font-bold' : 'text-stone hover:text-white border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      ) : loadError ? (
        <ErrorState title="Could not load site records" error={loadError} onRetry={load} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main workspace section (Col Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* 1. VISITS TAB */}
            {activeSubTab === 'visits' && (
              <div className="card-5bloc space-y-5">
                <div className="border-b pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Site Inspection logs</h3>
                    <p className="text-[10px] text-stone mt-0.5 font-mono">GPS-tagged inspection records with photo logs.</p>
                  </div>
                  <span className="label-sm font-bold text-stone">VISITS: {visitReports.length}</span>
                </div>

                {visitReports.length === 0 && (
                  <EmptyState
                    icon="place"
                    title="No site visits recorded"
                    description="Use the form on the right after each inspection — observations logged here become the dated record if workmanship is disputed later."
                  />
                )}

                <div className="space-y-4">
                  {visitReports.map(visit => (
                    <div key={visit.id} className="p-4 bg-navy/30 border space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <span className="material-icons-outlined text-amber text-[14px]">place</span>
                          Visit Report #{visit.visit_number}
                        </h4>
                        <span className="text-[10px] text-stone font-mono">Reported on: {visit.date} by {visit.supervisor}</span>
                      </div>
                      <p className="text-xs text-stone leading-relaxed">{visit.observations}</p>
                      
                      <div className="pt-2 border-t border-navy-lt flex flex-wrap justify-between items-center text-[10px] font-mono text-stone gap-2">
                        <span>Coordinates: {visit.gps_coordinates}</span>
                        {visit.photos?.map(p => (
                          <span key={p} className="flex items-center gap-1 text-blue">
                            <span className="material-icons-outlined text-[13px]">photo_camera</span> {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. MATERIALS TAB */}
            {activeSubTab === 'materials' && (
              <div className="card-5bloc space-y-5">
                <div className="border-b pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Materials Verification registry</h3>
                    <p className="text-[10px] text-stone mt-0.5">Flag substitutions against blueprint specifications.</p>
                  </div>
                </div>

                {materialLogs.length === 0 && (
                  <EmptyState
                    icon="inventory_2"
                    title="No deliveries verified yet"
                    description="Record what was specified against what actually arrived on site, so any substitution is caught before it goes into the works."
                  />
                )}

                <div className="space-y-4">
                  {materialLogs.map(log => (
                    <div key={log.id} className="p-4 bg-navy/30 border space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-white">{log.material_name}</h4>
                        <span className={`chip ${
                          log.status === 'compliant' 
                            ? 'bg-success/10 text-success' 
                            : log.status === 'substitution_flagged'
                            ? 'bg-error/10 text-error' 
                            : 'bg-stone/10 text-stone'
                        }`}>{log.status.replace('_', ' ')}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-stone font-mono text-[9px] uppercase block">Specified Standard</span>
                          <span className="text-white font-semibold">{log.specified_standard}</span>
                        </div>
                        <div>
                          <span className="text-stone font-mono text-[9px] uppercase block">Delivered Material</span>
                          <span className="text-white font-semibold">{log.delivered_material}</span>
                        </div>
                      </div>

                      {log.notes && <p className="text-xs text-stone italic">Note: {log.notes}</p>}

                      <div className="pt-2 border-t border-navy-lt flex justify-between items-center">
                        <span className="text-[10px] text-stone font-mono">Contractor: {log.contractor}</span>
                        <button
                          onClick={() => handleFlagSubstitution(log.id)}
                          className={`px-2 py-0.5 border text-[10px] font-mono font-bold rounded ${
                            log.status === 'substitution_flagged' ? 'bg-success text-navy' : 'bg-error/10 text-error'
                          }`}
                        >
                          {log.status === 'substitution_flagged' ? 'APPROVE SUBSTITUTION' : 'FLAG SUBSTITUTION'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. PUNCH LIST TAB */}
            {activeSubTab === 'punch' && (
              <div className="card-5bloc space-y-5">
                <div className="border-b pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Closeout Snag checklist</h3>
                    <p className="text-[10px] text-stone mt-0.5">Final items to resolve before retention release.</p>
                  </div>
                </div>

                {punchList.length === 0 && (
                  <EmptyState
                    icon="checklist"
                    title="Snag list is clear"
                    description="Add defects found during the closeout walkthrough. Everything here must be resolved before retention is released."
                  />
                )}

                <div className="space-y-4">
                  {punchList.map(item => (
                    <div key={item.id} className="p-4 bg-navy/30 border space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="font-mono text-stone">#{item.item_number}</span> - {item.defect}
                        </h4>
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                          item.status === 'resolved' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                        }`}>{item.status.toUpperCase()}</span>
                      </div>
                      <p className="text-xs text-stone">Location: {item.location} • Assignee: {item.assigned_to}</p>

                      <div className="pt-2 border-t border-navy-lt flex justify-end">
                        <button
                          onClick={() => handleTogglePunch(item.id)}
                          className="btn-secondary py-1 px-3 text-[10px] font-bold"
                        >
                          {item.status === 'open' ? 'MARK RESOLVED' : 'REOPEN DEFECT'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column addition forms */}
          <div className="card-5bloc space-y-5">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber border-b pb-2 mb-2">
              Log Record Details
            </h3>

            {activeSubTab === 'visits' && (
              <form onSubmit={handleAddVisit} className="space-y-4">
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Supervisor</label>
                  <input
                    type="text"
                    required
                    value={newVisit.supervisor}
                    onChange={e => setNewVisit(prev => ({ ...prev, supervisor: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">GPS Coordinates</label>
                  <input
                    type="text"
                    required
                    value={newVisit.gps_coordinates}
                    onChange={e => setNewVisit(prev => ({ ...prev, gps_coordinates: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Observations *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe inspection highlights..."
                    value={newVisit.observations}
                    onChange={e => setNewVisit(prev => ({ ...prev, observations: e.target.value }))}
                    className="input-5bloc text-xs resize-none"
                  />
                </div>
                <button type="submit" disabled={submitting} className="w-full btn-primary py-2 text-xs font-bold">
                  {submitting ? 'SUBMITTING…' : 'SUBMIT VISIT REPORT'}
                </button>
              </form>
            )}

            {activeSubTab === 'materials' && (
              <form onSubmit={handleAddMaterial} className="space-y-4">
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Material Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Structural Rebars FE 500"
                    value={newMaterial.material_name}
                    onChange={e => setNewMaterial(prev => ({ ...prev, material_name: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Specified Spec Standard *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Tiscon FE 500D"
                    value={newMaterial.specified_standard}
                    onChange={e => setNewMaterial(prev => ({ ...prev, specified_standard: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Delivered Material *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Generic local rebar"
                    value={newMaterial.delivered_material}
                    onChange={e => setNewMaterial(prev => ({ ...prev, delivered_material: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs"
                  />
                </div>
                <button type="submit" disabled={submitting} className="w-full btn-primary py-2 text-xs font-bold">
                  {submitting ? 'LOGGING…' : 'LOG MATERIAL DELIVERY'}
                </button>
              </form>
            )}

            {activeSubTab === 'punch' && (
              <form onSubmit={handleAddPunch} className="space-y-4">
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Defect Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Uneven joint grout in marble"
                    value={newPunch.defect}
                    onChange={e => setNewPunch(prev => ({ ...prev, defect: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ground floor lobby lift lobby"
                    value={newPunch.location}
                    onChange={e => setNewPunch(prev => ({ ...prev, location: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs"
                  />
                </div>
                <button type="submit" disabled={submitting} className="w-full btn-primary py-2 text-xs font-bold">
                  {submitting ? 'ADDING…' : 'ADD PUNCH ITEM'}
                </button>
              </form>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
