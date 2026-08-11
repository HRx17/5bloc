'use client'

import React, { useEffect, useState } from 'react'

export default function ContractorBidsPage() {
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bids')
      .then((r) => r.json())
      .then((d) => setBids(d.bids || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-[32px] mb-2">My bids</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--stone)' }}>
        Track submitted, shortlisted, accepted and rejected bids.
      </p>
      {loading ? (
        <p style={{ color: 'var(--stone)' }}>Loading…</p>
      ) : bids.length === 0 ? (
        <div className="p-8 rounded-2xl" style={{ background: 'var(--surface-container)' }}>
          No bids yet. Open tenders from your contractor dashboard.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl" style={{ background: 'var(--surface-container)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--stone)' }}>
                <th className="text-left p-4">Tender</th>
                <th className="text-left p-4">Amount</th>
                <th className="text-left p-4">Timeline</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((b) => (
                <tr key={b.id} style={{ boxShadow: 'inset 0 1px 0 rgba(159,142,122,0.08)' }}>
                  <td className="p-4">{b.tender_title || b.tenders?.title || '—'}</td>
                  <td className="p-4">₹{Number(b.amount).toLocaleString()}</td>
                  <td className="p-4">{b.timeline_weeks ? `${b.timeline_weeks} wks` : '—'}</td>
                  <td className="p-4 capitalize" style={{ color: 'var(--amber)' }}>
                    {b.status}
                  </td>
                  <td className="p-4" style={{ color: 'var(--stone)' }}>
                    {b.created_at?.slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
