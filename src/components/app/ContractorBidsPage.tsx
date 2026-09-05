import React, { useCallback, useEffect, useState } from 'react'
import { ErrorState } from '@/components/ui5/ErrorState'
import { EmptyState } from '@/components/ui5/EmptyState'
import { Skeleton } from '@/components/ui5/Skeleton'
import { useLiveReload } from '@/lib/live/useLiveReload'

export default function ContractorBidsPage() {
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true)
      setError(null)
    }
    try {
      const res = await fetch('/api/bids')
      if (!res.ok) throw new Error('Could not load your bids')
      const d = await res.json()
      setBids(d.bids || [])
    } catch (err) {
      if (!opts?.quiet) setError(err)
    } finally {
      if (!opts?.quiet) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useLiveReload(load, ['bids', 'tenders'])

  return (
    <div className="page-m">
      <h1 className="page-m-title">My bids</h1>
      <p className="page-m-sub mb-6">
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
        <div className="card-m overflow-x-auto">
          <table className="table-m">
            <thead>
              <tr>
                <th>Tender</th>
                <th>Amount</th>
                <th>Timeline</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((b) => (
                <tr key={b.id}>
                  <td>{b.tender_title || b.tenders?.title || '—'}</td>
                  <td>₹{Number(b.amount).toLocaleString()}</td>
                  <td>{b.timeline_weeks ? `${b.timeline_weeks} wks` : '—'}</td>
                  <td className="capitalize">
                    <span className="chip-m chip-m-amber">{b.status}</span>
                  </td>
                  <td style={{ color: 'var(--stone)' }}>
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
