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
}

type Bid = {
  id: string
  tender_title?: string
  amount: number
  status: string
  created_at: string
}

export default function ContractorDashboard() {
  const [tenders, setTenders] = useState<Tender[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bidForm, setBidForm] = useState<{ tenderId: string; amount: string; weeks: string; methodology: string } | null>(null)
  const [message, setMessage] = useState('')

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

  const submitBid = async () => {
    if (!bidForm) return
    const res = await fetch('/api/bids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tender_id: bidForm.tenderId,
        amount: Number(bidForm.amount),
        timeline_weeks: Number(bidForm.weeks) || null,
        methodology: bidForm.methodology,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage(data.error || 'Bid failed')
      return
    }
    setMessage('Bid submitted')
    setBidForm(null)
    const b = await fetch('/api/bids').then((r) => r.json())
    setBids(b.bids || [])
  }

  if (loading) {
    return (
      <div className="p-8" style={{ color: 'var(--stone)' }}>
        Loading contractor workspace…
      </div>
    )
  }

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

      {message && (
        <div className="chip" style={{ color: 'var(--amber)', background: 'rgba(245,166,35,0.1)' }}>
          {message}
        </div>
      )}

      <section className="grid md:grid-cols-3 gap-4">
        {[
          { label: 'Open for service', value: tenders.length },
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
              <div
                key={t.id}
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
                      Budget ₹{(t.budget_min || 0).toLocaleString()} – ₹{(t.budget_max || 0).toLocaleString()}
                    </p>
                  )}
                </div>
                <button className="btn-primary text-[12px] self-start" onClick={() => setBidForm({ tenderId: t.id, amount: '', weeks: '', methodology: '' })}>
                  Submit bid
                </button>
              </div>
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
          <Empty title="No bids yet" body="Submit your first bid on an open tender." />
        ) : (
          <div className="space-y-2">
            {bids.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="px-4 py-3 rounded-xl flex justify-between"
                style={{ background: 'var(--surface-container-low)' }}
              >
                <span className="text-sm">{b.tender_title || 'Tender'}</span>
                <span className="text-sm" style={{ color: 'var(--amber)' }}>
                  ₹{Number(b.amount).toLocaleString()} · {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Invited projects</h2>
        {projects.length === 0 ? (
          <Empty title="No project invites yet" body="When an architect awards your bid or invites you, projects appear here." />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {projects.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl"
                style={{ background: 'var(--surface-container)' }}
              >
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

      {bidForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl space-y-3" style={{ background: 'var(--surface-container-high)' }}>
            <h3 className="font-semibold text-lg">Submit bid</h3>
            <input
              className="input-5bloc"
              placeholder="Amount (₹)"
              value={bidForm.amount}
              onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
            />
            <input
              className="input-5bloc"
              placeholder="Timeline (weeks)"
              value={bidForm.weeks}
              onChange={(e) => setBidForm({ ...bidForm, weeks: e.target.value })}
            />
            <textarea
              className="input-5bloc min-h-[90px]"
              placeholder="Methodology"
              value={bidForm.methodology}
              onChange={(e) => setBidForm({ ...bidForm, methodology: e.target.value })}
            />
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setBidForm(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={submitBid}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
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
