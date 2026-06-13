'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase/client'

interface Project {
 id: string; name: string; type: string; phase: string
 status: string; city: string; state: string
 total_sqft: number; construction_cost: number
 is_rera_registered: boolean
}

const phaseStyle = (phase: string): React.CSSProperties => {
 switch (phase) {
 case 'construction_docs': return { background: 'rgba(122,184,255,.12)', color: 'var(--blue)' }
 case 'design_development': return { background: 'rgba(245,166,35,.12)', color: 'var(--amber)' }
 case 'complete': return { background: 'rgba(111,220,140,.12)', color: 'var(--success)' }
 default: return { background: 'rgba(159,142,122,.10)', color: 'var(--stone)' }
 }
}

export default function ProjectsList() {
 const [projects, setProjects] = useState<Project[]>([])
 const [filterPhase, setFilterPhase] = useState('all')
 const [filterCity, setFilterCity] = useState('all')
 const [searchQuery, setSearchQuery] = useState('')
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 async function load() {
 try {
 const hasKeys = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
 if (hasKeys) {
 const { data, error } = await supabaseClient.from('projects').select('*').order('created_at', { ascending: false })
 if (!error && data && data.length > 0) { setProjects(data as unknown as Project[]); setLoading(false); return }
 }
 } catch (e) { console.warn('Supabase fallback:', e) }

 setProjects([
 { id: 'proj-1', name: 'Wadhwa Prime Plaza', type: 'commercial', phase: 'construction_docs', status: 'active', city: 'Mumbai', state: 'MH', total_sqft: 45000, construction_cost: 120000000, is_rera_registered: true },
 { id: 'proj-2', name: 'Lodha Signature Residences', type: 'residential', phase: 'design_development', status: 'active', city: 'Bangalore', state: 'KA', total_sqft: 22000, construction_cost: 65000000, is_rera_registered: true },
 { id: 'proj-3', name: 'Gundecha Industrial Park', type: 'industrial', phase: 'pre_design', status: 'active', city: 'Pune', state: 'MH', total_sqft: 75000, construction_cost: 180000000, is_rera_registered: false },
 ])
 setLoading(false)
 }
 load()
 }, [])

 const getPhaseLabel = (p: string) =>
 p.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

 const filtered = projects.filter((p) => {
 const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
 const matchPhase = filterPhase === 'all' || p.phase === filterPhase
 const matchCity = filterCity === 'all' || p.city.toLowerCase() === filterCity.toLowerCase()
 return matchSearch && matchPhase && matchCity
 })

 const exportCSV = () => {
 const hdrs = ['Name', 'Type', 'Phase', 'Status', 'City', 'State', 'SqFt', 'Cost (INR)', 'RERA']
 const rows = filtered.map((p) => [p.name, p.type, p.phase, p.status, p.city, p.state, p.total_sqft, p.construction_cost, p.is_rera_registered ? 'YES' : 'NO'])
 const csv = [hdrs, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
 const a = Object.assign(document.createElement('a'), {
 href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })),
 download: 'projects_export.csv',
 })
 document.body.appendChild(a); a.click(); document.body.removeChild(a)
 }

 return (
 <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">

 {/* ── Header ── */}
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
 <div>
 <p className="label-sm mb-1" style={{ color: 'var(--stone)' }}>Projects</p>
 <h1 className="font-display text-[36px] leading-[40px]" style={{ color: 'var(--on-surface)' }}>
 Projects Registry
 </h1>
 <p className="text-[12px] mt-1" style={{ color: 'var(--on-surface-variant)' }}>
 Manage and track architectural workflows across all commissions.
 </p>
 </div>
 <div className="flex items-center gap-3 shrink-0">
 <button onClick={exportCSV} className="btn-secondary text-[12px]">
 <span className="material-icons-outlined text-[15px]">file_download</span>
 Export CSV
 </button>
 <Link href="/projects/new" className="btn-primary text-[12px]">
 <span className="material-icons-outlined text-[15px]">add</span>
 New Project
 </Link>
 </div>
 </div>

 {/* ── Filters ── */}
 <div className="card-5bloc flex flex-col md:flex-row gap-4 items-center justify-between" style={{ padding: '14px 20px' }}>
 <div className="relative w-full md:w-72">
 <span className="material-icons-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none" style={{ color: 'var(--stone)' }}>
 search
 </span>
 <input
 type="text"
 placeholder="Search by name..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="input-5bloc pl-9 text-[12.5px] py-2"
 />
 </div>

 <div className="flex flex-wrap items-center gap-3">
 <div className="flex items-center gap-2">
 <span className="label-sm" style={{ color: 'var(--stone)' }}>Phase</span>
 <select
 value={filterPhase}
 onChange={(e) => setFilterPhase(e.target.value)}
 className="input-5bloc text-[12px] py-2 px-3 w-auto cursor-pointer"
 >
 <option value="all">All Phases</option>
 <option value="pre_design">Pre-Design</option>
 <option value="schematic_design">Schematic Design</option>
 <option value="design_development">Design Development</option>
 <option value="construction_docs">Construction Docs</option>
 <option value="bidding">Bidding</option>
 <option value="permits">Permits</option>
 <option value="construction_admin">Construction Admin</option>
 <option value="complete">Complete</option>
 </select>
 </div>

 <div className="flex items-center gap-2">
 <span className="label-sm" style={{ color: 'var(--stone)' }}>City</span>
 <select
 value={filterCity}
 onChange={(e) => setFilterCity(e.target.value)}
 className="input-5bloc text-[12px] py-2 px-3 w-auto cursor-pointer"
 >
 <option value="all">All Cities</option>
 <option value="mumbai">Mumbai</option>
 <option value="bangalore">Bangalore</option>
 <option value="pune">Pune</option>
 </select>
 </div>
 </div>
 </div>

 {/* ── Project Grid ── */}
 {loading ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {[1, 2, 3].map((i) => (
 <div key={i} className="h-44 animate-pulse" style={{ background: 'var(--surface-container-high)' }} />
 ))}
 </div>
 ) : filtered.length === 0 ? (
 <div className="card-5bloc py-16 flex flex-col items-center text-center">
 <span className="material-icons-outlined text-[48px] mb-3" style={{ color: 'var(--stone)' }}>folder_off</span>
 <h3 className="text-[13px] font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>No projects found</h3>
 <p className="text-[12px]" style={{ color: 'var(--stone)' }}>Try modifying your search or filter criteria.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filtered.map((proj) => (
 <Link
 key={proj.id}
 href={`/projects/${proj.id}`}
 className="card-5bloc flex flex-col justify-between group"
 style={{ minHeight: '180px' }}
 onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-amber)' }}
 onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-2)' }}
 >
 {/* Top */}
 <div>
 <div className="flex justify-between items-start gap-2 mb-3">
 <span className="label-sm" style={{ color: 'var(--stone)' }}>{proj.type}</span>
 <span className="chip shrink-0" style={phaseStyle(proj.phase)}>
 {getPhaseLabel(proj.phase)}
 </span>
 </div>

 <h3 className="text-[15px] font-bold leading-tight line-clamp-1" style={{ color: 'var(--on-surface)' }}>
 {proj.name}
 </h3>

 <div className="flex items-center gap-1.5 mt-2" style={{ color: 'var(--stone)' }}>
 <span className="material-icons-outlined text-[13px]">place</span>
 <span className="text-[12px]">{proj.city}, {proj.state}</span>
 </div>
 </div>

 {/* Bottom row */}
 <div
 className="pt-3 mt-4 flex items-center justify-between text-[11px]"
 style={{ boxShadow: '0 -1px 0 rgba(159,142,122,0.10)' }}
 >
 <span style={{ color: 'var(--on-surface-variant)' }}>
 Area:{' '}
 <span className="font-semibold" style={{ color: 'var(--on-surface)' }}>
 {proj.total_sqft.toLocaleString()} sqft
 </span>
 </span>
 {proj.is_rera_registered ? (
 <span className="flex items-center gap-1" style={{ color: 'var(--success)' }}>
 <span className="material-icons-outlined text-[13px]">verified</span>
 RERA
 </span>
 ) : (
 <span style={{ color: 'var(--stone)' }}>Non-RERA</span>
 )}
 </div>
 </Link>
 ))}
 </div>
 )}
 </div>
 )
}
