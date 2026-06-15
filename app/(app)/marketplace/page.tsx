'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/data/client-data'
import { useToast } from '@/components/ui/Toast'

/* ── Types ── */
interface Contractor {
  id: string
  company_name: string
  bio: string
  specializations: string[]
  service_cities: string[]
  years_experience: number
  verified: boolean
  photos: string[]
  country: string
  contact_name: string
  email: string
  phone: string | null
  website: string | null
  team_size: string | null
  isLive: boolean   // true = from contractor_signups
}

interface Vendor {
  id: string
  company_name: string
  bio: string
  categories: string[]
  service_cities: string[]
  years_experience: number
  verified: boolean
  photos: string[]
  country: string
  contact_name: string
  email: string
  phone: string | null
  website: string | null
  team_size: string | null
}

type Tab = 'contractors' | 'vendors'

/* ── Seeded mock contractors (shown as fallback / alongside live data) ── */
const MOCK_CONTRACTORS: Contractor[] = [
  {
    id: 'con-1',
    company_name: 'Amit Sharma Civil Construction Ltd.',
    bio: 'Specialists in pile foundations, RCC frame structures, and structural brickwork in Mumbai.',
    specializations: ['Civil & Structural', 'Masonry & Concrete', 'General Contracting'],
    service_cities: ['Mumbai', 'Pune'],
    years_experience: 12,
    verified: true,
    photos: [],
    country: 'india',
    contact_name: 'Amit Sharma',
    email: 'amit@asccl.in',
    phone: null,
    website: null,
    team_size: '11–50',
    isLive: false,
  },
  {
    id: 'con-2',
    company_name: 'Rajesh Glass Works & Facades',
    bio: 'High-end double glazing, structural curtain walls, and spider-glass facade installations.',
    specializations: ['Glazing & Facade', 'Steel & Fabrication'],
    service_cities: ['Mumbai', 'Bengaluru', 'Pune'],
    years_experience: 8,
    verified: true,
    photos: [],
    country: 'india',
    contact_name: 'Rajesh Mehta',
    email: 'rajesh@rgw.in',
    phone: null,
    website: null,
    team_size: '11–50',
    isLive: false,
  },
  {
    id: 'con-3',
    company_name: 'Rohan Deshmukh MEP Consultants',
    bio: 'Comprehensive HVAC, plumbing, drainage, electrical wiring and HT sub-station design.',
    specializations: ['HVAC', 'Electrical', 'Plumbing'],
    service_cities: ['Pune', 'Mumbai'],
    years_experience: 15,
    verified: false,
    photos: [],
    country: 'india',
    contact_name: 'Rohan Deshmukh',
    email: 'rohan@rdmep.in',
    phone: null,
    website: null,
    team_size: '2–10',
    isLive: false,
  },
]

const MOCK_VENDORS: Vendor[] = [
  {
    id: 'ven-1',
    company_name: 'SteelCraft Supplies',
    bio: 'Premium structural steel, MS pipes, and fabricated metalwork delivered across Maharashtra.',
    categories: ['Steel & Metal', 'Building Materials'],
    service_cities: ['Mumbai', 'Pune', 'Nagpur'],
    years_experience: 18,
    verified: true,
    photos: [],
    country: 'india',
    contact_name: 'Vishal Patil',
    email: 'sales@steelcraft.in',
    phone: null,
    website: null,
    team_size: '51–200',
  },
  {
    id: 'ven-2',
    company_name: 'Luminos Lighting Solutions',
    bio: 'Architectural lighting, LED strip systems, and smart-home integration for residential and commercial projects.',
    categories: ['Lighting & Fixtures', 'Electrical Supplies'],
    service_cities: ['Bengaluru', 'Chennai', 'Hyderabad'],
    years_experience: 9,
    verified: true,
    photos: [],
    country: 'india',
    contact_name: 'Priya Nair',
    email: 'priya@luminos.in',
    phone: null,
    website: null,
    team_size: '2–10',
  },
]

