'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

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
  const { toast } = useToast()
  const confirm = useConfirm()

  const [transmittals, setTransmittals] = useState<Transmittal[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [slipPreview, setSlipPreview] = useState<{ no: string; text: string } | null>(null)

  // Form State
  const [newTransmittal, setNewTransmittal] = useState({
    recipient_name: 'Rajesh Kumar',
    recipient_company: 'L&T Construction Ltd',
    via: 'Printed Courier' as Transmittal['via'],
    documents: 'Rebar layout drawing sheets (Grid A to D) - v2',
    purpose: 'For Construction' as Transmittal['purpose'],
    date: new Date().toISOString().split('T')[0]
  })

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/transmittals`)
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to load the dispatch registry')
      setTransmittals(d.transmittals || [])
    } catch (e) {
      setLoadError(e)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const handleCreateTransmittal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/transmittals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransmittal),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || 'Failed to create the transmittal', 'error')
        return
      }
      setTransmittals(prev => [data.transmittal, ...prev])
      setShowFormModal(false)
      setNewTransmittal({
        recipient_name: '',
        recipient_company: '',
        via: 'Email',
        documents: '',
        purpose: 'For Information',
        date: new Date().toISOString().split('T')[0]
      })
      toast(`Transmittal ${data.transmittal?.transmittal_no || ''} issued`.trim(), 'success')
    } catch (err: any) {
      toast(err?.message || 'Failed to create the transmittal', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateStatus = async (t: Transmittal, nextStatus: Transmittal['status']) => {
    if (
      nextStatus === 'acknowledged' &&
      !(await confirm({
        title: 'Acknowledge receipt',
        message: `${t.transmittal_no} will be closed as acknowledged by ${t.recipient_name}. This completes the dispatch record and cannot be reverted from here.`,
        confirmLabel: 'Acknowledge',
      }))
    ) {
      return
    }
    try {
      const res = await fetch(`/api/projects/${projectId}/transmittals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transmittal_id: t.id, status: nextStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast(data.error || 'Could not update the transmittal status', 'error')
        return
      }
      setTransmittals(prev => prev.map(x => x.id === t.id ? { ...x, status: nextStatus } : x))
      toast(nextStatus === 'received' ? 'Marked as received' : 'Receipt acknowledged', 'success')
    } catch (err: any) {
      toast(err?.message || 'Could not update the transmittal status', 'error')
    }
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
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : loadError ? (
            <ErrorState
              compact
              title="Could not load the dispatch registry"
              error={loadError}
              onRetry={load}
            />
          ) : transmittals.length === 0 ? (
            <EmptyState
              icon="local_shipping"
              title="No transmittals issued yet"
              description="Log a dispatch sheet every time drawings leave the office — it records which revision went out, to whom, and for what purpose."
              actionLabel="Log dispatch sheet"
              onClick={() => setShowFormModal(true)}
            />
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
                          onClick={() => handleUpdateStatus(t, 'received')}
                          className="bg-amber/15 hover:bg-amber/25 text-amber border border-amber/30 px-2 py-1 text-[9px] font-mono font-bold uppercase transition"
                        >
                          Mark Received
                        </button>
                      )}
                      {t.status === 'received' && (
                        <button
                          onClick={() => handleUpdateStatus(t, 'acknowledged')}
                          className="bg-success/15 hover:bg-success/25 text-success border border-success/30 px-2 py-1 text-[9px] font-mono font-bold uppercase transition"
                        >
                          Acknowledge Receipt
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const slip = [
                            `TRANSMITTAL ${t.transmittal_no}`,
                            `Date: ${t.date}`,
                            `To: ${t.recipient_name} (${t.recipient_company})`,
                            `Via: ${t.via}`,
                            `Purpose: ${t.purpose}`,
                            `Documents: ${t.documents}`,
                            `Status: ${t.status}`,
                            '',
                            'Print this slip or save as PDF via your browser (Ctrl/Cmd+P).',
                          ].join('\n')
                          const w = window.open('', '_blank', 'noopener,noreferrer,width=640,height=720')
                          if (!w) {
                            setSlipPreview({ no: t.transmittal_no, text: slip })
                            toast('Pop-up blocked — showing the slip here instead', 'warning')
                            return
                          }
                          w.document.write(`<pre style="font:12px/1.5 ui-monospace,monospace;padding:24px;white-space:pre-wrap">${slip.replace(/</g, '&lt;')}</pre>`)
                          w.document.close()
                          w.focus()
                          w.print()
                        }}
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

      {slipPreview && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-md bg-navy-mid border p-6 space-y-4 rounded-2xl">
            <div className="border-b pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold font-mono text-amber uppercase tracking-wider">
                  Transmittal slip
                </h3>
                <p className="text-[10px] text-stone mt-0.5 font-mono">
                  Allow pop-ups for this site to print directly.
                </p>
              </div>
              <button onClick={() => setSlipPreview(null)} className="text-stone hover:text-white transition">
                <span className="material-icons-outlined text-[18px]">close</span>
              </button>
            </div>

            <pre
              className="text-[11px] leading-relaxed whitespace-pre-wrap p-3 border font-mono max-h-72 overflow-y-auto"
              style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
            >
              {slipPreview.text}
            </pre>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary py-1.5 px-4 text-xs"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(slipPreview.text)
                    toast('Slip copied to clipboard', 'success')
                  } catch {
                    toast('Could not copy the slip — select the text and copy manually', 'error')
                  }
                }}
              >
                Copy slip
              </button>
              <button
                type="button"
                className="btn-primary py-1.5 px-6 text-xs font-bold"
                onClick={() => setSlipPreview(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Creator Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-md bg-navy-mid border p-6 space-y-4 rounded-2xl">
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
                  className="w-full bg-navy border text-xs text-white p-3 focus:outline-none resize-none"
                  style={{ borderRadius: '12px' }}
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
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  disabled={creating}
                  className="btn-secondary py-1.5 px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary py-1.5 px-6 text-xs font-bold font-mono"
                >
                  {creating ? 'ISSUING…' : 'ISSUE SHEET'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
