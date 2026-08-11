'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

interface Contractor {
  id: string
  company_name: string
  bio: string
  specializations: string[]
  service_cities: string[]
  years_experience: number
  verified: boolean
  badge_active: boolean
  rating: number
  reviews_count: number
  jobs_completed: number
}

export default function Marketplace() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [tenders, setTenders] = useState<any[]>([])
  const [bids, setBids] = useState<any[]>([])
  const [role, setRole] = useState<string>('architect')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCity, setFilterCity] = useState('all')
  const [filterSpec, setFilterSpec] = useState('all')
  const [filterVerified, setFilterVerified] = useState(false)
  const [tab, setTab] = useState<'vendors' | 'tenders' | 'bids'>('vendors')
  const [loading, setLoading] = useState(true)
  const [busyBid, setBusyBid] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [bidForm, setBidForm] = useState<{ tenderId: string; amount: string; weeks: string; methodology: string } | null>(null)

  const isContractor = role === 'contractor'

  const load = async () => {
    setLoading(true)
    try {
      const me = await fetch('/api/me').then((r) => r.json()).catch(() => ({}))
      const nextRole = me.profile?.role || 'architect'
      setRole(nextRole)
      const contractorView = nextRole === 'contractor'
      if (contractorView) setTab('tenders')

      const [c, t, b] = await Promise.all([
        fetch('/api/contractors').then((r) => r.json()),
        fetch(contractorView ? '/api/tenders?marketplace=1' : '/api/tenders?status=all').then((r) => r.json()),
        fetch('/api/bids').then((r) => r.json()),
      ])
      setContractors(c.contractors || [])
      setTenders(t.tenders || [])
      setBids(b.bids || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const cities = useMemo(
    () => Array.from(new Set(contractors.flatMap((c) => c.service_cities || []))),
    [contractors]
  )
  const specs = useMemo(
    () => Array.from(new Set(contractors.flatMap((c) => c.specializations || []))),
    [contractors]
  )

  const filtered = contractors.filter((c) => {
    if (filterVerified && !c.verified) return false
    if (filterCity !== 'all' && !c.service_cities?.includes(filterCity)) return false
    if (filterSpec !== 'all' && !c.specializations?.includes(filterSpec)) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      c.company_name.toLowerCase().includes(q) ||
      c.specializations?.some((s) => s.toLowerCase().includes(q))
    )
  })

  const openTenders = tenders.filter((t) => t.status === 'open' && (t.visibility || 'public') === 'public')
  const reviewBids = bids.filter((b) => b.status === 'submitted' || b.status === 'shortlisted')

  const awardBid = async (bidId: string, status: 'accepted' | 'rejected') => {
    setBusyBid(bidId)
    setMessage('')
    const res = await fetch('/api/bids', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bid_id: bidId,
        status,
        rejection_note: status === 'rejected' ? 'Not selected for this package' : null,
      }),
    })
    const data = await res.json()
    setBusyBid(null)
    if (!res.ok) {
      setMessage(data.error || 'Action failed')
      return
    }
    setMessage(status === 'accepted' ? 'Bid awarded — contractor added to project' : 'Bid rejected')
    await load()
  }

  const submitBid = async () => {
    if (!bidForm) return
    setBusyBid(bidForm.tenderId)
    setMessage('')
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
    setBusyBid(null)
    if (!res.ok) {
      setMessage(data.error || 'Bid failed')
      return
    }
    setMessage('Bid submitted')
    setBidForm(null)
    await load()
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-[36px]">
          {isContractor ? 'Projects open for service' : 'Contractors & vendors'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
          {isContractor
            ? 'Browse projects architects posted for open bidding. Private workspaces stay hidden until you are invited or awarded.'
            : 'Discover verified contractors, post open bidding from a project, and award work.'}
        </p>
      </div>

      {message && (
        <p className="text-sm" style={{ color: 'var(--amber)' }}>
          {message}
        </p>
      )}

      <div className="flex gap-2 flex-wrap">
        {(
          isContractor
            ? ([['tenders', 'Open for service'], ['vendors', 'Directory']] as const)
            : ([
                ['vendors', 'Directory'],
                ['tenders', 'Open for service'],
                ['bids', `Bids to review (${reviewBids.length})`],
              ] as const)
        ).map(([key, label]) => (
          <button
            key={key}
            className="chip"
            style={{
              color: tab === key ? 'var(--amber)' : 'var(--stone)',
              background: tab === key ? 'rgba(245,166,35,0.12)' : 'rgba(159,142,122,0.1)',
            }}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'vendors' && (
        <>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              className="input-5bloc flex-1"
              placeholder="Search contractors & vendors…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="input-5bloc"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
            >
              <option value="all">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="input-5bloc"
              value={filterSpec}
              onChange={(e) => setFilterSpec(e.target.value)}
            >
              <option value="all">All trades</option>
              {specs.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm px-2" style={{ color: 'var(--stone)' }}>
              <input
                type="checkbox"
                checked={filterVerified}
                onChange={(e) => setFilterVerified(e.target.checked)}
              />
              Verified only
            </label>
          </div>

          {loading ? (
            <p style={{ color: 'var(--stone)' }}>Loading…</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((c) => (
                <Link
                  key={c.id}
                  href={`/marketplace/${c.id}`}
                  className="p-5 rounded-2xl block"
                  style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-2)' }}
                >
                  <div className="flex justify-between gap-2">
                    <p className="font-semibold">{c.company_name}</p>
                    <span style={{ color: 'var(--amber)' }}>★ {c.rating}</span>
                  </div>
                  <p className="text-[12px] mt-2 line-clamp-2" style={{ color: 'var(--stone)' }}>
                    {c.bio}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {c.specializations?.slice(0, 4).map((s) => (
                      <span key={s} className="chip text-[10px]" style={{ color: 'var(--stone)' }}>
                        {s}
                      </span>
                    ))}
                    {c.verified && (
                      <span className="chip text-[10px]" style={{ color: 'var(--success)' }}>
                        Verified
                      </span>
                    )}
                    {c.badge_active && (
                      <span className="chip text-[10px]" style={{ color: 'var(--amber)' }}>
                        Badge
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'tenders' && (
        <div className="grid md:grid-cols-2 gap-4">
          {loading ? (
            <p style={{ color: 'var(--stone)' }}>Loading…</p>
          ) : openTenders.length === 0 ? (
            <div className="p-8 rounded-2xl md:col-span-2" style={{ background: 'var(--surface-container)' }}>
              {isContractor
                ? 'No projects open for service right now. Check back when architects post open bidding.'
                : 'No open bidding posts yet. Enable “Post for open bidding” when creating a project, or post a tender from a project workspace.'}
            </div>
          ) : (
            openTenders.map((t) => {
              const services = Array.isArray(t.services) && t.services.length
                ? t.services
                : t.trade_type
                  ? [t.trade_type]
                  : []
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
                      <p className="text-[12px] mt-2 line-clamp-3" style={{ color: 'var(--stone)' }}>
                        {t.scope}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {services.map((s: string) => (
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
                  {isContractor && (
                    <button
                      className="btn-primary text-[12px] self-start"
                      disabled={busyBid === t.id}
                      onClick={() => setBidForm({ tenderId: t.id, amount: '', weeks: '', methodology: '' })}
                    >
                      Submit bid
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {tab === 'bids' && !isContractor && (
        <div className="space-y-3">
          {loading ? (
            <p style={{ color: 'var(--stone)' }}>Loading bids…</p>
          ) : reviewBids.length === 0 ? (
            <div className="p-8 rounded-2xl" style={{ background: 'var(--surface-container)' }}>
              No bids awaiting review. When contractors submit, they appear here for award/reject.
            </div>
          ) : (
            reviewBids.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3"
                style={{ background: 'var(--surface-container)' }}
              >
                <div>
                  <p className="font-semibold">{b.tenders?.title || b.tender_title || 'Bid'}</p>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--stone)' }}>
                    {b.contractors?.company_name || 'Contractor'} · ₹{Number(b.amount).toLocaleString()} ·{' '}
                    {b.timeline_weeks ? `${b.timeline_weeks} wks` : '—'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn-primary text-[12px]"
                    disabled={busyBid === b.id}
                    onClick={() => awardBid(b.id, 'accepted')}
                  >
                    Award
                  </button>
                  <button
                    className="btn-secondary text-[12px]"
                    disabled={busyBid === b.id}
                    onClick={() => awardBid(b.id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {bidForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl space-y-3" style={{ background: 'var(--surface)' }}>
            <h3 className="font-semibold text-lg">Submit bid</h3>
            <input
              className="input-5bloc"
              type="number"
              placeholder="Amount (₹)"
              value={bidForm.amount}
              onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
            />
            <input
              className="input-5bloc"
              type="number"
              placeholder="Timeline (weeks)"
              value={bidForm.weeks}
              onChange={(e) => setBidForm({ ...bidForm, weeks: e.target.value })}
            />
            <textarea
              className="input-5bloc"
              rows={3}
              placeholder="Methodology / notes"
              value={bidForm.methodology}
              onChange={(e) => setBidForm({ ...bidForm, methodology: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <button className="btn-secondary text-[12px]" onClick={() => setBidForm(null)}>
                Cancel
              </button>
              <button className="btn-primary text-[12px]" disabled={!!busyBid} onClick={submitBid}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
