'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import OnboardingChecklist from '@/components/layout/OnboardingChecklist'

interface Project {
 id: string; name: string; type: string; phase: string
 status: string; city: string; state: string
 total_sqft: number; construction_cost: number
 rera_number: string; is_rera_registered: boolean
}

const phaseStyle = (phase: string) => {
 switch (phase) {
 case 'construction_docs': return { background: 'rgba(122,184,255,.12)', color: 'var(--blue)' }
 case 'design_development': return { background: 'rgba(245,166,35,.12)', color: 'var(--amber)' }
 default: return { background: 'rgba(159,142,122,.10)', color: 'var(--stone)' }
 }
}

const kpiConfig = [
 { title: 'Active Projects', value: '3', icon: 'space_dashboard', sub: 'In execution', accentVar: '--amber' },
 { title: 'Open RFIs', value: '4', icon: 'forum', sub: '2 need review', accentVar: '--error' },
 { title: 'Invoices Due', value: '₹4,15,000', icon: 'receipt_long', sub: '3 outstanding', accentVar: '--blue' },
 { title: 'Fees Collected', value: '₹12,40,000', icon: 'payments', sub: 'This month', accentVar: '--success' },
]

const activityIconMap: Record<string, { icon: string; accentVar: string }> = {
 upload: { icon: 'upload_file', accentVar: '--blue' },
 rfi: { icon: 'forum', accentVar: '--error' },
 approve: { icon: 'verified', accentVar: '--success' },
 phase: { icon: 'auto_awesome', accentVar: '--amber' },
}

