'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarWidget } from '@/components/integrations/CalendarWidget'

interface Project {
  id: string; name: string; type: string; phase: string
  status: string; city: string; openRfis: number
}

const PHASE_META: Record<string, { label: string; color: string; bg: string; step: number }> = {
  pre_design:         { label: 'Pre-Design',         color: 'var(--stone)',   bg: 'rgba(138,128,120,.12)', step: 1 },
  schematic_design:   { label: 'Schematic Design',   color: 'var(--blue)',    bg: 'rgba(122,184,255,.12)', step: 2 },
  design_development: { label: 'Design Dev',         color: 'var(--amber)',   bg: 'rgba(245,166,35,.12)',  step: 3 },
  construction_docs:  { label: 'Construction Docs',  color: 'var(--blue)',    bg: 'rgba(122,184,255,.12)', step: 4 },
  bidding:            { label: 'Bidding',             color: 'var(--purple)', bg: 'rgba(167,139,250,.12)',  step: 5 },
  construction_admin: { label: 'Construction',       color: 'var(--success)', bg: 'rgba(46,204,138,.12)',  step: 6 },
  closeout:           { label: 'Closeout',            color: 'var(--stone)',   bg: 'rgba(138,128,120,.12)', step: 7 },
}

const PHASES_ORDERED = [
  'pre_design','schematic_design','design_development',
  'construction_docs','bidding','construction_admin','closeout',
]

/* Onboarding steps from IA */
const ONBOARDING_STEPS = [
  { id: 'client',      label: 'Add your first client',     icon: 'contacts',       href: '/clients',           done: false },
  { id: 'project',     label: 'Create your first project', icon: 'space_dashboard',href: '/projects',          done: true  },
  { id: 'doc',         label: 'Upload a document',         icon: 'upload_file',    href: '/documents',         done: false },
  { id: 'ai',          label: 'Try the AI cost estimator', icon: 'auto_awesome',   href: '/ai/estimate',       done: false },
  { id: 'collaborator',label: 'Invite a collaborator',     icon: 'group_add',      href: '/settings?tab=team', done: false },
]

function PhaseBar({ phase }: { phase: string }) {
  const currentStep = PHASE_META[phase]?.step ?? 1
  return (
    <div className="flex items-center gap-1 mt-2">
      {PHASES_ORDERED.map((p, i) => {
        const meta = PHASE_META[p]
        const isActive = p === phase
        const isDone = (meta?.step ?? 0) < currentStep
        return (
          <div
            key={p}
            title={PHASE_META[p]?.label}
            className="h-1.5 flex-1 rounded-full transition-all"
            style={{
              background: isActive ? meta?.color : isDone ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
            }}
          />
        )
      })}
    </div>
  )
}

function ProjectCard({ proj, delay }: { proj: Project; delay: number }) {
  const meta = PHASE_META[proj.phase] ?? PHASE_META.pre_design
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
    >
      <Link
        href={`/projects/${proj.id}`}
        className="block rounded-2xl p-5 transition-all"
        style={{
          background: 'var(--surface-container)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-amber)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 1px 0 rgba(255,255,255,0.04)')}
      >
        {/* Project type + RFI alert */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--stone)' }}>
            {proj.type}
          </span>
          {proj.openRfis > 0 && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,138,128,.12)', color: 'var(--error)' }}
            >
              {proj.openRfis} RFI{proj.openRfis > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <h3
          className="font-semibold text-[14px] leading-snug"
          style={{ color: 'var(--on-surface)' }}
        >
          {proj.name}
        </h3>

        <p className="text-[12px] mt-1" style={{ color: 'var(--stone)' }}>
          {proj.city}
        </p>

        {/* Phase progress bar */}
        <PhaseBar phase={proj.phase} />

        <div className="flex items-center justify-between mt-2.5">
          <span
            className="text-[11px] px-2 py-0.5 rounded-full"
            style={{ background: meta.bg, color: meta.color }}
          >
            {meta.label}
          </span>
          <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--success)' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success)', boxShadow: '0 0 0 3px rgba(46,204,138,.18)' }} />
            Active
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

