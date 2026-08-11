'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/tenders?marketplace=1').then((r) => r.json()),
      fetch('/api/bids').then((r) => r.json()),
      fetch('/api/projects').then((r) => r.json()),
    ])
      .then(([t, b, p]) => {
        setTenders(t.tenders || [])
        setBids(b.bids || [])
        setProjects(p.projects || [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8" style={{ color: 'var(--stone)' }}>
        Loading contractor workspace…
      </div>
    )
  }

  const openToBid = tenders.filter((t) => !t.my_bid)

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
        {[
          { label: 'Open for service', value: openToBid.length },
          { label: 'My bids', value: bids.length },
          { label: 'Active projects', value: projects.length },
        ].map((k) => (
          <div
            key={k.label}
            className="p-5 rounded-2xl"
            style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-2)' }}
          >
            <p className="text-[12px]" style={{ color: 'var(--stone)' }}>
              {k.label}
            </p>
            <p className="text-[28px] font-semibold mt-1" style={{ color: 'var(--on-surface)' }}>
              {k.value}
            </p>
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
        {tenders.length === 0 ? (
          <Empty
            title="No open projects yet"
            body="When architects post a project for open bidding, it appears here as a card you can bid on."
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
        {bids.length === 0 ? (
          <Empty title="No bids yet" body="Open a project above to review the scope and submit your first bid." />
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
        {projects.length === 0 ? (
          <Empty
            title="No project invites yet"
            body="When an architect awards your bid or invites you, projects appear here."
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

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-8 rounded-2xl text-center" style={{ background: 'var(--surface-container)' }}>
      <p className="font-semibold">{title}</p>
      <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
        {body}
      </p>
    </div>
  )
}
