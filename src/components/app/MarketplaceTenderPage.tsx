import React, { useCallback, useEffect, useState } from 'react'
import Link from '@/compat/next-link'
import { useParams, useRouter } from '@/compat/next-navigation'
import { useToast } from '@/components/ui5/Toast'
import { ConfirmDialog } from '@/components/ui5/ConfirmDialog'
import { ErrorState } from '@/components/ui5/ErrorState'
import { EmptyState } from '@/components/ui5/EmptyState'
import { Skeleton } from '@/components/ui5/Skeleton'
import { useLiveReload } from '@/lib/live/useLiveReload'

type Tender = {
  id: string
  title: string
  project_name?: string
  scope?: string
  city?: string
  services?: string[]
  trade_type?: string
  budget_min?: number
  budget_max?: number
  timeline_weeks?: number
  deadline?: string
  status: string
  created_at?: string
  project_type?: string | null
  total_sqft?: number | null
  floors?: number | null
  spec_level?: string | null
  start_date?: string | null
  estimated_end?: string | null
}

type MyBid = {
  id: string
  amount: number
  status: string
  timeline_weeks?: number | null
  methodology?: string | null
  created_at?: string
}

const money = (v?: number | null) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '—')

export default function MarketplaceTenderPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const [tender, setTender] = useState<Tender | null>(null)
  const [myBid, setMyBid] = useState<MyBid | null>(null)
  const [bidCount, setBidCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const [form, setForm] = useState({ amount: '', weeks: '', methodology: '' })
  const [amountError, setAmountError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true)
      setError(null)
      setNotFound(false)
    }
    try {
      const res = await fetch(`/api/tenders/${params.id}`)
      if (res.status === 404) {
        if (!opts?.quiet) setNotFound(true)
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load this project')
      if (!data.tender) {
        if (!opts?.quiet) setNotFound(true)
        return
      }
      setTender(data.tender)
      setMyBid(data.my_bid)
      setBidCount(data.bid_count || 0)
    } catch (err) {
      if (!opts?.quiet) setError(err)
    } finally {
      if (!opts?.quiet) setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    load()
  }, [load])

  useLiveReload(load, ['tenders', 'bids'])

  const submitBid = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tender_id: params.id,
          amount: Number(form.amount),
          timeline_weeks: Number(form.weeks) || null,
          methodology: form.methodology,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Bid failed')
      toast(`Bid of ${money(Number(form.amount))} submitted`, 'success')
      setConfirmOpen(false)
      setForm({ amount: '', weeks: '', methodology: '' })
      await load({ quiet: true })
    } catch (err: any) {
      toast(err?.message || 'Bid failed', 'error')
      setConfirmOpen(false)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-4 w-20" />
        <div className="space-y-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-5">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-4">
        <ErrorState title="Could not load this project" error={error} onRetry={load} />
        <Link href="/marketplace" className="btn-secondary text-xs inline-flex">
          Back to marketplace
        </Link>
      </div>
    )
  }

  if (notFound || !tender) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <EmptyState
          icon="search_off"
          title="This project is no longer open for service"
          description="The architect may have closed bidding or awarded the work. Browse what is still open."
          actionLabel="Back to marketplace"
          href="/marketplace"
        />
      </div>
    )
  }

  const services = tender.services?.length ? tender.services : tender.trade_type ? [tender.trade_type] : []
  const closed = tender.status !== 'open'

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="text-xs flex items-center gap-1" style={{ color: 'var(--stone)' }}>
        <span className="material-icons-outlined text-[14px]">arrow_back</span> Back
      </button>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="font-display text-[32px]">{tender.project_name || tender.title}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
            {tender.city || '—'} · Bids due {tender.deadline || 'Open'} · {bidCount} bid{bidCount === 1 ? '' : 's'} so far
          </p>
        </div>
        <span
          className="chip text-[11px] h-fit"
          style={{
            color: closed ? 'var(--stone)' : 'var(--success)',
            background: closed ? 'rgba(159,142,122,0.12)' : 'rgba(46,204,138,0.12)',
          }}
        >
          {closed ? `Bidding ${tender.status}` : 'Open for service'}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          <section className="p-5 rounded-2xl" style={{ background: 'var(--surface-container)' }}>
            <h2 className="text-sm font-semibold mb-3">Scope of work</h2>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--stone)' }}>
              {tender.scope || 'The architect has not added a detailed scope. Contact them after bidding for drawings.'}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {services.map((s) => (
                <span key={s} className="chip text-[10px]" style={{ color: 'var(--amber)' }}>
                  {s}
                </span>
              ))}
            </div>
          </section>

          <section className="p-5 rounded-2xl" style={{ background: 'var(--surface-container)' }}>
            <h2 className="text-sm font-semibold mb-3">Project details</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[12px]">
              {[
                ['Type', tender.project_type ? tender.project_type.replaceAll('_', ' ') : '—'],
                ['Built-up area', tender.total_sqft ? `${Number(tender.total_sqft).toLocaleString('en-IN')} sqft` : '—'],
                ['Floors', tender.floors ?? '—'],
                ['Spec level', tender.spec_level || '—'],
                ['Site start', tender.start_date || '—'],
                ['Target completion', tender.estimated_end || '—'],
                ['Budget range', `${money(tender.budget_min)} – ${money(tender.budget_max)}`],
                ['Expected duration', tender.timeline_weeks ? `${tender.timeline_weeks} weeks` : '—'],
                ['Posted', tender.created_at ? new Date(tender.created_at).toLocaleDateString('en-IN') : '—'],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt style={{ color: 'var(--stone)' }}>{label}</dt>
                  <dd className="font-medium mt-0.5 capitalize">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="p-5 rounded-2xl space-y-3" style={{ background: 'var(--surface-container)' }}>
            {myBid ? (
              <>
                <h2 className="text-sm font-semibold">Your bid</h2>
                <p className="text-2xl font-semibold" style={{ color: 'var(--amber)' }}>
                  {money(myBid.amount)}
                </p>
                <p className="text-[12px]" style={{ color: 'var(--stone)' }}>
                  {myBid.timeline_weeks ? `${myBid.timeline_weeks} weeks · ` : ''}Status: {myBid.status}
                </p>
                {myBid.methodology && (
                  <p className="text-[12px]" style={{ color: 'var(--stone)' }}>
                    {myBid.methodology}
                  </p>
                )}
                <p className="text-[11px]" style={{ color: 'var(--stone)' }}>
                  One bid per project. The architect will contact you if you are shortlisted.
                </p>
                <Link href="/contractor/bids" className="btn-secondary text-[12px] w-full text-center block">
                  Track my bids
                </Link>
              </>
            ) : closed ? (
              <>
                <h2 className="text-sm font-semibold">Bidding closed</h2>
                <p className="text-[12px]" style={{ color: 'var(--stone)' }}>
                  This project is no longer accepting bids.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold">Submit your bid</h2>
                <div>
                  <label className="block text-[11px] mb-1" style={{ color: 'var(--stone)' }}>
                    Bid amount (₹) *
                  </label>
                  <input
                    className="input-5bloc"
                    type="number"
                    min={1}
                    value={form.amount}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, amount: e.target.value }))
                      setAmountError('')
                    }}
                    aria-invalid={!!amountError}
                  />
                  {amountError && (
                    <p className="text-[11px] mt-1" style={{ color: 'var(--error)' }}>
                      {amountError}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] mb-1" style={{ color: 'var(--stone)' }}>
                    Timeline (weeks)
                  </label>
                  <input
                    className="input-5bloc"
                    type="number"
                    min={1}
                    value={form.weeks}
                    onChange={(e) => setForm((p) => ({ ...p, weeks: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] mb-1" style={{ color: 'var(--stone)' }}>
                    Methodology / notes
                  </label>
                  <textarea
                    className="input-5bloc"
                    rows={4}
                    value={form.methodology}
                    onChange={(e) => setForm((p) => ({ ...p, methodology: e.target.value }))}
                  />
                </div>
                <button
                  className="btn-primary w-full text-[12px]"
                  disabled={busy}
                  onClick={() => {
                    if (!form.amount || Number(form.amount) <= 0) {
                      setAmountError('Enter the amount you are bidding, above zero.')
                      return
                    }
                    setConfirmOpen(true)
                  }}
                >
                  Review and submit
                </button>
                <p className="text-[11px]" style={{ color: 'var(--stone)' }}>
                  You can only bid once per project, so double-check your number.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Submit this bid?"
        message={`You are bidding ${money(Number(form.amount))}${
          form.weeks ? ` over ${form.weeks} weeks` : ''
        } for ${tender.project_name || tender.title}. Bids cannot be edited after submission.`}
        confirmLabel="Submit bid"
        loading={busy}
        onConfirm={submitBid}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
