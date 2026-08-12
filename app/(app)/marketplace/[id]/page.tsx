'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import type { MarketplaceListing } from '@/lib/marketplace/listings'

type Review = { rating: number; review_text: string | null; created_at: string }

/** Renders a field only when the business actually gave us the value. */
function Fact({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '' || value === 0) return null
  return (
    <div>
      <span className="text-[10px] font-mono uppercase block" style={{ color: 'var(--stone)' }}>
        {label}
      </span>
      <span className="text-[13px] font-semibold mt-1 block">{value}</span>
    </div>
  )
}

export default function ListingProfile() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const confirm = useConfirm()
  const listingId = params.id

  const [listing, setListing] = useState<MarketplaceListing | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about')

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [role, setRole] = useState('architect')
  const [inviting, setInviting] = useState(false)

  const loadListing = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const res = await fetch(`/api/contractors/${listingId}`)
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load this listing')
      if (!data.listing) {
        setNotFound(true)
        return
      }
      setListing(data.listing)
      setReviews(data.reviews || [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [listingId])

  useEffect(() => {
    loadListing()
  }, [loadListing])

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d.projects) ? d.projects : []
        setProjects(list.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
      })
      .catch(() => setProjects([]))
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => setRole(d.profile?.role || 'architect'))
      .catch(() => {})
  }, [])

  const sendInvite = async () => {
    if (!listing || !selectedProjectId || inviting) return
    if (!listing.contact_email) {
      toast(
        `${listing.company_name} has no contact email on file. Post the project for open bidding instead.`,
        'warning',
        6000
      )
      return
    }

    const projectName = projects.find((p) => p.id === selectedProjectId)?.name || 'this project'
    const ok = await confirm({
      title: `Invite ${listing.company_name}?`,
      message: `An email invitation goes to ${listing.contact_email}. Once they accept, they can see ${projectName} and coordinate on it.`,
      confirmLabel: 'Send invitation',
    })
    if (!ok) return

    setInviting(true)
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: selectedProjectId, email: listing.contact_email, role: 'contractor' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invite failed')
      toast(`Invitation sent to ${listing.company_name}`, 'success')
      router.push(`/projects/${selectedProjectId}/team`)
    } catch (err: any) {
      toast(err?.message || 'Invite failed', 'error')
    } finally {
      setInviting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <Skeleton style={{ height: 14, width: 160 }} />
        <div className="card-5bloc space-y-3">
          <Skeleton style={{ height: 24, width: '45%' }} />
          <Skeleton lines={2} />
        </div>
        <Skeleton style={{ height: 180 }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-4">
        <ErrorState title="Could not load this listing" error={error} onRetry={loadListing} />
        <Link href="/marketplace" className="btn-secondary text-[12px] inline-flex">
          Back to marketplace
        </Link>
      </div>
    )
  }

  if (notFound || !listing) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-4">
        <EmptyState
          icon="search_off"
          title="This listing is no longer available"
          description="It may have been removed, or the link is out of date."
          actionLabel="Back to marketplace"
          href="/marketplace"
        />
      </div>
    )
  }

  const isVendor = listing.listing_type === 'vendor'
  const location = listing.service_cities.length
    ? listing.service_cities.join(', ')
    : [listing.city, listing.state].filter(Boolean).join(', ')
  const hasPortfolio = listing.portfolio_photos.length > 0
  const hasReviews = reviews.length > 0
  const hasContact = !!(listing.contact_email || listing.phone || listing.contact_name)

  const tabs = [
    { id: 'about' as const, label: 'About' },
    ...(hasPortfolio ? [{ id: 'portfolio' as const, label: isVendor ? 'Catalogue photos' : 'Portfolio' }] : []),
    ...(hasReviews ? [{ id: 'reviews' as const, label: 'Client reviews' }] : []),
  ]

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <Link href="/marketplace" className="text-xs flex items-center gap-1" style={{ color: 'var(--stone)' }}>
        <span className="material-icons-outlined text-[14px]">arrow_back</span> Back to marketplace
      </Link>

      <div className="card-5bloc flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip text-[10px] uppercase" style={{ color: 'var(--amber)', background: 'rgba(245,166,35,0.12)' }}>
              {isVendor ? 'Vendor · Supplies' : 'Contractor · Services'}
            </span>
            {listing.verified && (
              <span className="chip text-[10px] uppercase" style={{ color: 'var(--success)' }}>
                Verified partner
              </span>
            )}
            {listing.badge_active && (
              <span className="chip text-[10px] uppercase" style={{ color: 'var(--amber)' }}>
                Badge
              </span>
            )}
          </div>

          <h1 className="font-display text-[32px] leading-tight">{listing.company_name}</h1>
          <p className="text-sm" style={{ color: 'var(--stone)' }}>
            {location || 'Service area not shared yet'}
          </p>

          {listing.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {listing.tags.map((t) => (
                <span key={t} className="chip text-[10px]" style={{ color: 'var(--stone)' }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {listing.reviews_count > 0 && (
          <div className="flex flex-col md:items-end justify-center shrink-0">
            <div className="flex items-center gap-1">
              <span className="material-icons-outlined text-[20px]" style={{ color: 'var(--amber)' }}>
                star
              </span>
              <span className="text-xl font-bold">{listing.rating}</span>
              <span className="text-xs" style={{ color: 'var(--stone)' }}>
                / 5.0
              </span>
            </div>
            <p className="text-xs font-mono mt-1" style={{ color: 'var(--stone)' }}>
              {listing.reviews_count} reviews
              {listing.jobs_completed > 0 ? ` • ${listing.jobs_completed} jobs completed` : ''}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-6">
          {tabs.length > 1 && (
            <div className="flex gap-6 border-b pb-2.5" style={{ borderColor: 'var(--surface-container-high)' }}>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="text-xs font-semibold pb-1.5 uppercase tracking-wider"
                  style={{
                    color: activeTab === t.id ? 'var(--amber)' : 'var(--stone)',
                    borderBottom: activeTab === t.id ? '2px solid var(--amber)' : '2px solid transparent',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="card-5bloc space-y-5">
              <div>
                <h4 className="text-xs font-bold font-mono uppercase mb-2" style={{ color: 'var(--stone)' }}>
                  {isVendor ? 'What they supply' : 'About the business'}
                </h4>
                <p className="text-[13px] leading-relaxed">
                  {listing.bio || (
                    <span style={{ color: 'var(--stone)' }}>
                      This business has not written a description yet.
                    </span>
                  )}
                </p>
              </div>

              {isVendor && listing.supply_categories.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase mb-2" style={{ color: 'var(--stone)' }}>
                    Supply categories
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.supply_categories.map((c) => (
                      <span key={c} className="chip text-[11px]" style={{ color: 'var(--amber)' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t"
                style={{ borderColor: 'var(--surface-container-high)' }}
              >
                <Fact label="Experience" value={listing.years_experience ? `${listing.years_experience} years` : null} />
                <Fact label={isVendor ? 'Supplies to' : 'Service area'} value={location || null} />
                <Fact label="State" value={listing.state} />
                <Fact
                  label="Team size"
                  value={listing.team_size_label || (listing.team_size ? String(listing.team_size) : null)}
                />
                <Fact label="GST number" value={listing.gst_number} />
                <Fact label="Listed via" value={listing.source} />
              </div>

              {listing.website && (
                <a
                  href={listing.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] underline inline-block"
                  style={{ color: 'var(--amber)' }}
                >
                  {listing.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          )}

          {activeTab === 'portfolio' && hasPortfolio && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {listing.portfolio_photos.map((url, idx) => (
                <div key={url + idx} className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-container)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${listing.company_name} work sample ${idx + 1}`} className="w-full h-40 object-cover" />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && hasReviews && (
            <div className="space-y-4">
              {reviews.map((rev, idx) => (
                <div key={idx} className="card-5bloc space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono" style={{ color: 'var(--stone)' }}>
                      {new Date(rev.created_at).toLocaleDateString('en-IN')}
                    </span>
                    <div className="text-xs font-mono font-bold" style={{ color: 'var(--amber)' }}>
                      {'★'.repeat(Math.max(0, Math.min(5, rev.rating)))}
                    </div>
                  </div>
                  {rev.review_text && (
                    <p className="text-xs leading-relaxed italic" style={{ color: 'var(--stone)' }}>
                      “{rev.review_text}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          {hasContact && (
            <div className="card-5bloc space-y-2">
              <h3
                className="text-xs font-bold font-mono uppercase tracking-wider border-b pb-2"
                style={{ color: 'var(--amber)', borderColor: 'var(--surface-container-high)' }}
              >
                Contact
              </h3>
              {listing.contact_name && <p className="text-[13px] font-semibold">{listing.contact_name}</p>}
              {listing.phone && (
                <a href={`tel:${listing.phone}`} className="text-[13px] block" style={{ color: 'var(--stone)' }}>
                  {listing.phone}
                </a>
              )}
              {listing.contact_email && (
                <a href={`mailto:${listing.contact_email}`} className="text-[13px] block break-all" style={{ color: 'var(--stone)' }}>
                  {listing.contact_email}
                </a>
              )}
            </div>
          )}

          {role === 'architect' && (
            <div className="card-5bloc space-y-4">
              <h3
                className="text-xs font-bold font-mono uppercase tracking-wider border-b pb-2"
                style={{ color: 'var(--amber)', borderColor: 'var(--surface-container-high)' }}
              >
                {isVendor ? 'Invite vendor' : 'Invite contractor'}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--stone)' }}>
                {isVendor
                  ? 'Bring this supplier into a project workspace so they can quote and coordinate deliveries.'
                  : 'Invite this contractor into a project workspace. They get an email invite and coordination access once they accept.'}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono" style={{ color: 'var(--stone)' }}>
                    Select project *
                  </label>
                  <select
                    className="input-5bloc py-1.5 text-xs font-medium"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    <option value="">Select a project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={sendInvite}
                  className="w-full btn-primary py-2.5 text-xs font-bold"
                  disabled={!selectedProjectId || inviting}
                >
                  {inviting ? 'Sending…' : 'Send direct invitation'}
                </button>
                {!listing.contact_email && (
                  <p className="text-[11px]" style={{ color: 'var(--stone)' }}>
                    No email on file for this business — post the project for open bidding instead.
                  </p>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
