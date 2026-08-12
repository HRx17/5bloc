'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

export default function ContractorBidsPage() {
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bids')
      if (!res.ok) throw new Error('Could not load your bids')
      const d = await res.json()
      setBids(d.bids || [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-[32px] mb-2">My bids</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--stone)' }}>
        Track submitted, shortlisted, accepted and rejected bids.
      </p>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load your bids"
          description="Your submitted bids are safe — we just could not fetch them right now."
          error={error}
          onRetry={load}
        />
      ) : bids.length === 0 ? (
        <EmptyState
          icon="gavel"
          title="No bids submitted yet"
          description="Browse projects open for service, read the scope and drawings, then send your price and timeline. Everything you submit is tracked here through shortlisting and award."
          actionLabel="Find work to bid on"
          href="/contractor"
        />
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
