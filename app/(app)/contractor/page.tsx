'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

type Tender = {
  id: string
  title: string
  scope?: string
  trade_type?: string
  services?: string[]
  budget_min?: number
  budget_max?: number
  deadline?: string
  city?: string
  project_name?: string
  status: string
  my_bid?: { id: string; amount: number; status: string } | null
}

type Bid = {
  id: string
  tender_title?: string
  tenders?: { title?: string } | null
  amount: number
  status: string
  created_at: string
}

const money = (v?: number | null) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '—')

export default function ContractorDashboard() {
  const [tenders, setTenders] = useState<Tender[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loadingTenders, setLoadingTenders] = useState(true)
  const [loadingBids, setLoadingBids] = useState(true)
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [tendersError, setTendersError] = useState<unknown>(null)
  const [bidsError, setBidsError] = useState<unknown>(null)
  const [projectsError, setProjectsError] = useState<unknown>(null)

  const loadTenders = useCallback(async () => {
    setLoadingTenders(true)
    setTendersError(null)
    try {
      const res = await fetch('/api/tenders?marketplace=1')
      if (!res.ok) throw new Error('Could not load open projects')
      const t = await res.json()
      setTenders(t.tenders || [])
    } catch (err) {
      setTendersError(err)
    } finally {
      setLoadingTenders(false)
    }
  }, [])

  const loadBids = useCallback(async () => {
    setLoadingBids(true)
    setBidsError(null)
    try {
      const res = await fetch('/api/bids')
      if (!res.ok) throw new Error('Could not load your bids')
      const b = await res.json()
      setBids(b.bids || [])
    } catch (err) {
      setBidsError(err)
    } finally {
      setLoadingBids(false)
    }
  }, [])

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true)
    setProjectsError(null)
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Could not load your projects')
      const p = await res.json()
      setProjects(p.projects || [])
    } catch (err) {
      setProjectsError(err)
    } finally {
      setLoadingProjects(false)
    }
  }, [])

  useEffect(() => {
    loadTenders()
    loadBids()
    loadProjects()
  }, [loadTenders, loadBids, loadProjects])

  const openToBid = tenders.filter((t) => !t.my_bid)

  const stats = [
    { label: 'Open for service', value: openToBid.length, pending: loadingTenders, failed: !!tendersError },
    { label: 'My bids', value: bids.length, pending: loadingBids, failed: !!bidsError },
    { label: 'Active projects', value: projects.length, pending: loadingProjects, failed: !!projectsError },
  ]

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-[36px]" style={{ color: 'var(--on-surface)' }}>
          Contractor workspace
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
          Projects open for service, your bids, and invited workspaces — in one place.
        </p>
      </div>

      <section className="grid md:grid-cols-3 gap-4">
        {stats.map((k) => (
          <div
            key={k.label}
            className="p-5 rounded-2xl"
            style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-2)' }}
          >
            <p className="text-[12px]" style={{ color: 'var(--stone)' }}>
              {k.label}
            </p>
            {k.pending ? (
              <Skeleton className="h-8 w-16 mt-2" />
            ) : (
              <p className="text-[28px] font-semibold mt-1" style={{ color: 'var(--on-surface)' }}>
                {k.failed ? '—' : k.value}
              </p>
            )}
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Projects open for service</h2>
          <Link href="/marketplace" className="text-[12px]" style={{ color: 'var(--amber)' }}>
            Browse marketplace
          </Link>
        </div>
        {loadingTenders ? (
          <div className="grid md:grid-cols-2 gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : tendersError ? (
          <ErrorState
            title="Could not load open projects"
            description="There may well be work out there — we just could not reach the marketplace."
            error={tendersError}
            onRetry={loadTenders}
          />
        ) : tenders.length === 0 ? (
          <EmptyState
            icon="storefront"
            title="Nothing open for bidding right now"
            description="When an architect posts a project for open bidding in your trades and cities, it shows up here. Keep your vendor profile current so you surface in their search."
            actionLabel="Update vendor profile"
            href="/contractor/profile"
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {tenders.map((t) => {
              const services = t.services?.length ? t.services : t.trade_type ? [t.trade_type] : []
              return (
                <Link
                  key={t.id}
                  href={`/marketplace/tenders/${t.id}`}
                  className="p-5 rounded-2xl flex flex-col justify-between gap-3"
                  style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-2)' }}
                >
                  <div>
                    <p className="font-semibold text-lg">{t.project_name || t.title}</p>
                    <p className="text-[12px] mt-1" style={{ color: 'var(--stone)' }}>
                      {t.city || '—'} · Bid due {t.deadline || 'Open'}
                    </p>
                    {t.scope && (
                      <p className="text-[12px] mt-2 line-clamp-2" style={{ color: 'var(--stone)' }}>
                        {t.scope}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {services.map((s) => (
                        <span key={s} className="chip text-[10px]" style={{ color: 'var(--amber)' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                    {(t.budget_min || t.budget_max) && (
                      <p className="text-[12px] mt-2" style={{ color: 'var(--stone)' }}>
                        Budget {money(t.budget_min)} – {money(t.budget_max)}
                      </p>
                    )}
                  </div>
                  <span
                    className="chip text-[11px] w-fit"
                    style={
                      t.my_bid
                        ? { color: 'var(--success)', background: 'rgba(46,204,138,0.12)' }
                        : { color: 'var(--amber)', background: 'rgba(245,166,35,0.12)' }
                    }
                  >
                    {t.my_bid ? `Bid submitted · ${money(t.my_bid.amount)}` : 'View details & bid'}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent bids</h2>
          <Link href="/contractor/bids" className="text-[12px]" style={{ color: 'var(--amber)' }}>
            View all
          </Link>
        </div>
        {loadingBids ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : bidsError ? (
          <ErrorState
            title="Could not load your bids"
            description="Any bid you have already submitted is safe — this is only a display problem."
            error={bidsError}
            onRetry={loadBids}
          />
        ) : bids.length === 0 ? (
          <EmptyState
            icon="gavel"
            title="You have not bid on anything yet"
            description="Open a project above to read the scope, drawings and budget, then submit your price and timeline. Architects usually shortlist within a week."
          />
        ) : (
          <div className="space-y-2">
            {bids.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="px-4 py-3 rounded-xl flex justify-between"
                style={{ background: 'var(--surface-container-low)' }}
              >
                <span className="text-sm">{b.tender_title || b.tenders?.title || 'Project'}</span>
                <span className="text-sm" style={{ color: 'var(--amber)' }}>
                  {money(b.amount)} · {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Invited projects</h2>
        {loadingProjects ? (
          <div className="grid md:grid-cols-2 gap-3">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : projectsError ? (
          <ErrorState
            title="Could not load your invited projects"
            description="You have not lost access to anything — the request just failed."
            error={projectsError}
            onRetry={loadProjects}
          />
        ) : projects.length === 0 ? (
          <EmptyState
            icon="handshake"
            title="No project invites yet"
            description="Once an architect awards you a bid or adds you to a site team, the project workspace — drawings, RFIs and documents — opens up here."
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {projects.map((p) => (
              <div key={p.id} className="p-4 rounded-xl" style={{ background: 'var(--surface-container)' }}>
                <p className="font-semibold">{p.name}</p>
                <p className="text-[12px] mt-1" style={{ color: 'var(--stone)' }}>
                  {p.city} · {p.phase?.replaceAll('_', ' ')}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link href={`/projects/${p.id}/documents`} className="btn-secondary text-[11px]">
                    Documents
                  </Link>
                  <Link href={`/projects/${p.id}/rfis`} className="btn-secondary text-[11px]">
                    RFIs
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