export default function Marketplace() {
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('contractors')
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCity, setFilterCity] = useState('all')
  const [filterSpec, setFilterSpec] = useState('all')
  const [filterVerified, setFilterVerified] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!hasSupabaseEnv()) {
        setContractors(MOCK_CONTRACTORS)
        setVendors(MOCK_VENDORS)
        setLoading(false)
        return
      }

      const [cRes, vRes] = await Promise.all([
        supabaseClient
          .from('contractor_signups')
          .select('*')
          .order('created_at', { ascending: false }),
        supabaseClient
          .from('vendor_signups')
          .select('*')
          .order('created_at', { ascending: false }),
      ])

      if (cancelled) return

      // Map contractor_signups → Contractor
      const liveContractors: Contractor[] = (cRes.data || []).map((row) => ({
        id: row.id,
        company_name: row.business_name,
        bio: row.bio || '',
        specializations: row.specializations || [],
        service_cities: [row.city, row.state].filter(Boolean) as string[],
        years_experience: row.years_experience || 0,
        verified: row.status === 'approved',
        photos: row.photos || [],
        country: row.country,
        contact_name: row.contact_name,
        email: row.email,
        phone: row.phone,
        website: row.website,
        team_size: row.team_size,
        isLive: true,
      }))

      // Merge: put live entries first, then mocks (excluding any with same name to avoid double-ups)
      const liveNames = new Set(liveContractors.map((c) => c.company_name.toLowerCase()))
      const merged = [
        ...liveContractors,
        ...MOCK_CONTRACTORS.filter((m) => !liveNames.has(m.company_name.toLowerCase())),
      ]
      setContractors(merged)

      // Map vendor_signups → Vendor
      const liveVendors: Vendor[] = (vRes.data || []).map((row) => ({
        id: row.id,
        company_name: row.business_name,
        bio: row.bio || '',
        categories: row.categories || [],
        service_cities: [row.city, row.state].filter(Boolean) as string[],
        years_experience: row.years_experience || 0,
        verified: row.status === 'approved',
        photos: row.photos || [],
        country: row.country,
        contact_name: row.contact_name,
        email: row.email,
        phone: row.phone,
        website: row.website,
        team_size: row.team_size,
      }))
      const liveVendorNames = new Set(liveVendors.map((v) => v.company_name.toLowerCase()))
      const mergedVendors = [
        ...liveVendors,
        ...MOCK_VENDORS.filter((m) => !liveVendorNames.has(m.company_name.toLowerCase())),
      ]
      setVendors(mergedVendors)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  const resetFilters = () => {
    setFilterCity('all')
    setFilterSpec('all')
    setFilterVerified(false)
    setSearchQuery('')
  }

  const filteredContractors = contractors.filter((c) => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || c.company_name.toLowerCase().includes(q) || c.bio.toLowerCase().includes(q) || c.specializations.some((s) => s.toLowerCase().includes(q))
    const matchCity = filterCity === 'all' || c.service_cities.some((ci) => ci.toLowerCase().includes(filterCity.toLowerCase()))
    const matchSpec = filterSpec === 'all' || c.specializations.some((s) => s.toLowerCase().includes(filterSpec.toLowerCase()))
    const matchVerified = !filterVerified || c.verified
    return matchSearch && matchCity && matchSpec && matchVerified
  })

  const filteredVendors = vendors.filter((v) => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || v.company_name.toLowerCase().includes(q) || v.bio.toLowerCase().includes(q) || v.categories.some((c) => c.toLowerCase().includes(q))
    const matchCity = filterCity === 'all' || v.service_cities.some((ci) => ci.toLowerCase().includes(filterCity.toLowerCase()))
    const matchCat = filterSpec === 'all' || v.categories.some((c) => c.toLowerCase().includes(filterSpec.toLowerCase()))
    return matchSearch && matchCity && matchCat
  })

  const count = tab === 'contractors' ? filteredContractors.length : filteredVendors.length

  return (
    <div className="p-6 space-y-6 font-body select-none max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">Marketplace</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--stone)' }}>
            Discover and invite trusted AEC professionals and suppliers to your projects.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/list-your-business"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary py-1.5 text-xs"
          >
            <span className="material-icons-outlined text-[14px]">add_business</span>
            List as Contractor
          </a>
          <a
            href="/join-as-vendor"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary py-1.5 text-xs"
          >
            <span className="material-icons-outlined text-[14px]">storefront</span>
            List as Vendor
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--surface-container)' }}>
        {(['contractors', 'vendors'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-lg text-[12.5px] font-semibold capitalize transition-all"
            style={{
              background: tab === t ? 'var(--surface-container-high)' : 'transparent',
              color: tab === t ? 'var(--on-surface)' : 'var(--stone)',
              boxShadow: tab === t ? 'inset 0 0 0 1px var(--hairline)' : 'none',
            }}
          >
            {t === 'contractors' ? 'Contractors' : 'Vendors & Suppliers'}
            {tab === t && (
              <span
                className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(245,166,35,0.14)', color: 'var(--amber)' }}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Filter sidebar */}
        <div className="card-5bloc w-full lg:w-64 shrink-0 space-y-5">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--amber)' }}>Filters</span>
            <span
              onClick={resetFilters}
              className="text-[10px] cursor-pointer font-mono uppercase transition-colors"
              style={{ color: 'var(--stone)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--amber)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--stone)')}
            >
              Reset
            </span>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono" style={{ color: 'var(--stone)' }}>Keywords</label>
            <input
              type="text"
              placeholder={tab === 'contractors' ? 'Skills, trade, name…' : 'Materials, product, name…'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-5bloc py-1.5 text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono" style={{ color: 'var(--stone)' }}>City</label>
            <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="input-5bloc py-1.5 text-xs font-medium">
              <option value="all">All Cities</option>
              <option value="mumbai">Mumbai</option>
              <option value="pune">Pune</option>
              <option value="bengaluru">Bengaluru</option>
              <option value="delhi">Delhi</option>
              <option value="hyderabad">Hyderabad</option>
              <option value="chennai">Chennai</option>
              <option value="austin">Austin</option>
              <option value="denver">Denver</option>
              <option value="chicago">Chicago</option>
            </select>
          </div>

          {tab === 'contractors' ? (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono" style={{ color: 'var(--stone)' }}>Specialization</label>
              <select value={filterSpec} onChange={(e) => setFilterSpec(e.target.value)} className="input-5bloc py-1.5 text-xs font-medium">
                <option value="all">All Trades</option>
                <option value="civil">Civil & Structural</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="hvac">HVAC</option>
                <option value="facade">Glazing & Facade</option>
                <option value="interior">Interior Fit-out</option>
                <option value="landscape">Landscaping</option>
                <option value="masonry">Masonry & Concrete</option>
                <option value="steel">Steel & Fabrication</option>
                <option value="solar">Solar & Renewables</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono" style={{ color: 'var(--stone)' }}>Category</label>
              <select value={filterSpec} onChange={(e) => setFilterSpec(e.target.value)} className="input-5bloc py-1.5 text-xs font-medium">
                <option value="all">All Categories</option>
                <option value="steel">Steel & Metal</option>
                <option value="building">Building Materials</option>
                <option value="electrical">Electrical Supplies</option>
                <option value="lighting">Lighting & Fixtures</option>
                <option value="tiles">Tiles & Flooring</option>
                <option value="timber">Timber & Wood</option>
                <option value="plumbing">Plumbing & HVAC</option>
                <option value="glass">Glass & Aluminium</option>
                <option value="paint">Paint & Finishes</option>
                <option value="sanitary">Sanitary Ware</option>
                <option value="safety">Safety Equipment</option>
              </select>
            </div>
          )}

          {tab === 'contractors' && (
            <div className="flex items-center justify-between pt-2">
              <label htmlFor="verifiedOnly" className="text-xs cursor-pointer select-none" style={{ color: 'var(--on-surface)' }}>
                Verified only
              </label>
              <input
                type="checkbox"
                id="verifiedOnly"
                checked={filterVerified}
                onChange={(e) => setFilterVerified(e.target.checked)}
                className="rounded w-4 h-4 cursor-pointer accent-amber"
              />
            </div>
          )}
        </div>

        {/* Results grid */}
        <div className="flex-1 w-full space-y-4">
          <div className="flex items-center justify-between text-xs font-mono" style={{ color: 'var(--stone)' }}>
            <span>SHOWING {count} {tab.toUpperCase()}</span>
            <span>SORT: NEWEST FIRST</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => <div key={i} className="card-5bloc h-44 animate-pulse" />)}
            </div>
          ) : tab === 'contractors' ? (
            filteredContractors.length === 0 ? (
              <EmptyState type="contractors" onClear={resetFilters} />
            ) : (
              <div className="space-y-4">
                {filteredContractors.map((con) => (
                  <ContractorCard key={con.id} con={con} onInvite={() => toast(`Invite sent to ${con.company_name}.`, 'success')} />
                ))}
              </div>
            )
          ) : (
            filteredVendors.length === 0 ? (
              <EmptyState type="vendors" onClear={resetFilters} />
            ) : (
              <div className="space-y-4">
                {filteredVendors.map((ven) => (
                  <VendorCard key={ven.id} vendor={ven} onContact={() => toast(`Contact request sent to ${ven.company_name}.`, 'success')} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function ContractorCard({ con, onInvite }: { con: Contractor; onInvite: () => void }) {
  return (
    <div className="card-5bloc flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold leading-tight" style={{ color: 'var(--on-surface)' }}>{con.company_name}</h3>
          {con.verified && (
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 flex items-center gap-0.5" style={{ color: 'var(--success)', background: 'rgba(46,204,138,0.12)', boxShadow: 'inset 0 0 0 1px rgba(46,204,138,0.2)' }}>
              <span className="material-icons-outlined text-[12px]">verified</span> VERIFIED
            </span>
          )}
          {con.isLive && (
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 flex items-center gap-0.5" style={{ color: 'var(--blue)', background: 'rgba(122,184,255,0.1)', boxShadow: 'inset 0 0 0 1px rgba(122,184,255,0.2)' }}>
              <span className="material-icons-outlined text-[11px]">fiber_new</span> SELF-LISTED
            </span>
          )}
        </div>

        {con.bio && <p className="text-xs leading-relaxed max-w-xl" style={{ color: 'var(--stone)' }}>{con.bio}</p>}

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {con.specializations.map((s) => (
            <span key={s} className="text-[9px] font-mono px-2 py-0.5" style={{ background: 'var(--surface-container-high)', color: 'var(--amber)' }}>
              {s.toUpperCase()}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 text-[11px] pt-0.5" style={{ color: 'var(--stone)' }}>
          {con.service_cities.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="material-icons-outlined text-[13px]">location_on</span>
              {con.service_cities.join(', ')}
            </span>
          )}
          {con.years_experience > 0 && (
            <span className="flex items-center gap-1">
              <span className="material-icons-outlined text-[13px]">work_history</span>
              {con.years_experience}yr exp
            </span>
          )}
          {con.team_size && (
            <span className="flex items-center gap-1">
              <span className="material-icons-outlined text-[13px]">group</span>
              {con.team_size}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-start md:items-end gap-2.5 w-full md:w-auto border-t md:border-t-0 pt-3.5 md:pt-0" style={{ borderColor: 'var(--hairline)' }}>
        {con.website && (
          <a href={con.website} target="_blank" rel="noreferrer" className="text-[11px] flex items-center gap-1 transition-colors" style={{ color: 'var(--blue)' }}>
            <span className="material-icons-outlined text-[13px]">open_in_new</span>
            Website
          </a>
        )}
        <div className="flex gap-2 w-full md:w-auto">
          <Link href={`/marketplace/${con.id}`} className="btn-secondary py-1.5 text-xs flex-1 md:flex-none text-center">
            VIEW PROFILE
          </Link>
          <button onClick={onInvite} className="btn-primary py-1.5 text-xs font-bold flex-1 md:flex-none">
            INVITE TO BID
          </button>
        </div>
      </div>
    </div>
  )
}

function VendorCard({ vendor, onContact }: { vendor: Vendor; onContact: () => void }) {
  return (
    <div className="card-5bloc flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold leading-tight" style={{ color: 'var(--on-surface)' }}>{vendor.company_name}</h3>
          {vendor.verified && (
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 flex items-center gap-0.5" style={{ color: 'var(--success)', background: 'rgba(46,204,138,0.12)', boxShadow: 'inset 0 0 0 1px rgba(46,204,138,0.2)' }}>
              <span className="material-icons-outlined text-[12px]">verified</span> VERIFIED
            </span>
          )}
        </div>

        {vendor.bio && <p className="text-xs leading-relaxed max-w-xl" style={{ color: 'var(--stone)' }}>{vendor.bio}</p>}

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {vendor.categories.map((c) => (
            <span key={c} className="text-[9px] font-mono px-2 py-0.5" style={{ background: 'var(--surface-container-high)', color: 'var(--blue)' }}>
              {c.toUpperCase()}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 text-[11px] pt-0.5" style={{ color: 'var(--stone)' }}>
          {vendor.service_cities.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="material-icons-outlined text-[13px]">location_on</span>
              {vendor.service_cities.join(', ')}
            </span>
          )}
          {vendor.years_experience > 0 && (
            <span className="flex items-center gap-1">
              <span className="material-icons-outlined text-[13px]">work_history</span>
              {vendor.years_experience}yr exp
            </span>
          )}
          {vendor.team_size && (
            <span className="flex items-center gap-1">
              <span className="material-icons-outlined text-[13px]">group</span>
              {vendor.team_size}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-start md:items-end gap-2.5 w-full md:w-auto border-t md:border-t-0 pt-3.5 md:pt-0" style={{ borderColor: 'var(--hairline)' }}>
        {vendor.website && (
          <a href={vendor.website} target="_blank" rel="noreferrer" className="text-[11px] flex items-center gap-1 transition-colors" style={{ color: 'var(--blue)' }}>
            <span className="material-icons-outlined text-[13px]">open_in_new</span>
            Website
          </a>
        )}
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={onContact} className="btn-primary py-1.5 text-xs font-bold flex-1 md:flex-none">
            CONTACT SUPPLIER
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ type, onClear }: { type: string; onClear: () => void }) {
  return (
    <div className="card-5bloc py-16 flex flex-col items-center justify-center text-center">
      <span className="material-icons-outlined text-[48px] mb-3" style={{ color: 'var(--stone)', opacity: 0.2 }}>
        {type === 'vendors' ? 'storefront' : 'engineering'}
      </span>
      <h4 className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>No {type} match your filters</h4>
      <p className="text-xs max-w-xs mt-1 mb-4" style={{ color: 'var(--stone)' }}>
        Try relaxing the filters or clearing your search.
      </p>
      <button onClick={onClear} className="btn-secondary py-1.5 text-xs">Clear filters</button>
    </div>
  )
}
