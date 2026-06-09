'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Transmittal {
  id: string
  transmittal_no: string
  date: string
  recipient_name: string
  recipient_company: string
  via: 'Email' | 'Printed Courier' | 'Hand Delivered' | 'Digital Portal'
  documents: string
  purpose: 'For Construction' | 'For Approval' | 'For Information' | 'For Review'
  status: 'sent' | 'received' | 'acknowledged'
}

export default function TransmittalsLog() {
  const params = useParams()
  const projectId = params.id as string

  const [transmittals, setTransmittals] = useState<Transmittal[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)

  // Form State
  const [newTransmittal, setNewTransmittal] = useState({
    recipient_name: 'Rajesh Kumar',
    recipient_company: 'L&T Construction Ltd',
    via: 'Printed Courier' as Transmittal['via'],
    documents: 'Rebar layout drawing sheets (Grid A to D) - v2',
    purpose: 'For Construction' as Transmittal['purpose'],
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setTransmittals([
        {
          id: 'tr-1',
          transmittal_no: 'TR-001',
          date: '2026-05-10',
          recipient_name: 'Rajesh Kumar',
          recipient_company: 'L&T Construction Ltd',
          via: 'Printed Courier',
          documents: 'Main Structural Frame Detail Sheets (v2)',
          purpose: 'For Construction',
          status: 'acknowledged'
        },
        {
          id: 'tr-2',
          transmittal_no: 'TR-002',
          date: '2026-05-28',
          recipient_name: 'Karan Shah',
          recipient_company: 'Lodha Developers Office',
          via: 'Digital Portal',
          documents: 'Lobby Interior Finishes Rendering & Plan (v1)',
          purpose: 'For Review',
          status: 'received'
        },
        {
          id: 'tr-3',
          transmittal_no: 'TR-003',
          date: '2026-06-02',
          recipient_name: 'Officer Shinde',
          recipient_company: 'Municipal Fire Department NOC Ward',
          via: 'Hand Delivered',
          documents: 'Emergency Exit & Hydrant Layout Diagram (v1)',
          purpose: 'For Approval',
          status: 'sent'
        }
      ])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [projectId])

  const handleCreateTransmittal = (e: React.FormEvent) => {
    e.preventDefault()

    const record: Transmittal = {
      id: `tr-${Date.now()}`,
      transmittal_no: `TR-00${transmittals.length + 1}`,
      date: newTransmittal.date,
      recipient_name: newTransmittal.recipient_name,
      recipient_company: newTransmittal.recipient_company,
      via: newTransmittal.via,
      documents: newTransmittal.documents,
      purpose: newTransmittal.purpose,
      status: 'sent'
    }

    setTransmittals(prev => [record, ...prev])
    setShowFormModal(false)
    // reset form
    setNewTransmittal({
      recipient_name: '',
      recipient_company: '',
      via: 'Email',
      documents: '',
      purpose: 'For Information',
      date: new Date().toISOString().split('T')[0]
    })
  }

  const handleUpdateStatus = (id: string, nextStatus: Transmittal['status']) => {
    setTransmittals(prev => 
      prev.map(t => t.id === id ? { ...t, status: nextStatus } : t)
    )
  }

  const getStatusBadgeClass = (st: Transmittal['status']) => {
    switch (st) {
      case 'sent': return 'bg-blue/10 text-blue border-blue/30'
      case 'received': return 'bg-amber/10 text-amber border-amber/30'
      case 'acknowledged': return 'bg-success/10 text-success border-success/30'
    }
  }

  const getPurposeBadgeClass = (pr: Transmittal['purpose']) => {
    switch (pr) {
      case 'For Construction': return 'bg-error/10 text-error border-error/20 font-bold'
      case 'For Approval': return 'bg-amber/10 text-amber border-amber/20'
      case 'For Review': return 'bg-blue/10 text-blue border-blue/20'
      case 'For Information': return 'bg-stone/10 text-stone border-stone/20'
    }
  }

  return (
    <div className="space-y-6 font-body select-none">
      
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Total Transmittals Issued', value: transmittals.length, sub: 'Legally binding dispatch sheets' },
          { label: 'Awaiting Acknowledgment', value: transmittals.filter(t => t.status !== 'acknowledged').length, sub: 'Pending receipt verification' },
          { label: 'Construction Releases', value: transmittals.filter(t => t.purpose === 'For Construction').length, sub: 'Active blueprints on construction site' }
        ].map((kpi, idx) => (
          <div key={idx} className="card-5bloc p-4">
            <span className="text-[10px] text-stone font-mono uppercase tracking-wider">{kpi.label}</span>
            <h4 className="text-lg font-bold text-white mt-1 font-mono">{kpi.value}</h4>
            <p className="text-[10px] text-stone mt-1 font-mono">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Table of issued transmittals */}
        <div className="lg:col-span-2 card-5bloc space-y-4">
          <div className="border-b pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Transmittals Dispatch Registry</h3>
              <p className="text-[10px] text-stone mt-0.5 font-mono">Formal verification records of drawings and specifications dispatch.</p>
            </div>
            <button
              onClick={() => setShowFormModal(true)}
              className="btn-primary py-1.5 px-4 text-xs font-mono font-bold"
            >
              LOG DISPATCH SHEET
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-stone animate-pulse">Loading dispatch sheets...</div>
          ) : transmittals.length === 0 ? (
            <div className="py-12 text-center text-stone font-mono">No document dispatch transmittals issued.</div>
          ) : (
            <div className="divide-y divide-navy-lt/30">
              {transmittals.map(t => (
                <div key={t.id} className="py-4 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-white font-bold text-xs">{t.transmittal_no}</span>
                      <span className="text-[10px] font-mono text-stone">Date: {t.date}</span>
                      <span className="text-[10px] text-stone">via <span className="font-mono font-semibold text-white">{t.via}</span></span>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 border text-[9px] font-mono font-semibold uppercase ${getPurposeBadgeClass(t.purpose)}`}>
                        {t.purpose}
                      </span>
                      <span className={`px-2 py-0.5 border text-[9px] font-mono font-semibold uppercase ${getStatusBadgeClass(t.status)}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] text-stone font-mono uppercase block">Transmitted Documents</span>
                    <p className="text-xs font-semibold text-white mt-0.5 leading-relaxed">{t.documents}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-navy/20 p-2.5 border">
                    <div className="text-[11px] text-stone">
                      <span>Recipient: </span>
                      <span className="font-semibold text-white">{t.recipient_name}</span>
                      <span> ({t.recipient_company})</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {t.status === 'sent' && (
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'received')}
                          className="bg-amber/15 hover:bg-amber/25 text-amber border border-amber/30 px-2 py-1 text-[9px] font-mono font-bold uppercase transition"
                        >
                          Mark Received
                        </button>
                      )}
                      {t.status === 'received' && (
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'acknowledged')}
                          className="bg-success/15 hover:bg-success/25 text-success border border-success/30 px-2 py-1 text-[9px] font-mono font-bold uppercase transition"
                        >
                          Acknowledge Receipt
                        </button>
                      )}
                      <button
                        onClick={() => alert(`Simulating print-friendly transmittal slip generation for ${t.transmittal_no}`)}
                        className="p-1 text-stone hover:text-white hover:bg-navy-lt transition shrink-0"
                        title="Print Transmittal Slip"
                      >
                        <span className="material-icons-outlined text-[16px]">print</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Informational context block */}
        <div className="card-5bloc space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-xs font-bold font-mono text-amber uppercase tracking-wider">AEC Legal Protection</h3>
            <p className="text-[10px] text-stone mt-0.5 font-mono">Drawing transmission liability rules.</p>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-stone">
            <p>
              A **Transmittal Sheet** serves as proof of delivery in the construction industry, establishing:
            </p>
            <ul className="list-disc pl-4 space-y-1.5 font-mono text-[10px]">
              <li>Which version/revision was sent to site</li>
              <li>Official release date of the blueprints</li>
              <li>Intent (e.g. "For construction" vs. "For information")</li>
            </ul>
            <div className="p-3 bg-navy/40 border text-[10px] text-amber border-amber/25 font-mono">
              <strong>IMPORTANT:</strong> Releasing drawings "For Construction" without municipal permits clear NOCs creates liabilities. Verify clearances on the Permits tab first.
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Creator Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-navy-mid border p-6 space-y-4">
            <div className="border-b pb-3 flex justify-between items-center">
              <h3 className="text-xs font-bold font-mono text-amber uppercase tracking-wider">Create Transmittal Sheet</h3>
              <button onClick={() => setShowFormModal(false)} className="text-stone hover:text-white transition">
                <span className="material-icons-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTransmittal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={newTransmittal.recipient_name}
                    onChange={e => setNewTransmittal(prev => ({ ...prev, recipient_name: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Recipient Company *</label>
                  <input
                    type="text"
                    required
                    value={newTransmittal.recipient_company}
                    onChange={e => setNewTransmittal(prev => ({ ...prev, recipient_company: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Documents Transmitted *</label>
                <textarea
                  required
                  rows={2}
                  value={newTransmittal.documents}
                  placeholder="Detail drawing name, sheet numbers and revision codes..."
                  onChange={e => setNewTransmittal(prev => ({ ...prev, documents: e.target.value }))}
                  className="w-full bg-[#141E30] border text-xs text-white p-2 focus:outline-none resize-none"
                  style={{ borderRadius: '0px' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Method of Sent *</label>
                  <select
                    value={newTransmittal.via}
                    onChange={e => setNewTransmittal(prev => ({ ...prev, via: e.target.value as Transmittal['via'] }))}
                    className="input-5bloc py-1.5 text-xs font-mono"
                  >
                    <option value="Email">Email</option>
                    <option value="Printed Courier">Printed Courier</option>
                    <option value="Hand Delivered">Hand Delivered</option>
                    <option value="Digital Portal">Digital Portal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Purpose of Issue *</label>
                  <select
                    value={newTransmittal.purpose}
                    onChange={e => setNewTransmittal(prev => ({ ...prev, purpose: e.target.value as Transmittal['purpose'] }))}
                    className="input-5bloc py-1.5 text-xs font-mono"
                  >
                    <option value="For Information">For Information</option>
                    <option value="For Review">For Review</option>
                    <option value="For Approval">For Approval</option>
                    <option value="For Construction">For Construction</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Dispatch Date</label>
                <input
                  type="date"
                  value={newTransmittal.date}
                  onChange={e => setNewTransmittal(prev => ({ ...prev, date: e.target.value }))}
                  className="input-5bloc py-1.5 text-xs font-mono"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setShowFormModal(false)} className="btn-secondary py-1.5 px-4 text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-1.5 px-6 text-xs font-bold font-mono">
                  ISSUE SHEET
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
