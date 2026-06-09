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
    // Mock load permit checkpoints
    const timer = setTimeout(() => {
      setReraNum(projectId === 'proj-2' ? 'PRM/KA/RERA/1251/310' : 'P51800012345')
      setReraRegistered(projectId !== 'proj-3')

      setPermits([
        {
          id: 'p-1',
          approval_name: 'Municipal Building Sanction (IOD)',
          authority: 'BMC Mumbai / PMC Pune',
          status: 'approved',
          submission_date: '2026-01-20',
          expiry_date: '2027-01-20',
          notes: 'Initial construction approval and drawings signed off by planning body.'
        },
        {
          id: 'p-2',
          approval_name: 'Fire Department NOC Clearance',
          authority: 'Maharashtra Fire Services',
          status: 'approved',
          submission_date: '2026-03-10',
          notes: 'Temporary NOC obtained for superstructure casting heights.'
        },
        {
          id: 'p-3',
          approval_name: 'RERA Promoter Registration',
          authority: 'MahaRERA',
          status: projectId === 'proj-3' ? 'not_started' : 'approved',
          submission_date: projectId === 'proj-3' ? undefined : '2026-02-14',
          notes: projectId === 'proj-3' ? 'Awaiting builder submission files.' : 'RERA registration certified active.'
        },
        {
          id: 'p-4',
          approval_name: 'Tree Authority Clearance',
          authority: 'Municipal Corporation Green Committee',
          status: 'pending',
          submission_date: '2026-05-28',
          notes: 'Under review by ward officers regarding layout site offset trees.'
        },
        {
          id: 'p-5',
          approval_name: 'Final Occupancy Certificate (OC)',
          authority: 'Local Municipal Commissioner Office',
          status: 'not_started',
          notes: 'Requires snag audits and structural engineer Form-4 completion.'
        }
      ])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [projectId])

  const handleTogglePermitStatus = (id: string, newStatus: PermitItem['status']) => {
    setPermits(prev => 
      prev.map(p => p.id === id ? { ...p, status: newStatus } : p)
    )
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
              onClick={() => alert(`Simulated checking project dimensions against local ${selectedState} zoning guidelines...`)}
              className="w-full btn-primary py-2 text-xs font-bold flex items-center justify-center gap-1"
            >
              <span className="material-icons-outlined text-[15px]">verified_user</span>
              AUDIT COMPLIANCE DIMENSIONS
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