function OnboardingCard() {
  const done   = ONBOARDING_STEPS.filter((s) => s.done).length
  const total  = ONBOARDING_STEPS.length
  const pct    = Math.round((done / total) * 100)
  const [open, setOpen] = useState(true)

  if (!open) return null

  return (
    <motion.div
      className="rounded-2xl p-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--surface-container)',
        boxShadow: 'inset 0 0 0 1px rgba(245,166,35,0.10)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--amber)', opacity: 0.8 }}>
            Getting started
          </p>
          <h3 className="text-[15px] font-semibold" style={{ color: 'var(--on-surface)' }}>
            Set up your workspace
          </h3>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--stone)' }}>
            {done}/{total} steps complete
          </p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--stone)', background: 'transparent' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          Dismiss
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: 'var(--amber)' }}
        />
      </div>

      {/* Step list */}
      <div className="space-y-2">
        {ONBOARDING_STEPS.map((step) => (
          <Link
            key={step.id}
            href={step.done ? '#' : step.href}
            className="flex items-center gap-3 p-3 rounded-xl transition-all"
            style={{ opacity: step.done ? 0.5 : 1 }}
            onMouseEnter={(e) => { if (!step.done) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div
              className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
              style={{
                background: step.done ? 'rgba(46,204,138,.12)' : 'rgba(255,255,255,.05)',
                color: step.done ? 'var(--success)' : 'var(--stone)',
              }}
            >
              <span className="material-icons-outlined text-[14px]">
                {step.done ? 'check' : step.icon}
              </span>
            </div>
            <span
              className="text-[13px] font-medium flex-1"
              style={{
                color: step.done ? 'var(--stone)' : 'var(--on-surface)',
                textDecoration: step.done ? 'line-through' : 'none',
              }}
            >
              {step.label}
            </span>
            {!step.done && (
              <span className="material-icons-outlined text-[14px]" style={{ color: 'var(--stone)', opacity: 0.4 }}>
                arrow_forward
              </span>
            )}
          </Link>
        ))}
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading,  setLoading]  = useState(true)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    const t = setTimeout(() => {
      setProjects([
        { id: 'proj-1', name: 'Wadhwa Prime Plaza', type: 'Commercial', phase: 'construction_docs', status: 'active', city: 'Mumbai', openRfis: 3 },
      ])
      setLoading(false)
    }, 500)
    return () => clearTimeout(t)
  }, [])

  const activities = [
    { id: 1, icon: 'upload_file', accent: 'var(--blue)',    user: 'Aritro Roy',  action: 'uploaded structural column drawings',        project: 'Wadhwa', time: '10m', href: '/projects/proj-1' },
    { id: 2, icon: 'verified',    accent: 'var(--success)', user: 'Parth Patel', action: 'approved Electrical Submittal #4',           project: 'Wadhwa', time: '1h',  href: '/projects/proj-1' },
    { id: 3, icon: 'forum',       accent: 'var(--error)',   user: 'Amit Sharma', action: 'raised RFI #8',                              project: 'Wadhwa', time: '3h',  href: '/coordination'    },
    { id: 4, icon: 'auto_awesome',accent: 'var(--amber)',   user: 'System',      action: 'phase updated to Construction Docs',         project: 'Wadhwa', time: '1d',  href: '/projects/proj-1' },
  ]

  const totalRfis = projects.reduce((s, p) => s + p.openRfis, 0)

  return (
    <div className="p-5 lg:p-7 space-y-7 max-w-[1240px] mx-auto">

      {/* ── Welcome header ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="text-[12px] mb-1" style={{ color: 'var(--stone)' }}>
            {greeting}, Raj
          </p>
          <h1
            className="font-display font-bold text-[28px] lg:text-[34px] leading-tight"
            style={{ color: 'var(--on-surface)' }}
          >
            Your workspace
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--on-surface-variant)' }}>
            {loading ? '…' : `${projects.length} active projects · ${totalRfis} open RFIs`}
          </p>
        </div>
        <Link href="/projects/new" className="btn-primary shrink-0 text-[13px]">
          <span className="material-icons-outlined text-[15px]">add</span>
          New project
        </Link>
      </motion.div>

      {/* ── At-a-glance stat row ── */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        {[
          { label: 'Active projects', value: loading ? '—' : String(projects.length),  icon: 'space_dashboard', color: 'var(--amber)',   href: '/projects' },
          { label: 'Open RFIs',       value: loading ? '—' : String(totalRfis),         icon: 'forum',           color: 'var(--error)',   href: '/coordination' },
          { label: 'Invoices due',    value: '₹4.1L',  icon: 'receipt_long',   color: 'var(--blue)',    href: '/invoices' },
          { label: 'Fees collected',  value: '₹12.4L', icon: 'payments',       color: 'var(--success)', href: '/invoices' },
        ].map((stat, i) => (
          <Link
            key={stat.label}
            href={stat.href}
          >
            <motion.div
              className="rounded-2xl p-4 cursor-pointer"
              whileHover={{ y: -3, boxShadow: `inset 3px 0 0 ${stat.color}, 0 8px 24px rgba(0,0,0,0.2)` }}
              transition={{ duration: 0.18 }}
              style={{
                background: 'var(--surface-container)',
                boxShadow: `inset 3px 0 0 ${stat.color}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="material-icons-outlined text-[16px]" style={{ color: stat.color }}>{stat.icon}</span>
                <span className="text-[11px] font-medium" style={{ color: 'var(--stone)' }}>{stat.label}</span>
              </div>
              <p className="font-display font-bold text-[22px] leading-none" style={{ color: 'var(--on-surface)' }}>
                {stat.value}
              </p>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Projects list — 2/3 */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--stone)', opacity: 0.6 }}>
              Active Projects
            </h2>
            <Link
              href="/projects"
              className="text-[12px] transition-colors"
              style={{ color: 'var(--stone)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--amber)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--stone)')}
            >
              See all →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl p-5 h-[110px]" style={{ background: 'var(--surface-container)' }}>
                  <div className="skeleton h-3 w-1/4 rounded-full mb-3" />
                  <div className="skeleton h-4 w-3/5 rounded-full mb-2" />
                  <div className="skeleton h-2.5 w-2/5 rounded-full" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div
              className="rounded-2xl p-10 flex flex-col items-center text-center"
              style={{ background: 'var(--surface-container)' }}
            >
              <span className="material-icons-outlined text-[40px] mb-4" style={{ color: 'var(--stone)', opacity: 0.3 }}>
                space_dashboard
              </span>
              <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>
                No projects yet
              </h3>
              <p className="text-[13px] mb-5" style={{ color: 'var(--stone)' }}>
                Create your first project to get started
              </p>
              <Link href="/projects/new" className="btn-primary text-[13px]">
                Create project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map((proj, i) => (
                <ProjectCard key={proj.id} proj={proj} delay={0.12 + 0.06 * i} />
              ))}
              {/* Add new project card */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <Link
                  href="/projects/new"
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl p-5 h-full min-h-[120px] text-center transition-all"
                  style={{ background: 'transparent', border: '1.5px dashed rgba(255,255,255,0.08)', color: 'var(--stone)' }}
                  onMouseEnter={(e) => {
                    const t = e.currentTarget as HTMLElement
                    t.style.borderColor = 'rgba(245,166,35,0.30)'
                    t.style.color = 'var(--amber)'
                  }}
                  onMouseLeave={(e) => {
                    const t = e.currentTarget as HTMLElement
                    t.style.borderColor = 'rgba(255,255,255,0.08)'
                    t.style.color = 'var(--stone)'
                  }}
                >
                  <span className="material-icons-outlined text-[22px]">add_circle_outline</span>
                  <span className="text-[12.5px] font-medium">New project</span>
                </Link>
              </motion.div>
            </div>
          )}
        </div>

        {/* Right column — Activity + Quick actions */}
        <div className="space-y-4">

          {/* Onboarding checklist */}
          <OnboardingCard />

          {/* Activity feed */}
          <div>
            <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--stone)', opacity: 0.6 }}>
              Recent Activity
            </h2>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--surface-container)' }}
            >
              {activities.map((act, idx) => (
                <Link
                  key={act.id}
                  href={act.href}
                >
                  <motion.div
                    className="flex gap-3 px-4 py-3.5 cursor-pointer transition-colors"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + 0.06 * idx }}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.025)' }}
                    style={idx > 0 ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' } : {}}
                  >
                    <div
                      className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg"
                      style={{
                        background: `color-mix(in srgb, ${act.accent} 12%, transparent)`,
                        color: act.accent,
                      }}
                    >
                      <span className="material-icons-outlined text-[14px]">{act.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] leading-snug" style={{ color: 'var(--on-surface)' }}>
                        <span className="font-semibold">{act.user}</span>{' '}
                        <span style={{ color: 'var(--on-surface-variant)' }}>{act.action}</span>
                      </p>
                      <div className="flex justify-between mt-1">
                        <span className="text-[11px]" style={{ color: 'var(--stone)' }}>{act.project}</span>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--stone)', opacity: 0.5 }}>{act.time}</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--stone)', opacity: 0.6 }}>
              Quick Actions
            </h2>
            <div className="space-y-1.5">
              {[
              { label: 'New RFI',          icon: 'forum',         href: '/coordination', color: 'var(--error)'   },
              { label: 'Upload drawing',   icon: 'upload_file',   href: '/documents',    color: 'var(--blue)'    },
                { label: 'Send an invoice',  icon: 'receipt_long',  href: '/invoices/new', color: 'var(--success)' },
                { label: 'AI cost estimate', icon: 'auto_awesome',  href: '/ai/estimate',  color: 'var(--purple)'  },
              ].map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                  style={{ color: 'var(--on-surface-variant)' }}
                  onMouseEnter={(e) => {
                    const t = e.currentTarget as HTMLElement
                    t.style.background = 'var(--surface-container)'
                    t.style.color = 'var(--on-surface)'
                  }}
                  onMouseLeave={(e) => {
                    const t = e.currentTarget as HTMLElement
                    t.style.background = 'transparent'
                    t.style.color = 'var(--on-surface-variant)'
                  }}
                >
                  <span className="material-icons-outlined text-[15px]" style={{ color: a.color }}>{a.icon}</span>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Google Calendar widget ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="rounded-2xl p-4 relative"
            style={{ background: 'var(--surface-container)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 flex items-center justify-center rounded-lg"
                style={{ background: 'rgba(66,133,244,0.12)', color: '#4285F4' }}>
                <span className="material-icons-outlined text-[15px]">event</span>
              </div>
              <h3 className="text-[12px] font-bold" style={{ color: 'var(--on-surface)' }}>Calendar</h3>
            </div>
            <CalendarWidget compact className="max-h-[320px]" />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
