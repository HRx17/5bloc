'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ExternalLink, MoreHorizontal, Archive, RefreshCw, ChevronDown } from 'lucide-react'

interface ProjectData {
  id: string; name: string; type: string; phase: string
  status: string; city: string; state: string
  is_rera_registered: boolean; rera_number: string
}

/* ── 6 grouped sections (from IA) instead of 13 flat tabs ── */
const SECTIONS = [
  {
    name: 'Overview',
    icon: 'home',
    path: (id: string) => `/projects/${id}`,
    exact: true,
    desc: 'Phase, milestones & team',
  },
  {
    name: 'Documents',
    icon: 'folder_open',
    path: (id: string) => `/projects/${id}/documents`,
    desc: 'Drawings, versions & approvals',
    subItems: [
      { name: 'Drawing Register', path: (id: string) => `/projects/${id}/documents` },
      { name: 'Submittals',       path: (id: string) => `/projects/${id}/submittals` },
      { name: 'Transmittals',     path: (id: string) => `/projects/${id}/transmittals` },
    ],
  },
  {
    name: 'Coordination',
    icon: 'forum',
    path: (id: string) => `/projects/${id}/rfis`,
    desc: 'RFIs, messages & meetings',
    subItems: [
      { name: 'RFIs',           path: (id: string) => `/projects/${id}/rfis` },
      { name: 'Messages',       path: (id: string) => `/projects/${id}/messages` },
      { name: 'Meetings',       path: (id: string) => `/projects/${id}/meetings` },
      { name: 'Issues',         path: (id: string) => `/projects/${id}/issues` },
    ],
  },
  {
    name: 'Site & Field',
    icon: 'construction',
    path: (id: string) => `/projects/${id}/site`,
    desc: 'Visits, photos & permits',
    subItems: [
      { name: 'Site Visits',  path: (id: string) => `/projects/${id}/site` },
      { name: 'Permits',      path: (id: string) => `/projects/${id}/permits` },
    ],
  },
  {
    name: 'Finance',
    icon: 'receipt_long',
    path: (id: string) => `/projects/${id}/invoices`,
    desc: 'Invoices & expenses',
  },
  {
    name: 'Team',
    icon: 'group',
    path: (id: string) => `/projects/${id}/team`,
    desc: 'Collaborators & access',
  },
]