export default function Dashboard() {
 const [projects, setProjects] = useState<Project[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 const t = setTimeout(() => {
 setProjects([
 { id: 'proj-1', name: 'Wadhwa Prime Plaza', type: 'commercial', phase: 'construction_docs', status: 'active', city: 'Mumbai', state: 'MH', total_sqft: 45000, construction_cost: 120000000, rera_number: 'P51800012345', is_rera_registered: true },
 { id: 'proj-2', name: 'Lodha Signature Residences', type: 'residential', phase: 'design_development', status: 'active', city: 'Bangalore', state: 'KA', total_sqft: 22000, construction_cost: 65000000, rera_number: 'PRM/KA/RERA/1251/310', is_rera_registered: true },
 { id: 'proj-3', name: 'Gundecha Industrial Park', type: 'industrial', phase: 'pre_design', status: 'active', city: 'Pune', state: 'MH', total_sqft: 75000, construction_cost: 180000000, rera_number: '', is_rera_registered: false },
 ])
 setLoading(false)
 }, 600)
 return () => clearTimeout(t)
 }, [])

 const activities = [
 { id: 1, user: 'Aritro Roy', action: 'uploaded structural_column_v2.dwg', project: 'Wadhwa Prime Plaza', time: '10m', type: 'upload' },
 { id: 2, user: 'Parth Patel', action: 'approved Electrical Submittal #4', project: 'Lodha Signature Residences', time: '1h', type: 'approve' },
 { id: 3, user: 'Amit Sharma', action: 'raised RFI #8 on slab reinforcement', project: 'Wadhwa Prime Plaza', time: '3h', type: 'rfi' },
 { id: 4, user: 'System Sync', action: 'phase updated to Construction Docs', project: 'Gundecha Industrial Park', time: '1d', type: 'phase' },
 ]

 const getPhaseLabel = (p: string) =>
 p.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

 return (
 <div className="p-6 space-y-8 max-w-screen-xl mx-auto">

 {/* ── Header ── */}
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
 <div>
 <p className="label-sm mb-1" style={{ color: 'var(--stone)' }}>Overview</p>
 <h1 className="font-display text-[36px] leading-[40px]" style={{ color: 'var(--on-surface)' }}>
 Workspace Dashboard
 </h1>
 <p className="text-[12px] mt-1" style={{ color: 'var(--on-surface-variant)' }}>
 Manage firm projects, document approvals, and milestones.
 </p>
 </div>
 <Link href="/projects/new" className="btn-primary shrink-0">
 <span className="material-icons-outlined text-[16px]">add</span>
 New Project
 </Link>
 </div>

 {/* ── KPI Cards ── */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {kpiConfig.map((kpi, idx) => {
 const accent = `var(${kpi.accentVar})`
 return (
 <div
 key={idx}
 className="card-glass flex items-start justify-between"
 style={{ boxShadow: `inset 3px 0 0 ${accent}, var(--shadow-2)` }}
 >
 <div className="flex-1 min-w-0">
 <p className="label-sm mb-2" style={{ color: 'var(--stone)' }}>{kpi.title}</p>
 <p className="text-[26px] font-bold leading-tight" style={{ color: 'var(--on-surface)' }}>
 {kpi.value}
 </p>
 <p className="text-[11px] mt-1.5" style={{ color: accent }}>{kpi.sub}</p>
 </div>
 <div
 className="w-10 h-10 flex items-center justify-center shrink-0 ml-3"
 style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}
 >
 <span className="material-icons-outlined text-[20px]">{kpi.icon}</span>
 </div>
 </div>
 )
 })}
 </div>

 {/* ── Projects + Activity ── */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

 {/* Projects 2/3 */}
 <div className="lg:col-span-2 space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-[14px] font-semibold" style={{ color: 'var(--on-surface)' }}>
 Ongoing Projects
 </h2>
 <Link href="/projects" className="text-[12px]" style={{ color: 'var(--blue)' }}>
 View all ({projects.length}) →
 </Link>
 </div>

 {loading ? (
 <div className="space-y-3">
 {[1, 2].map((i) => (
 <div key={i} className="h-28 animate-pulse" style={{ background: 'var(--surface-container-high)' }} />
 ))}
 </div>
 ) : projects.length === 0 ? (
 <div className="card-5bloc py-16 flex flex-col items-center text-center">
 <span className="material-icons-outlined text-[48px] mb-4" style={{ color: 'var(--stone)' }}>space_dashboard</span>
 <h3 className="text-[13px] font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>No active projects</h3>
 <p className="text-[12px] mb-5" style={{ color: 'var(--stone)' }}>Create your first project to coordinate with team.</p>
 <Link href="/projects/new" className="btn-primary">Create project</Link>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {projects.map((proj) => {
 const ps = phaseStyle(proj.phase)
 return (
 <Link
 key={proj.id}
 href={`/projects/${proj.id}`}
 className="card-5bloc block group"
 style={{ padding: '18px 20px' }}
 onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-amber)' }}
 onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-2)' }}
 >
 <div className="flex items-start justify-between gap-2 mb-3">
 <span className="label-sm" style={{ color: 'var(--stone)' }}>{proj.type}</span>
 <span className="chip shrink-0" style={ps}>{getPhaseLabel(proj.phase)}</span>
 </div>

 <h3 className="text-[14px] font-bold leading-tight truncate" style={{ color: 'var(--on-surface)' }}>
 {proj.name}
 </h3>

 <div className="flex items-center gap-1.5 mt-2" style={{ color: 'var(--stone)' }}>
 <span className="material-icons-outlined text-[13px]">place</span>
 <span className="text-[12px]">{proj.city}, {proj.state}</span>
 </div>

 <div
 className="mt-4 pt-3 flex items-center justify-between text-[11px]"
 style={{ boxShadow: '0 -1px 0 rgba(159,142,122,0.10)' }}
 >
 <div className="flex items-center gap-1.5">
 {proj.is_rera_registered ? (
 <>
 <span className="material-icons-outlined text-[13px]" style={{ color: 'var(--success)' }}>verified</span>
 <span style={{ color: 'var(--stone)' }}>RERA:</span>
 <span style={{ color: 'var(--on-surface-variant)' }}>{proj.rera_number.slice(0, 8)}…</span>
 </>
 ) : (
 <>
 <span className="material-icons-outlined text-[13px]" style={{ color: 'var(--stone)' }}>info</span>
 <span style={{ color: 'var(--stone)' }}>RERA not registered</span>
 </>
 )}
 </div>
 <span style={{ color: 'var(--success)' }}>● Active</span>
 </div>
 </Link>
 )
 })}
 </div>
 )}
 </div>

 {/* Activity Feed 1/3 */}
 <div className="space-y-4">
 <h2 className="text-[14px] font-semibold" style={{ color: 'var(--on-surface)' }}>
 Recent Activity
 </h2>
 <div className="card-glass" style={{ padding: 0 }}>
 {activities.map((act, idx) => {
 const ai = activityIconMap[act.type] || activityIconMap.phase
 const accent = `var(${ai.accentVar})`
 return (
 <div
 key={act.id}
 className="flex gap-3 px-4 py-4"
 style={
 idx < activities.length - 1
 ? { boxShadow: '0 1px 0 rgba(159,142,122,0.08)' }
 : {}
 }
 >
 <div
 className="w-7 h-7 shrink-0 flex items-center justify-center"
 style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}
 >
 <span className="material-icons-outlined text-[15px]">{ai.icon}</span>
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-[12px] leading-relaxed" style={{ color: 'var(--on-surface)' }}>
 <span className="font-semibold">{act.user}</span>{' '}
 <span style={{ color: 'var(--on-surface-variant)' }}>{act.action}</span>
 </p>
 <div className="flex items-center justify-between mt-1.5">
 <span className="text-[11px] truncate" style={{ color: 'var(--stone)' }}>{act.project}</span>
 <span className="label-sm shrink-0 ml-2" style={{ color: 'var(--stone)' }}>{act.time}</span>
 </div>
 </div>
 </div>
 )
 })}
 </div>
 </div>

 </div>

 <OnboardingChecklist />
 </div>
 )
}
