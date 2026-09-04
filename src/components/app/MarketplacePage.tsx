import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useToast } from '@/components/ui5/Toast'
import { ConfirmDialog } from '@/components/ui5/ConfirmDialog'
import { EmptyState } from '@/components/ui5/EmptyState'
import { ErrorState } from '@/components/ui5/ErrorState'
import { Skeleton } from '@/components/ui5/Skeleton'
import type { ArchitectListing, MarketplaceListing } from '@/lib/marketplace/listings'
import { architectCover, initialsOf, listingCover, tenderCover } from '@/lib/marketplace/covers'
import { CardBadge, PhotoCard, PhotoCardSkeleton } from '@/components/marketplace/PhotoCard'
import { useLiveReload } from '@/lib/live/useLiveReload'

type Category = 'projects' | 'architects' | 'contractors' | 'vendors' | 'bids'

const money = (v?: number | null) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '—')

const ALL = 'all'

const chipStyle = (active: boolean) => ({
  color: active ? 'var(--amber)' : 'var(--stone)',
  background: active ? 'rgba(245,166,35,0.12)' : 'rgba(159,142,122,0.1)',
})

type Source = 'listings' | 'architects' | 'tenders' | 'bids'

const NO_FAILURES: Record<Source, boolean> = {
  listings: false,
  architects: false,
  tenders: false,
  bids: false,
}

async function fetchJson(url: string) {
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

function uniqueSorted(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter((v): v is string => !!v && !!v.trim()))).sort((a, b) => a.localeCompare(b))
}

function CardGridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <PhotoCardSkeleton key={i} />
      ))}
    </div>
  )
}

function TagRow({ tags, max = 4 }: { tags: string[]; max?: number }) {
  if (!tags.length) return null
  return (
    <div className="flex flex-wrap gap-1 mt-3">
      {tags.slice(0, max).map((t) => (
        <span key={t} className="chip text-[10px]" style={{ color: 'var(--stone)' }}>
          {t}
        </span>
      ))}
      {tags.length > max && (
        <span className="chip text-[10px]" style={{ color: 'var(--stone)' }}>
          +{tags.length - max}
        </span>
      )}
    </div>
  )
}

function ListingCard({ listing }: { listing: MarketplaceListing }) {
  const place = listing.service_cities.length ? listing.service_cities.join(', ') : listing.city
  const cover = listingCover(listing)
  return (
    <PhotoCard
      href={`/marketplace/${listing.id}`}
      cover={cover}
      alt={listing.company_name}
      overlay={
        <>
          <div className="flex flex-wrap gap-1">
            {listing.verified && <CardBadge tone="success">Verified</CardBadge>}
            {listing.badge_active && <CardBadge tone="amber">Badge</CardBadge>}
          </div>
          {listing.reviews_count > 0 && (
            <CardBadge tone="dark">★ {Number(listing.rating).toFixed(1)}</CardBadge>
          )}
        </>
      }
    >
      <p className="font-semibold text-[15px] leading-snug">{listing.company_name}</p>
      <p className="text-[12px] mt-1" style={{ color: 'var(--stone)' }}>
        {[place, listing.years_experience ? `${listing.years_experience} yrs` : null]
          .filter(Boolean)
          .join(' · ') || 'Location not shared yet'}
      </p>
      {listing.bio && (
        <p className="text-[12px] mt-2 line-clamp-2" style={{ color: 'var(--stone)' }}>
          {listing.bio}
        </p>
      )}
      <TagRow tags={listing.tags} />
    </PhotoCard>
  )
}