const PHASE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pre_design:         { label: 'Pre-Design',          color: 'var(--stone)',   bg: 'rgba(138,128,120,.10)' },
  schematic_design:   { label: 'Schematic Design',    color: 'var(--blue)',    bg: 'rgba(122,184,255,.10)' },
  design_development: { label: 'Design Development',  color: 'var(--amber)',   bg: 'rgba(245,166,35,.10)'  },
  construction_docs:  { label: 'Construction Docs',   color: 'var(--blue)',    bg: 'rgba(122,184,255,.10)' },
  bidding:            { label: 'Bidding',              color: 'var(--purple)',  bg: 'rgba(167,139,250,.10)' },
  construction_admin: { label: 'Construction',        color: 'var(--success)', bg: 'rgba(46,204,138,.10)'  },
  closeout:           { label: 'Closeout',             color: 'var(--stone)',   bg: 'rgba(138,128,120,.10)' },
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params    = useParams()
  const pathname  = usePathname()
  const router    = useRouter()
  const projectId = params.id as string

  const [project, setProject]         = useState<ProjectData | null>(null)
  const [showActions, setShowActions] = useState(false)
  const [openSub, setOpenSub]         = useState<string | null>(null)

  useEffect(() => {
    setProject({
      id: projectId,
      name: projectId === 'proj-2'
        ? 'Lodha Signature Residences'
        : projectId === 'proj-3'
          ? 'Gundecha Industrial Park'
          : 'Wadhwa Prime Plaza',
      type: projectId === 'proj-2' ? 'Residential' : projectId === 'proj-3' ? 'Industrial' : 'Commercial',
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
      <div className="flex items-center justify-center h-full gap-2" style={{ color: 'var(--stone)' }}>
        <span className="material-icons-outlined animate-spin text-[20px]">sync</span>
        <span className="text-[13px]">Loading project…</span>
      </div>
    )
  }

  const phase = PHASE_LABELS[project.phase] ?? PHASE_LABELS.pre_design

  const isSectionActive = (s: typeof SECTIONS[0]) => {
    if (s.exact) return pathname === s.path(projectId)
    if ('subItems' in s && s.subItems) {
      return s.subItems.some((sub) => pathname.startsWith(sub.path(projectId)))
        || pathname.startsWith(s.path(projectId))
    }
    return pathname.startsWith(s.path(projectId))
  }

  const isSubActive = (sub: { path: (id: string) => string }) =>
    pathname.startsWith(sub.path(projectId))

  return (
    <div className="flex flex-col h-full">

      {/* ── Project header banner ── */}
      <div
        className="shrink-0 px-5 pt-4 pb-0"
        style={{
          background: 'var(--surface-container)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div className="max-w-[1280px] mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 mb-3 text-[12px]" style={{ color: 'var(--stone)' }}>
            <Link
              href="/projects"
              className="transition-colors hover:text-(--on-surface)"
            >
              Projects
            </Link>
            <ChevronRight className="h-3 w-3 opacity-40" />
            <span style={{ color: 'var(--on-surface-variant)' }}>{project.name}</span>
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {/* Phase badge */}
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: phase.bg, color: phase.color }}
                >
                  <span className="h-1.5 w-1.5 rounded-full inline-block pulse-dot" style={{ background: phase.color }} />
                  {phase.label}
                </span>

                {/* Type chip */}
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--on-surface-variant)' }}
                >
                  {project.type}
                </span>

                {/* RERA */}
                {project.is_rera_registered && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{ background: 'rgba(46,204,138,.10)', color: 'var(--success)' }}
                  >
                    <span className="material-icons-outlined text-[11px]">verified</span>
                    RERA
                  </span>
                )}
              </div>

              <h1
                className="font-display font-bold text-[26px] leading-tight line-clamp-2"
                style={{ color: 'var(--on-surface)' }}
              >
                {project.name}
              </h1>

              <p className="text-[12px] mt-1 flex items-center gap-1" style={{ color: 'var(--stone)' }}>
                <span className="material-icons-outlined text-[12px]">place</span>
                {project.city}, {project.state}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/portal/${project.rera_number || 'demo-token'}`}
                target="_blank"
                className="btn-secondary text-[12px] py-2 px-3 gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Client Portal
              </Link>

              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors"
                  style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                <AnimatePresence>
                  {showActions && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                      <motion.div
                        className="absolute right-0 mt-2 w-52 py-1.5 rounded-xl z-20 overflow-hidden"
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          background: 'var(--surface-container-high)',
                          boxShadow: 'var(--shadow-4)',
                        }}
                      >
                        <button
                          onClick={() => { setShowActions(false); alert('Archived (simulated)'); router.push('/projects') }}
                          className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-[12.5px] font-medium transition-colors"
                          style={{ color: 'var(--stone)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--error)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,138,128,0.06)' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--stone)'; (e.currentTarget as HTMLElement).style.background = '' }}
                        >
                          <Archive className="h-3.5 w-3.5" />
                          Archive project
                        </button>
                        <button
                          onClick={() => setShowActions(false)}
                          className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-[12.5px] font-medium transition-colors"
                          style={{ color: 'var(--stone)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--on-surface)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--stone)'; (e.currentTarget as HTMLElement).style.background = '' }}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Reset portal link
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ── Section tabs (6 sections, no more 13) ── */}
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {SECTIONS.map((section) => {
              const active = isSectionActive(section)
              const hasSubs = 'subItems' in section && section.subItems && section.subItems.length > 0
              const subOpen = openSub === section.name

              return (
                <div key={section.name} className="relative shrink-0">
                  {hasSubs ? (
                    <button
                      onClick={() => setOpenSub(subOpen ? null : section.name)}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors relative"
                      style={{
                        color: active ? 'var(--on-surface)' : 'var(--stone)',
                        fontWeight: active ? '600' : '500',
                        boxShadow: active ? 'inset 0 -2px 0 var(--amber)' : 'none',
                      }}
                    >
                      <span className="material-icons-outlined text-[15px]">{section.icon}</span>
                      {section.name}
                      <ChevronDown
                        className="h-3 w-3 transition-transform"
                        style={{ transform: subOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                    </button>
                  ) : (
                    <Link
                      href={section.path(projectId)}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors relative"
                      style={{
                        color: active ? 'var(--on-surface)' : 'var(--stone)',
                        fontWeight: active ? '600' : '500',
                        boxShadow: active ? 'inset 0 -2px 0 var(--amber)' : 'none',
                      }}
                      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--on-surface-variant)' }}
                      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--stone)' }}
                    >
                      <span className="material-icons-outlined text-[15px]">{section.icon}</span>
                      {section.name}
                    </Link>
                  )}

                  {/* Sub-menu dropdown */}
                  <AnimatePresence>
                    {hasSubs && subOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenSub(null)} />
                        <motion.div
                          className="absolute left-0 top-full mt-1 w-48 py-1.5 rounded-xl z-20 overflow-hidden"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.14 }}
                          style={{
                            background: 'var(--surface-container-high)',
                            boxShadow: 'var(--shadow-3)',
                          }}
                        >
                          {(section.subItems as { name: string; path: (id: string) => string }[]).map((sub) => {
                            const subActive = isSubActive(sub)
                            return (
                              <Link
                                key={sub.name}
                                href={sub.path(projectId)}
                                onClick={() => setOpenSub(null)}
                                className="flex items-center px-4 py-2.5 text-[12.5px] font-medium transition-colors gap-2"
                                style={{ color: subActive ? 'var(--amber)' : 'var(--on-surface-variant)' }}
                                onMouseEnter={(e) => { if (!subActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                              >
                                {subActive && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: 'var(--amber)' }} />}
                                {sub.name}
                              </Link>
                            )
                          })}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1280px] mx-auto px-5 py-6">
          {children}
        </div>
      </div>
    </div>
  )
}
