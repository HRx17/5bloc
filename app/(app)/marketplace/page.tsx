'use client'

import React, { useState, useEffect } from 'react'
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
 const [searchQuery, setSearchQuery] = useState('')
 const [filterCity, setFilterCity] = useState('all')
 const [filterSpec, setFilterSpec] = useState('all')
 const [filterVerified, setFilterVerified] = useState(false)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 // Mock load contractor seeds
 const timer = setTimeout(() => {
 setContractors([
 {
 id: 'con-1',
 company_name: 'Amit Sharma Civil Construction Ltd.',
 bio: 'Specialists in pile foundations, RCC frame structures, and structural brickwork in Mumbai.',
 specializations: ['Civil', 'Foundation', 'Masonry'],
 service_cities: ['Mumbai', 'Pune'],
 years_experience: 12,
 verified: true,
 badge_active: true,
 rating: 4.8,
 reviews_count: 14,
 jobs_completed: 38,
 },
 {
 id: 'con-2',
 company_name: 'Rajesh Glass Works & Facades',
 bio: 'High-end double glazing, structural curtain walls, and spider-glass facade installations.',
 specializations: ['Facade', 'Glass', 'Glazing'],
 service_cities: ['Mumbai', 'Bangalore', 'Pune'],
 years_experience: 8,
 verified: true,
 badge_active: true,
 rating: 4.6,
 reviews_count: 9,
 jobs_completed: 21,
 },
 {
 id: 'con-3',
 company_name: 'Rohan Deshmukh MEP Consultants',
 bio: 'Comprehensive HVAC plumbing, drainage ducts, electrical wiring, and high-tension sub-station design.',
 specializations: ['MEP', 'Electrical', 'Plumbing'],
 service_cities: ['Pune', 'Mumbai'],
 years_experience: 15,
 verified: false,
 badge_active: false,
 rating: 4.2,
 reviews_count: 6,
 jobs_completed: 18,
 },
 {
 id: 'con-4',
 company_name: 'GreenScapes India Landscape Architects',
 bio: 'Bespoke terrace garden planting, structural water features, and landscape design planning.',
 specializations: ['Landscape', 'Interior'],
 service_cities: ['Bangalore', 'Chennai'],
 years_experience: 10,
 verified: true,
 badge_active: true,
 rating: 4.9,
 reviews_count: 19,
 jobs_completed: 45,
 }
 ])
 setLoading(false)
 }, 400)
 return () => clearTimeout(timer)
 }, [])

 // Filter contractors
 const filtered = contractors.filter(c => {
 const matchesSearch = c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
 c.bio.toLowerCase().includes(searchQuery.toLowerCase())
 const matchesCity = filterCity === 'all' || c.service_cities.some(city => city.toLowerCase() === filterCity.toLowerCase())
 const matchesSpec = filterSpec === 'all' || c.specializations.some(s => s.toLowerCase() === filterSpec.toLowerCase())
 const matchesVerified = !filterVerified || c.verified
 return matchesSearch && matchesCity && matchesSpec && matchesVerified
 })

 return (
 <div className="p-6 space-y-6 font-body select-none max-w-7xl mx-auto">
 {/* Page Title */}
 <div>
 <h1 className="text-2xl font-bold tracking-wide">Contractor Marketplace</h1>
 <p className="text-xs text-stone mt-1">Discover, verify, and invite trusted AEC professionals to your projects.</p>
 </div>

 {/* Main Layout containing Search and Filter Panel */}
 <div className="flex flex-col lg:flex-row gap-6 items-start">
 
 {/* Left Filter Sidebar panel */}
 <div className="card-5bloc w-full lg:w-64 shrink-0 space-y-5">
 <div className="flex items-center justify-between pb-2 ">
 <span className="text-xs font-bold uppercase tracking-wider text-amber font-mono">Filters</span>
 <span 
 onClick={() => { setFilterCity('all'); setFilterSpec('all'); setFilterVerified(false); setSearchQuery('') }}
 className="text-[10px] text-stone hover:text-amber cursor-pointer font-mono uppercase"
 >
 Reset
 </span>
 </div>

 {/* Search Input filter */}
 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Keywords</label>
 <input
 type="text"
 placeholder="Search services, skills..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>

 {/* City filter */}
 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Service City</label>
 <select
 value={filterCity}
 onChange={(e) => setFilterCity(e.target.value)}
 className="input-5bloc py-1.5 text-xs font-medium"
 >
 <option value="all">All Cities</option>
 <option value="mumbai">Mumbai</option>
 <option value="pune">Pune</option>
 <option value="bangalore">Bangalore</option>
 </select>
 </div>

 {/* Specialization filter */}
 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Specialization</label>
 <select
 value={filterSpec}
 onChange={(e) => setFilterSpec(e.target.value)}
 className="input-5bloc py-1.5 text-xs font-medium"
 >
 <option value="all">All Specialties</option>
 <option value="civil">Civil Foundations</option>
 <option value="facade">Glass Facades</option>
 <option value="mep">MEP Services</option>
 <option value="landscape">Landscape Design</option>
 </select>
 </div>

 {/* Verified toggle filter */}
 <div className="flex items-center justify-between pt-2 ">
 <label htmlFor="verifiedOnly" className="text-xs text-white cursor-pointer select-none">
 Verified Badges Only
 </label>
 <input
 type="checkbox"
 id="verifiedOnly"
 checked={filterVerified}
 onChange={(e) => setFilterVerified(e.target.checked)}
 className="rounded bg-navy accent-amber w-4 h-4 cursor-pointer"
 />
 </div>
 </div>

 {/* Right side Grid showing matching contractors */}
 <div className="flex-1 w-full space-y-4">
 <div className="flex items-center justify-between text-xs text-stone font-mono">
 <span>SHOWING {filtered.length} CONTRACTORS</span>
 <span>SORT: POPULARITY</span>
 </div>

 {loading ? (
 <div className="space-y-4">
 {[1, 2].map(i => (
 <div key={i} className="card-5bloc h-44 animate-pulse" />
 ))}
 </div>
 ) : filtered.length === 0 ? (
 <div className="card-5bloc py-16 flex flex-col items-center justify-center text-center text-stone">
 <span className="material-icons-outlined text-[48px] text-stone/20 mb-3">engineering</span>
 <h4 className="text-sm font-bold text-white">No contractors match filters</h4>
 <p className="text-xs max-w-xs mt-1">Try relaxing filter constraints or search terms.</p>
 </div>
 ) : (
 <div className="space-y-4">
 {filtered.map((con) => (
 <div key={con.id} className="card-5bloc flex flex-col md:flex-row gap-5 justify-between items-start md:items-center hover: transition-colors">
 <div className="flex-1 space-y-2">
 <div className="flex flex-wrap items-center gap-2">
 <h3 className="text-base font-bold text-white leading-tight">
 {con.company_name}
 </h3>
 {con.verified && (
 <span className="text-[9px] font-mono text-success bg-success/15 border px-2 py-0.5 flex items-center gap-0.5 font-bold">
 <span className="material-icons-outlined text-[12px]">verified</span> VERIFIED
 </span>
 )}
 </div>

 <p className="text-xs text-stone leading-relaxed max-w-xl">{con.bio}</p>

 {/* Specialization pills */}
 <div className="flex flex-wrap gap-1.5 pt-1">
 {con.specializations.map(s => (
 <span key={s} className="bg-navy text-amber text-[9px] font-mono px-2 py-0.5">
 {s.toUpperCase()}
 </span>
 ))}
 </div>
 </div>

 {/* Right statistics panels and CTAs */}
 <div className="md:text-right shrink-0 flex flex-col items-end gap-3.5 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
 <div className="flex items-center gap-4 text-xs font-mono text-stone">
 <div>
 <span className="text-amber font-bold text-sm">{con.rating}</span>
 <span className="text-[10px]"> ★ ({con.reviews_count} reviews)</span>
 </div>
 <span>•</span>
 <div>
 <span className="text-white font-semibold">{con.jobs_completed}</span>
 <span> completed</span>
 </div>
 </div>

 <div className="flex gap-2 w-full md:w-auto">
 <Link 
 href={`/marketplace/${con.id}`}
 className="btn-secondary py-1.5 text-xs flex-1 md:flex-none text-center"
 >
 VIEW PROFILE
 </Link>
 <button 
 onClick={() => alert(`Invited ${con.company_name} to bid on active projects (simulated)`)}
 className="btn-primary py-1.5 text-xs font-bold flex-1 md:flex-none"
 >
 INVITE TO BID
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 </div>
 </div>
 )
}

