'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'

interface ProjectData {
 id: string; name: string; type: string; phase: string
 status: string; city: string; state: string
 is_rera_registered: boolean; rera_number: string
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
 const params = useParams()
 const pathname = usePathname()
 const router = useRouter()
 const projectId = params.id as string

 const [project, setProject] = useState<ProjectData | null>(null)
 const [showActions, setShowActions] = useState(false)

 useEffect(() => {
 setProject({
 id: projectId,
 name: projectId === 'proj-2' ? 'Lodha Signature Residences' : projectId === 'proj-3' ? 'Gundecha Industrial Park' : 'Wadhwa Prime Plaza',
 type: projectId === 'proj-2' ? 'residential' : projectId === 'proj-3' ? 'industrial' : 'commercial',
 phase: projectId === 'proj-2' ? 'design_development' : projectId === 'proj-3' ? 'pre_design' : 'construction_docs',
 status: 'active',
 city: projectId === 'proj-2' ? 'Bangalore' : projectId === 'proj-3' ? 'Pune' : 'Mumbai',
 state: projectId === 'proj-2' ? 'KA' : 'MH',
 is_rera_registered: projectId !== 'proj-3',
 rera_number: projectId === 'proj-2' ? 'PRM/KA/RERA/1251' : 'P51800012345',
 })
 }, [projectId])

 if (!project) {
 return (
 <div className="p-8 flex items-center justify-center min-h-screen" style={{ color: 'var(--stone)' }}>
 <span className="animate-spin material-icons-outlined mr-2">sync</span>
 Loading project…
 </div>
 )
 }

 const tabs = [
 { name: 'Overview', path: `/projects/${projectId}` },
 { name: 'Documents', path: `/projects/${projectId}/documents` },
 { name: 'RFIs', path: `/projects/${projectId}/rfis` },
 { name: 'Submittals', path: `/projects/${projectId}/submittals` },
 { name: 'Messages', path: `/projects/${projectId}/messages` },
 { name: 'Meetings', path: `/projects/${projectId}/meetings` },
 { name: 'Issues', path: `/projects/${projectId}/issues` },
 { name: 'Site', path: `/projects/${projectId}/site` },
 { name: 'Permits', path: `/projects/${projectId}/permits` },
 { name: 'Transmittals', path: `/projects/${projectId}/transmittals` },
 { name: 'Invoices', path: `/projects/${projectId}/invoices` },
 { name: 'Team', path: `/projects/${projectId}/team` },
 { name: 'Settings', path: `/projects/${projectId}/settings` },
 ]

 const isTabActive = (tabPath: string) =>
 tabPath === `/projects/${projectId}` ? pathname === tabPath : pathname.startsWith(tabPath)

 const handleArchive = () => {
 alert('Project archived successfully (simulated)')
 router.push('/projects')
 }

 return (
 <div className="flex flex-col h-full select-none">

 {/* ── Project Banner ── */}
 <div
 className="px-6 pt-5 pb-0 shrink-0"
 style={{
 background: 'var(--surface-container)',
 boxShadow: 'var(--shadow-2)',
 }}
 >
 <div className="max-w-7xl mx-auto">
 <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
 {/* Left: title block */}
 <div className="space-y-1.5">
 {/* Chips row */}
 <div className="flex flex-wrap items-center gap-2">
 <span
 className="chip"
 style={{ background: 'rgba(159,142,122,.12)', color: 'var(--stone)' }}
 >
 {project.type}
 </span>
 {project.is_rera_registered && (
 <span
 className="chip flex items-center gap-1"
 style={{ background: 'rgba(111,220,140,.12)', color: 'var(--success)' }}
 >
 <span className="material-icons-outlined text-[11px]">verified</span>
 RERA Compliant
 </span>
 )}
 </div>

 <h1
 className="font-display text-[32px] leading-[36px] mt-1"
 style={{ color: 'var(--on-surface)' }}
 >
 {project.name}
 </h1>

 <div className="flex items-center gap-3 text-[12px]" style={{ color: 'var(--stone)' }}>
 <span className="flex items-center gap-1">
 <span className="material-icons-outlined text-[13px]">place</span>
 {project.city}, {project.state}
 </span>
 <span>·</span>
 <span className="label-sm">ID: {project.id}</span>
 </div>
 </div>

 {/* Right: actions */}
 <div className="flex items-center gap-2 self-start relative">
 <Link
 href={`/portal/${project.rera_number || 'demo-token'}`}
 target="_blank"
 className="btn-secondary text-[12px]"
 >
 <span className="material-icons-outlined text-[15px]">open_in_new</span>
 Client Portal
 </Link>

 <div>
 <button
 onClick={() => setShowActions(!showActions)}
 className="btn-secondary"
 style={{ padding: '10px 12px' }}
 >
 <span className="material-icons-outlined text-[18px]">more_horiz</span>
 </button>

 {showActions && (
 <>
 <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
 <div
 className="absolute right-0 mt-2 w-48 py-1 z-20 text-[12px]"
 style={{
 background: 'var(--surface-container-high)',
 boxShadow: 'var(--shadow-4)',
 }}
 >
 <button
 onClick={() => { setShowActions(false); handleArchive() }}
 className="w-full text-left px-4 py-2.5 flex items-center gap-2"
 style={{ color: 'var(--stone)' }}
 onMouseEnter={(e) => {
 const t = e.currentTarget as HTMLElement
 t.style.background = 'var(--surface-container-highest)'
 t.style.color = 'var(--error)'
 }}
 onMouseLeave={(e) => {
 const t = e.currentTarget as HTMLElement
 t.style.background = ''
 t.style.color = 'var(--stone)'
 }}
 >
 <span className="material-icons-outlined text-[16px]">archive</span>
 Archive Project
 </button>
 <button
 onClick={() => setShowActions(false)}
 className="w-full text-left px-4 py-2.5 flex items-center gap-2"
 style={{ color: 'var(--stone)' }}
 onMouseEnter={(e) => {
 const t = e.currentTarget as HTMLElement
 t.style.background = 'var(--surface-container-highest)'
 t.style.color = 'var(--on-surface)'
 }}
 onMouseLeave={(e) => {
 const t = e.currentTarget as HTMLElement
 t.style.background = ''
 t.style.color = 'var(--stone)'
 }}
 >
 <span className="material-icons-outlined text-[16px]">refresh</span>
 Reset Portal Link
 </button>
 </div>
 </>
 )}
 </div>
 </div>
 </div>

 {/* ── Tab Bar ── */}
 <div className="flex overflow-x-auto gap-1">
 {tabs.map((tab) => {
 const active = isTabActive(tab.path)
 return (
 <Link
 key={tab.name}
 href={tab.path}
 className="text-[12px] font-medium px-3 py-2.5 shrink-0 relative"
 style={{
 color: active ? 'var(--amber)' : 'var(--stone)',
 fontWeight: active ? '600' : '500',
 /* active indicator: inset bottom shadow */
 boxShadow: active ? 'inset 0 -2px 0 var(--amber-dk)' : 'none',
 }}
 onMouseEnter={(e) => {
 if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--on-surface)'
 }}
 onMouseLeave={(e) => {
 if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--stone)'
 }}
 >
 {tab.name}
 </Link>
 )
 })}
 </div>
 </div>
 </div>

 {/* ── Tab Content ── */}
 <div className="flex-grow overflow-y-auto">
 <div className="max-w-7xl mx-auto p-6">
 {children}
 </div>
 </div>
 </div>
 )
}