function ArchitectCard({ architect }: { architect: ArchitectListing }) {
  const place = [architect.city, architect.state].filter(Boolean).join(', ')
  const name = architect.full_name || architect.firm_name || 'Architect'
  const { cover, portrait } = architectCover(architect)
  return (
    <PhotoCard
      href={`/marketplace/architects/${architect.id}`}
      cover={cover}
      alt={name}
      overlay={
        architect.open_tenders > 0 ? (
          <CardBadge tone="amber">
            {architect.open_tenders} open project{architect.open_tenders === 1 ? '' : 's'}
          </CardBadge>
        ) : undefined
      }
    >
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 shrink-0 overflow-hidden rounded-full"
          style={{ background: 'rgba(245,166,35,0.16)' }}
        >
          {portrait ? (
            <CoverPortrait src={portrait} name={name} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold" style={{ color: 'var(--amber)' }}>
              {initialsOf(name)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[15px] leading-snug truncate">{name}</p>
          <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--stone)' }}>
            {[architect.firm_name && architect.firm_name !== name ? architect.firm_name : null, place]
              .filter(Boolean)
              .join(' · ') || 'Independent practice'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-3">
        {architect.discipline && (
          <span className="chip text-[10px]" style={{ color: 'var(--stone)' }}>
            {architect.discipline}
          </span>
        )}
        {architect.firm_type && (
          <span className="chip text-[10px]" style={{ color: 'var(--stone)' }}>
            {architect.firm_type}
          </span>
        )}
      </div>
    </PhotoCard>
  )
}

function CoverPortrait({ src, name }: { src: string; name: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className="h-full w-full object-cover" />
  )
}

export default function MarketplacePage() {
  const { toast } = useToast()
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [architects, setArchitects] = useState<ArchitectListing[]>([])
  const [tenders, setTenders] = useState<any[]>([])
  const [bids, setBids] = useState<any[]>([])
  const [role, setRole] = useState<string>('architect')
  const [tab, setTab] = useState<Category>('projects')
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [filterCity, setFilterCity] = useState(ALL)
  const [filterTag, setFilterTag] = useState(ALL)
  const [filterVerified, setFilterVerified] = useState(false)

  const [busyBid, setBusyBid] = useState<string | null>(null)
  const [award, setAward] = useState<{ bid: any; status: 'accepted' | 'rejected' } | null>(null)
  const [shortlisting, setShortlisting] = useState<string | null>(null)
  const [rejectionNote, setRejectionNote] = useState('Not selected for this package')

  const [failed, setFailed] = useState<Record<Source, boolean>>(NO_FAILURES)
  const tabPicked = useRef(false)

  const isContractor = role === 'contractor'

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true)
      setFailed(NO_FAILURES)
    }
    try {
      const me = await fetch('/api/me')
        .then((r) => r.json())
        .catch(() => ({}))
      const nextRole = me.profile?.role || 'architect'
      setRole(nextRole)
      const contractorView = nextRole === 'contractor'
      // Only choose a default tab on first load, so a retry keeps the user where they were.
      if (!tabPicked.current) {
        setTab(contractorView ? 'projects' : 'contractors')
        tabPicked.current = true
      }

      const [listingRes, architectRes, tenderRes, bidRes] = await Promise.allSettled([
        fetchJson('/api/contractors'),
        fetchJson('/api/contractors/architects'),
        fetchJson(contractorView ? '/api/tenders?marketplace=1' : '/api/tenders?status=all'),
        fetchJson('/api/bids'),
      ])

      if (listingRes.status === 'fulfilled') {
        setListings(listingRes.value.listings || listingRes.value.contractors || [])
      }
      if (architectRes.status === 'fulfilled') setArchitects(architectRes.value.architects || [])
      if (tenderRes.status === 'fulfilled') setTenders(tenderRes.value.tenders || [])
      if (bidRes.status === 'fulfilled') setBids(bidRes.value.bids || [])

      setFailed({
        listings: listingRes.status === 'rejected',
        architects: architectRes.status === 'rejected',
        tenders: tenderRes.status === 'rejected',
        bids: bidRes.status === 'rejected',
      })
    } finally {
      if (!opts?.quiet) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useLiveReload(load, ['bids', 'tenders', 'contractors'])

  // Filters mean different things per category, so reset them on every switch.
  const switchTab = (next: Category) => {
    setTab(next)
    setQuery('')
    setFilterCity(ALL)
    setFilterTag(ALL)
    setFilterVerified(false)
  }

  const contractors = useMemo(() => listings.filter((l) => l.listing_type === 'contractor'), [listings])
  const vendors = useMemo(() => listings.filter((l) => l.listing_type === 'vendor'), [listings])
  const openTenders = useMemo(
    () => tenders.filter((t) => t.status === 'open' && (t.visibility || 'public') === 'public'),
    [tenders]
  )
  const reviewBids = useMemo(
    () => bids.filter((b) => b.status === 'submitted' || b.status === 'shortlisted'),
    [bids]
  )

  const activeListings = tab === 'vendors' ? vendors : contractors

  const listingCities = useMemo(
    () => uniqueSorted(activeListings.flatMap((l) => (l.service_cities.length ? l.service_cities : [l.city]))),
    [activeListings]
  )
  const listingTags = useMemo(() => uniqueSorted(activeListings.flatMap((l) => l.tags)), [activeListings])

  const filteredListings = useMemo(() => {
    const q = query.trim().toLowerCase()
    return activeListings.filter((l) => {
      if (filterVerified && !l.verified) return false
      if (filterCity !== ALL && !l.service_cities.includes(filterCity) && l.city !== filterCity) return false
      if (filterTag !== ALL && !l.tags.includes(filterTag)) return false
      if (!q) return true
      return (
        l.company_name.toLowerCase().includes(q) ||
        (l.bio || '').toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [activeListings, query, filterCity, filterTag, filterVerified])

  const architectCities = useMemo(() => uniqueSorted(architects.map((a) => a.city)), [architects])
  const disciplines = useMemo(() => uniqueSorted(architects.map((a) => a.discipline)), [architects])

  const filteredArchitects = useMemo(() => {
    const q = query.trim().toLowerCase()
    return architects.filter((a) => {
      if (filterCity !== ALL && a.city !== filterCity) return false
      if (filterTag !== ALL && a.discipline !== filterTag) return false
      if (!q) return true
      return (
        (a.full_name || '').toLowerCase().includes(q) ||
        (a.firm_name || '').toLowerCase().includes(q) ||
        (a.city || '').toLowerCase().includes(q)
      )
    })
  }, [architects, query, filterCity, filterTag])

  const tenderCities = useMemo(() => uniqueSorted(openTenders.map((t) => t.city)), [openTenders])
  const tenderServices = useMemo(
    () =>
      uniqueSorted(
        openTenders.flatMap((t) => (Array.isArray(t.services) && t.services.length ? t.services : [t.trade_type]))
      ),
    [openTenders]
  )

  const filteredTenders = useMemo(() => {
    const q = query.trim().toLowerCase()
    return openTenders.filter((t) => {
      const services = Array.isArray(t.services) && t.services.length ? t.services : t.trade_type ? [t.trade_type] : []
      if (filterCity !== ALL && t.city !== filterCity) return false
      if (filterTag !== ALL && !services.includes(filterTag)) return false
      if (!q) return true
      return (
        (t.project_name || t.title || '').toLowerCase().includes(q) ||
        (t.scope || '').toLowerCase().includes(q) ||
        (t.city || '').toLowerCase().includes(q)
      )
    })
  }, [openTenders, query, filterCity, filterTag])

  const confirmAward = async () => {
    if (!award) return
    setBusyBid(award.bid.id)
    const res = await fetch('/api/bids', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bid_id: award.bid.id,
        status: award.status,
        rejection_note: award.status === 'rejected' ? rejectionNote : null,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setBusyBid(null)
    setAward(null)
    if (!res.ok) {
      toast(data.error || 'Action failed', 'error')
      return
    }
    toast(
      award.status === 'accepted'
        ? 'Bid awarded — contractor added to the project team'
        : 'Bid rejected and the contractor was notified',
      'success'
    )
    setBids((prev) => prev.map((b) => (b.id === award.bid.id ? { ...b, status: award.status } : b)))
    await load({ quiet: true })
  }

  const shortlistBid = async (bid: any) => {
    setShortlisting(bid.id)
    const res = await fetch('/api/bids', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bid_id: bid.id, status: 'shortlisted' }),
    })
    const data = await res.json().catch(() => ({}))
    setShortlisting(null)
    if (!res.ok) {
      toast(data.error || 'Could not shortlist this bid', 'error')
      return
    }
    toast('Bid shortlisted — the contractor was notified', 'success')
    setBids((prev) => prev.map((b) => (b.id === bid.id ? { ...b, status: 'shortlisted' } : b)))
    await load({ quiet: true })
  }

  const categories: [Category, string][] = [
    ['projects', `Projects open for service${openTenders.length ? ` (${openTenders.length})` : ''}`],
    ['architects', `Find architects${architects.length ? ` (${architects.length})` : ''}`],
    ['contractors', `Find contractors${contractors.length ? ` (${contractors.length})` : ''}`],
    ['vendors', `Find vendors${vendors.length ? ` (${vendors.length})` : ''}`],
  ]
  if (!isContractor) categories.push(['bids', `Bids to review (${reviewBids.length})`])

  const searchPlaceholder =
    tab === 'projects'
      ? 'Search projects by name, scope or city…'
      : tab === 'architects'
        ? 'Search architects and firms…'
        : tab === 'vendors'
          ? 'Search vendors and what they supply…'
          : 'Search contractors by name or trade…'

  const cityOptions = tab === 'projects' ? tenderCities : tab === 'architects' ? architectCities : listingCities
  const tagOptions = tab === 'projects' ? tenderServices : tab === 'architects' ? disciplines : listingTags
  const tagLabel =
    tab === 'projects'
      ? 'All services'
      : tab === 'architects'
        ? 'All disciplines'
        : tab === 'vendors'
          ? 'All supply categories'
          : 'All trades'

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-[36px]">Marketplace</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
          {isContractor
            ? 'Browse projects posted for open bidding, and see who else is working in your city. Private workspaces stay hidden until you are invited or awarded.'
            : 'Find architects, contractors and material vendors — and manage the projects you have opened for bidding.'}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(([key, label]) => (
          <button key={key} className="chip" style={chipStyle(tab === key)} onClick={() => switchTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab !== 'bids' && (
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="input-5bloc flex-1"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="input-5bloc" value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
            <option value={ALL}>All cities</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="input-5bloc" value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
            <option value={ALL}>{tagLabel}</option>
            {tagOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {(tab === 'contractors' || tab === 'vendors') && (
            <label className="flex items-center gap-2 text-sm px-2" style={{ color: 'var(--stone)' }}>
              <input type="checkbox" checked={filterVerified} onChange={(e) => setFilterVerified(e.target.checked)} />
              Verified only
            </label>
          )}
        </div>
      )}

      {loading && tab !== 'bids' && <CardGridSkeleton />}

      {!loading && tab === 'projects' && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {failed.tenders ? (
            <div className="sm:col-span-2 xl:col-span-3">
              <ErrorState
                title="Could not load open projects"
                description="This is a loading problem, not an empty marketplace. Try again in a moment."
                onRetry={load}
              />
            </div>
          ) : filteredTenders.length === 0 ? (
            <div className="sm:col-span-2 xl:col-span-3">
              <EmptyState
                icon="engineering"
                title={openTenders.length ? 'No projects match those filters' : 'No projects open for service yet'}
                description={
                  openTenders.length
                    ? 'Clear the search or pick a different city to see everything that is open.'
                    : isContractor
                      ? 'Check back when architects post open bidding. You will also be notified if one invites you directly.'
                      : 'Enable “Post for open bidding” when creating a project, or post a tender from a project workspace.'
                }
              />
            </div>
          ) : (
            filteredTenders.map((t) => {
              const services =
                Array.isArray(t.services) && t.services.length ? t.services : t.trade_type ? [t.trade_type] : []
              const cover = tenderCover(t)
              const overlay = (
                <>
                  <CardBadge tone="dark">{t.city || 'India'}</CardBadge>
                  {isContractor && (
                    <CardBadge tone={t.my_bid ? 'success' : 'amber'}>
                      {t.my_bid ? `Bid ${money(t.my_bid.amount)}` : 'Open to bid'}
                    </CardBadge>
                  )}
                </>
              )
              const body = (
                <>
                  <p className="font-semibold text-[15px] leading-snug">{t.project_name || t.title}</p>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--stone)' }}>
                    Bid due {t.deadline || 'Open'}
                  </p>
                  {t.scope && (
                    <p className="text-[12px] mt-2 line-clamp-2" style={{ color: 'var(--stone)' }}>
                      {t.scope}
                    </p>
                  )}
                  <TagRow tags={services} />
                  {(t.budget_min || t.budget_max) && (
                    <p className="text-[12px] mt-2 font-medium" style={{ color: 'var(--amber)' }}>
                      {money(t.budget_min)} – {money(t.budget_max)}
                    </p>
                  )}
                </>
              )

              return (
                <PhotoCard
                  key={t.id}
                  href={isContractor ? `/marketplace/tenders/${t.id}` : undefined}
                  cover={cover}
                  alt={t.project_name || t.title || 'Project'}
                  overlay={overlay}
                >
                  {body}
                </PhotoCard>
              )
            })
          )}
        </div>
      )}

      {!loading && tab === 'architects' && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {failed.architects ? (
            <div className="sm:col-span-2 xl:col-span-3">
              <ErrorState
                title="Could not load the architect directory"
                description="This is a loading problem, not an empty directory. Try again in a moment."
                onRetry={load}
              />
            </div>
          ) : filteredArchitects.length === 0 ? (
            <div className="sm:col-span-2 xl:col-span-3">
              <EmptyState
                icon="architecture"
                title={architects.length ? 'No architects match your search' : 'No architects listed yet'}
                description={
                  architects.length
                    ? `None of the ${architects.length} listed practices match this city and discipline. Clear a filter to widen the search.`
                    : 'Architect profiles appear here as practices join 5Bloc.'
                }
              />
            </div>
          ) : (
            filteredArchitects.map((a) => <ArchitectCard key={a.id} architect={a} />)
          )}
        </div>
      )}

      {!loading && (tab === 'contractors' || tab === 'vendors') && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {failed.listings ? (
            <div className="sm:col-span-2 xl:col-span-3">
              <ErrorState
                title={tab === 'vendors' ? 'Could not load the vendor directory' : 'Could not load the contractor directory'}
                description="This is a loading problem, not an empty directory. Try again in a moment."
                onRetry={load}
              />
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="sm:col-span-2 xl:col-span-3">
              <EmptyState
                icon={tab === 'vendors' ? 'inventory_2' : 'construction'}
                title={
                  activeListings.length
                    ? tab === 'vendors'
                      ? 'No vendors match your search'
                      : 'No contractors match your search'
                    : tab === 'vendors'
                      ? 'No vendors listed yet'
                      : 'No contractors listed yet'
                }
                description={
                  activeListings.length
                    ? `None of the ${activeListings.length} listed businesses match this search, city and category. Clear a filter to widen the search.`
                    : tab === 'vendors'
                      ? 'Suppliers appear here once they list their business.'
                      : 'Contractors appear here once they list their business.'
                }
                actionLabel={activeListings.length ? undefined : 'Invite a business to list'}
                href={activeListings.length ? undefined : tab === 'vendors' ? '/join-as-vendor' : '/list-your-business'}
              />
            </div>
          ) : (
            filteredListings.map((l) => <ListingCard key={l.id} listing={l} />)
          )}
        </div>
      )}

      {tab === 'bids' && !isContractor && (
        <div className="space-y-3">
          {loading ? (
            <Skeleton lines={4} />
          ) : failed.bids ? (
            <ErrorState
              title="Could not load bids"
              description="Any bids contractors have sent you are safe — we just could not read them. Try again in a moment."
              onRetry={load}
            />
          ) : reviewBids.length === 0 ? (
            <EmptyState
              icon="gavel"
              title={bids.length ? 'No bids left to review' : 'No bids awaiting review'}
              description={
                bids.length
                  ? 'Every bid on your projects has already been awarded or rejected. New ones will appear here.'
                  : 'When contractors submit bids on your open projects, they land here for shortlisting, award or rejection.'
              }
            />
          ) : (
            reviewBids.map((b) => (
              <div key={b.id} className="p-5 rounded-2xl space-y-3" style={{ background: 'var(--surface-container)' }}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{b.tenders?.title || b.tender_title || 'Bid'}</p>
                      {b.status === 'shortlisted' && (
                        <span className="chip text-[10px]" style={chipStyle(true)}>
                          Shortlisted
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] mt-1" style={{ color: 'var(--stone)' }}>
                      {b.contractors?.company_name || 'Contractor'} · {money(b.amount)} ·{' '}
                      {b.timeline_weeks ? `${b.timeline_weeks} weeks` : 'Timeline not stated'}
                    </p>
                    {b.methodology && (
                      <p className="text-[12px] mt-2" style={{ color: 'var(--stone)' }}>
                        {b.methodology}
                      </p>
                    )}
                    {b.boq_url && (
                      <a
                        href={b.boq_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] underline"
                        style={{ color: 'var(--amber)' }}
                      >
                        View BOQ
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {b.status !== 'shortlisted' && (
                      <button
                        className="btn-secondary text-[12px]"
                        disabled={shortlisting === b.id}
                        onClick={() => shortlistBid(b)}
                      >
                        {shortlisting === b.id ? 'Saving…' : 'Shortlist'}
                      </button>
                    )}
                    <button
                      className="btn-primary text-[12px]"
                      disabled={busyBid === b.id}
                      onClick={() => setAward({ bid: b, status: 'accepted' })}
                    >
                      Award
                    </button>
                    <button
                      className="btn-secondary text-[12px]"
                      disabled={busyBid === b.id}
                      onClick={() => setAward({ bid: b, status: 'rejected' })}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!award}
        title={award?.status === 'accepted' ? 'Award this bid?' : 'Reject this bid?'}
        message={
          award?.status === 'accepted'
            ? `${award?.bid?.contractors?.company_name || 'This contractor'} will be added to the project team at ${money(
                award?.bid?.amount
              )} and bidding will close for this project.`
            : `${award?.bid?.contractors?.company_name || 'This contractor'} will be notified that their bid was not selected.`
        }
        confirmLabel={award?.status === 'accepted' ? 'Award bid' : 'Reject bid'}
        variant={award?.status === 'rejected' ? 'danger' : 'default'}
        loading={!!busyBid}
        onConfirm={confirmAward}
        onCancel={() => setAward(null)}
      >
        {award?.status === 'rejected' && (
          <>
            <label className="block text-[11px] mb-1" style={{ color: 'var(--stone)' }}>
              Reason shared with the contractor
            </label>
            <input className="input-5bloc" value={rejectionNote} onChange={(e) => setRejectionNote(e.target.value)} />
          </>
        )}
      </ConfirmDialog>
    </div>
  )
}
