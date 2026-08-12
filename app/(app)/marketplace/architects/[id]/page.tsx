'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ArchitectListing } from '@/lib/marketplace/listings'

type OpenTender = {
  id: string
  title: string
  project_name?: string | null
  city?: string | null
  services?: string[]
  budget_min?: number | null
  budget_max?: number | null
  deadline?: string | null
}

const money = (v?: number | null) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '—')

function Fact({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <span className="text-[10px] font-mono uppercase block" style={{ color: 'var(--stone)' }}>
        {label}
      </span>
      <span className="text-[13px] font-semibold mt-1 block capitalize">{value}</span>
    </div>
  )
}

export default function ArchitectProfile() {
  const params = useParams<{ id: string }>()
  const [architect, setArchitect] = useState<ArchitectListing | null>(null)
  const [tenders, setTenders] = useState<OpenTender[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const res = await fetch(`/api/contractors/architects/${params.id}`)
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load this profile')
      if (!data.architect) {
        setNotFound(true)
        return
      }
      setArchitect(data.architect)
      setTenders(data.tenders || [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton style={{ height: 14, width: 160 }} />
        <div className="card-5bloc space-y-3">
          <Skeleton style={{ height: 24, width: '45%' }} />
          <Skeleton lines={2} />
        </div>
        <Skeleton style={{ height: 160 }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-4">
        <ErrorState title="Could not load this architect profile" error={error} onRetry={load} />
        <Link href="/marketplace" className="btn-secondary text-[12px] inline-flex">
          Back to marketplace
        </Link>
      </div>
    )
  }

  if (notFound || !architect) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <EmptyState
          icon="search_off"
          title="This architect profile is not available"
          description="It may have been removed, or the link is out of date."
          actionLabel="Back to marketplace"
          href="/marketplace"
        />
      </div>
    )
  }

  const location = [architect.city, architect.state].filter(Boolean).join(', ')

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <Link href="/marketplace" className="text-xs flex items-center gap-1" style={{ color: 'var(--stone)' }}>
        <span className="material-icons-outlined text-[14px]">arrow_back</span> Back to marketplace
      </Link>

      <div className="card-5bloc flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-3">
          <span
            className="chip text-[10px] uppercase w-fit"
            style={{ color: 'var(--amber)', background: 'rgba(245,166,35,0.12)' }}
          >
            Architect
          </span>
          <h1 className="font-display text-[32px] leading-tight">
            {architect.full_name || architect.firm_name || 'Architect'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--stone)' }}>
            {[architect.firm_name, location].filter(Boolean).join(' · ') || 'Independent practice'}
          </p>
          {architect.discipline && (
            <span className="chip text-[10px]" style={{ color: 'var(--stone)' }}>
              {architect.discipline}
            </span>
          )}
        </div>

        <div className="flex flex-col md:items-end justify-center shrink-0">
          <span className="text-2xl font-bold" style={{ color: 'var(--amber)' }}>
            {architect.open_tenders}
          </span>
          <p className="text-xs font-mono" style={{ color: 'var(--stone)' }}>
            project{architect.open_tenders === 1 ? '' : 's'} open for service
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-5">
          <section className="card-5bloc">
            <h2 className="text-xs font-bold font-mono uppercase mb-4" style={{ color: 'var(--stone)' }}>
              Projects open for service
            </h2>
            {tenders.length === 0 ? (
              <p className="text-[13px]" style={{ color: 'var(--stone)' }}>
                This practice has no projects open for public bidding right now.
              </p>
            ) : (
              <div className="space-y-3">
                {tenders.map((t) => (
                  <Link
                    key={t.id}
                    href={`/marketplace/tenders/${t.id}`}
                    className="p-4 rounded-xl block"
                    style={{ background: 'var(--surface-container-high)' }}
                  >
                    <p className="font-semibold text-[14px]">{t.project_name || t.title}</p>
                    <p className="text-[12px] mt-1" style={{ color: 'var(--stone)' }}>
                      {t.city || '—'} · Bid due {t.deadline || 'Open'}
                      {t.budget_min || t.budget_max
                        ? ` · Budget ${money(t.budget_min)} – ${money(t.budget_max)}`
                        : ''}
                    </p>
                    {!!t.services?.length && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.services.map((s) => (
                          <span key={s} className="chip text-[10px]" style={{ color: 'var(--amber)' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card-5bloc space-y-4">
            <h3
              className="text-xs font-bold font-mono uppercase tracking-wider border-b pb-2"
              style={{ color: 'var(--amber)', borderColor: 'var(--surface-container-high)' }}
            >
              Practice
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Fact label="Firm" value={architect.firm_name} />
              <Fact label="Focus" value={architect.firm_type} />
              <Fact label="City" value={architect.city} />
              <Fact label="State" value={architect.state} />
              <Fact label="GST number" value={architect.gst_number} />
              <Fact
                label="On 5Bloc since"
                value={architect.created_at ? new Date(architect.created_at).toLocaleDateString('en-IN') : null}
              />
            </div>
            {!architect.firm_name && !architect.city && (
              <p className="text-[11px]" style={{ color: 'var(--stone)' }}>
                This architect has not added firm details yet.
              </p>
            )}
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--stone)' }}>
              Contact details stay private. Bid on one of their open projects to start a conversation.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
