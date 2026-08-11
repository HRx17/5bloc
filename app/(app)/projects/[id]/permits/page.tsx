'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface PermitItem {
  id: string
  approval_name: string
  authority: string
  status: 'not_started' | 'pending' | 'approved' | 'expired'
  submission_date?: string
  expiry_date?: string
  notes?: string
}

export default function PermitsAndCompliance() {
  const params = useParams()
  const projectId = params.id as string

  const [permits, setPermits] = useState<PermitItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedState, setSelectedState] = useState('Maharashtra')
  const [reraRegistered, setReraRegistered] = useState(true)
  const [reraNum, setReraNum] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/permits`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}`).then((r) => r.json()),
    ])
      .then(([p, proj]) => {
        setPermits(p.permits || [])
        const project = proj.project
        if (project) {
          setReraRegistered(!!project.is_rera_registered)
          setReraNum(project.rera_number || '')
          if (project.state) setSelectedState(project.state === 'MH' ? 'Maharashtra' : project.state)
        }
      })
      .finally(() => setLoading(false))
  }, [projectId])

  const handleTogglePermitStatus = async (id: string, newStatus: PermitItem['status']) => {
    const res = await fetch(`/api/projects/${projectId}/permits`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permit_id: id, status: newStatus }),
    })
    if (!res.ok) return
    setPermits((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)))
  }

  const seedDefaultPermits = async () => {
    if (permits.length > 0) return
    const defaults = [
      { approval_name: 'Municipal Building Sanction (IOD)', authority: 'Local Municipal Corporation', status: 'not_started' },
      { approval_name: 'Fire Department NOC', authority: 'State Fire Services', status: 'not_started' },
      { approval_name: 'RERA Promoter Registration', authority: 'State RERA', status: 'not_started' },
      { approval_name: 'Final Occupancy Certificate (OC)', authority: 'Municipal Commissioner', status: 'not_started' },
    ]
    const created = []
    for (const d of defaults) {
      const res = await fetch(`/api/projects/${projectId}/permits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d),
      })
      const data = await res.json()
      if (res.ok) created.push(data.permit)
    }
    setPermits(created)
  }

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
          <div key={idx} className="card-5bloc p-4">
            <span className="text-[10px] text-stone font-mono uppercase tracking-wider">{stat.label}</span>
            <h4 className={`text-lg font-bold mt-1 ${stat.color}`}>{stat.value}</h4>
            <p className="text-[10px] text-stone mt-1 font-mono">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Clearances Log table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-5bloc space-y-4">
            <div className="border-b pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Sanction & NOC Checklist</h3>
                <p className="text-[10px] text-stone mt-0.5 font-mono">Verify state building codes and certificate filings.</p>
              </div>
              <span className="label-sm font-bold text-stone">PERMITS: {permits.length}</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-stone animate-pulse">Loading compliance parameters...</div>
            ) : permits.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-sm text-stone">No permits logged yet.</p>
                <button type="button" className="btn-primary text-xs" onClick={seedDefaultPermits}>
                  Seed standard checklist
                </button>
              </div>
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
                          onClick={() => handleTogglePermitStatus(permit.id, 'approved')}
                          className="bg-success/10 hover:bg-success/20 text-success border border-success/30 px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition"
                        >
                          Approve Clearance
                        </button>
                      )}
                      {permit.status !== 'pending' && permit.status !== 'approved' && (
                        <button
                          onClick={() => handleTogglePermitStatus(permit.id, 'pending')}
                          className="bg-amber/10 hover:bg-amber/20 text-amber border border-amber/30 px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition"
                        >
                          Mark as Submitted
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
        <div className="card-5bloc space-y-5">
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
                Zoning Bye-Laws (residential)
              </h4>
              <div className="space-y-2 text-[10px] text-stone font-mono leading-normal">
                <div className="flex justify-between border-b pb-1 border-navy-lt/60">
                  <span>Front Margin Space:</span>
                  <span className="text-white">Min 4.5 meters</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-navy-lt/60">
                  <span>Permissible FSI Limit:</span>
                  <span className="text-white">1.33 base + 0.5 paid TDR</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-navy-lt/60">
                  <span>Maximum Height:</span>
                  <span className="text-white">IS 24m fire safety limit</span>
                </div>
                <div className="flex justify-between">
                  <span>Rainwater Harvesting:</span>
                  <span className="text-success font-bold font-mono">Mandatory for &gt;500 sqm</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const notes = [
                  `${selectedState} zoning quick-check (reference only — verify with local authority)`,
                  '• Front margin: typically ≥ 4.5m for many municipal bye-laws',
                  '• Base FSI often ~1.33 (+ paid TDR where allowed)',
                  '• Height often capped near 24m without special fire NOC',
                  '• RWH commonly mandatory above ~500 sqm plot',
                  '',
                  'This check does not replace a licensed municipal submission.',
                ].join('\n')
                alert(notes)
              }}
              className="w-full btn-primary py-2 text-xs font-bold flex items-center justify-center gap-1"
            >
              <span className="material-icons-outlined text-[15px]">verified_user</span>
              SHOW COMPLIANCE CHECKLIST
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
