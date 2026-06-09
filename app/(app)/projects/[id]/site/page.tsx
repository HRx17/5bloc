'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

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

  const [activeSubTab, setActiveSubTab] = useState<'visits' | 'materials' | 'punch'>('visits')
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    // Mock load site logs
    const timer = setTimeout(() => {
      setVisitReports([
        {
          id: 'v-1',
          visit_number: 1,
          date: '2026-05-15',
          supervisor: 'Parth Patel',
          gps_coordinates: '19.0542° N, 72.8225° E (Bandra)',
          observations: 'Inspected lobby column castings and grid framework lines. Rebar counts match the S-201 structural specs.',
          photos: ['inspection_lobby_col.jpg']
        },
        {
          id: 'v-2',
          visit_number: 2,
          date: '2026-06-05',
          supervisor: 'Amit Sharma',
          gps_coordinates: '19.0543° N, 72.8227° E',
          observations: 'Reviewed concrete curing logs. Moisture levels are sufficient. Grouting scheduled for next floor column foundations.',
          photos: ['curing_slabs.jpg']
        }
      ])

      setMaterialLogs([
        {
          id: 'm-1',
          material_name: 'OPC 53 Cement',
          specified_standard: 'UltraTech Cement OPC 53',
          delivered_material: 'Ambuja Cement OPC 53',
          status: 'compliant',
          contractor: 'Amit Sharma',
          notes: 'Substituted for Ambuja due to delivery lead times. Confirmed equivalent grade.'
        },
        {
          id: 'm-2',
          material_name: 'Lobby sanitary plumbing fixtures',
          specified_standard: 'Kohler Premium Series Faucets',
          delivered_material: 'Generic Cera Brand Faucets',
          status: 'substitution_flagged',
          contractor: 'Amit Sharma (Civil)',
          notes: 'Warning: Contractor substituted generic brand without design office approval.'
        }
      ])

      setPunchList([
        {
          id: 'p-1',
          item_number: 1,
          defect: 'Lobby wall plaster unevenness',
          location: 'Main Reception Lobby, east wall',
          assigned_to: 'Amit Sharma (Contractor)',
          status: 'open',
          photo: 'plaster_defect.jpg'
        },
        {
          id: 'p-2',
          item_number: 2,
          defect: 'Service shaft door hinges alignment loose',
          location: '3rd Floor electrical shaft',
          assigned_to: 'Amit Sharma (Contractor)',
          status: 'resolved'
        }
      ])

      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [projectId])

  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault()
    const record: VisitReport = {
      id: `v-${Date.now()}`,
      visit_number: visitReports.length + 1,
      date: new Date().toISOString().split('T')[0],
      supervisor: newVisit.supervisor,
      gps_coordinates: newVisit.gps_coordinates,
      observations: newVisit.observations,
      photos: ['site_snap_capture.jpg']
    }
    setVisitReports(prev => [record, ...prev])
    setNewVisit(prev => ({ ...prev, observations: '' }))
    alert('Site visit report registered and archived successfully.')
  }

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault()
    const record: MaterialLog = {
      id: `m-${Date.now()}`,
      material_name: newMaterial.material_name,
      specified_standard: newMaterial.specified_standard,
      delivered_material: newMaterial.delivered_material,
      status: 'pending_testing',
      contractor: newMaterial.contractor
    }
    setMaterialLogs(prev => [record, ...prev])
    setNewMaterial({ material_name: '', specified_standard: '', delivered_material: '', contractor: 'Amit Sharma' })
    alert('Material delivery logged and flagged for compliance checks.')
  }

  const handleAddPunch = (e: React.FormEvent) => {
    e.preventDefault()
    const record: PunchItem = {
      id: `p-${Date.now()}`,
      item_number: punchList.length + 1,
      defect: newPunch.defect,
      location: newPunch.location,
      assigned_to: newPunch.assigned_to,
      status: 'open'
    }
    setPunchList(prev => [record, ...prev])
    setNewPunch({ defect: '', location: '', assigned_to: 'Amit Sharma' })
    alert('Punch list defect logged and assigned to contractor.')
  }

  const handleTogglePunch = (pId: string) => {
    setPunchList(prev =>
      prev.map(item => item.id === pId ? { ...item, status: item.status === 'open' ? 'resolved' : 'open' } : item)
    )
  }

  const handleFlagSubstitution = (mId: string) => {
    setMaterialLogs(prev =>
      prev.map(item => item.id === mId ? { ...item, status: item.status === 'substitution_flagged' ? 'compliant' : 'substitution_flagged' } : item)
    )
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
        <div className="p-8 text-center text-stone animate-pulse">Loading site reports...</div>
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
                        {visit.photos.map(p => (
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
                <button type="submit" className="w-full btn-primary py-2 text-xs font-bold">
                  SUBMIT VISIT REPORT
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
                <button type="submit" className="w-full btn-primary py-2 text-xs font-bold">
                  LOG MATERIAL DELIVERY
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
                <button type="submit" className="w-full btn-primary py-2 text-xs font-bold">
                  ADD PUNCH ITEM
                </button>
              </form>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
