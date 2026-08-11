'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence, useInView, type UseInViewOptions } from 'framer-motion'
import { CheckCircle2, Circle, FileText, Users } from 'lucide-react'

const STEPS = [
  {
    id: 'project',
    phase: 'Project setup',
    title: 'Open a project. Invite the team.',
    body: 'Name the site, set the phase, and add who needs access — architect, contractor, client.',
    bullets: ['Phase tracker from brief to handover', 'Role-based access per person', 'One home for every file and message'],
    screenTitle: 'Kapoor Villa · Juhu',
    Screen: ProjectScreen,
  },
  {
    id: 'drawings',
    phase: 'Document control',
    title: 'Issue drawings with version history.',
    body: 'Upload sheets to the vault. Every revision stays linked — no more “which PDF is latest?”',
    bullets: ['Sheets numbered like your issue set', 'Current vs superseded at a glance', 'Structural and MEP cross-linked'],
    screenTitle: 'Document vault',
    Screen: DrawingsScreen,
  },
  {
    id: 'collaborate',
    phase: 'RFIs & coordination',
    title: 'Raise RFIs on the sheet they refer to.',
    body: 'Contractor questions stay tied to A-07 v14 — not buried in a WhatsApp thread.',
    bullets: ['RFI pinned to drawing + version', 'Status from open to answered', 'Drawing updated when resolved'],
    screenTitle: 'RFI #061',
    Screen: RfiScreen,
  },
  {
    id: 'client',
    phase: 'Client portal',
    title: 'Clients see progress in plain English.',
    body: 'Approvals, milestones, and site photos — without another app to install.',
    bullets: ['Weekly update in simple language', 'Sign-offs on samples and drawings', 'No login for your client team'],
    screenTitle: 'Client update',
    Screen: ClientScreen,
  },
] as const

type Step = (typeof STEPS)[number]

const UI = {
  bg: '#f5f5f7',
  surface: '#ffffff',
  border: 'rgba(0,0,0,0.08)',
  text: '#1d1d1f',
  muted: '#86868b',
  secondary: '#6e6e73',
  brand: 'var(--lp-brand)',
}

function AppScreen({
  title,
  children,
  compact = false,
}: {
  title: string
  children: React.ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={`overflow-hidden ${compact ? 'rounded-[0.875rem]' : 'rounded-[1.125rem]'}`}
      style={{
        background: UI.surface,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.06)',
      }}
    >
      <div
        className={`flex items-center justify-between ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
        style={{ background: UI.bg, borderBottom: `1px solid ${UI.border}` }}
      >
        <span
          className={`font-semibold tracking-tight ${compact ? 'text-[11px]' : 'text-[13px]'}`}
          style={{ color: UI.text }}
        >
          {title}
        </span>
        <span className={compact ? 'text-[10px]' : 'text-[11px]'} style={{ color: UI.muted }}>
          5Bloc
        </span>
      </div>
      <div className={compact ? 'p-3' : 'p-4 sm:p-5'}>{children}</div>
    </div>
  )
}

function ProjectScreen() {
  const team = ['PN', 'AK', 'RS', 'Client']
  const phases = ['Brief', 'Schematic', 'Design dev', 'Construction docs']

  return (
    <AppScreen title="Kapoor Villa · Juhu">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px]" style={{ color: UI.muted }}>
            Active phase
          </p>
          <p className="text-[15px] font-semibold mt-0.5" style={{ color: UI.text }}>
            Design development
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{ background: 'rgba(245,166,35,0.12)', color: '#b86a00' }}
        >
          On track
        </span>
      </div>

      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
        {phases.map((p, i) => (
          <span
            key={p}
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px]"
            style={{
              background: i === 2 ? UI.text : UI.bg,
              color: i === 2 ? '#fff' : UI.secondary,
            }}
          >
            {p}
          </span>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {[
          { label: 'Client', value: 'Kapoor family' },
          { label: 'Contractor', value: 'Invited' },
          { label: 'Site', value: 'Juhu Tara Rd' },
          { label: 'RERA', value: 'P518000…' },
        ].map((row) => (
          <div
            key={row.label}
            className="rounded-xl px-3 py-2.5"
            style={{ background: UI.bg, border: `1px solid ${UI.border}` }}
          >
            <p className="text-[10px]" style={{ color: UI.muted }}>
              {row.label}
            </p>
            <p className="text-[13px] font-medium mt-0.5" style={{ color: UI.text }}>
              {row.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Users className="h-4 w-4" style={{ color: UI.muted }} />
        <div className="flex -space-x-2">
          {team.map((initials) => (
            <span
              key={initials}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold"
              style={{ background: UI.bg, color: UI.text }}
            >
              {initials}
            </span>
          ))}
        </div>
        <span className="text-[12px]" style={{ color: UI.secondary }}>
          4 on the project
        </span>
      </div>
    </AppScreen>
  )
}

function DrawingsScreen() {
  const files = [
    { code: 'A-07', name: 'First floor plan', ver: 'v14', status: 'Current', active: true },
    { code: 'A-03', name: 'Sections', ver: 'v8', status: 'Issued', active: false },
    { code: 'S-02', name: 'Structural GA', ver: 'v3', status: 'Linked', active: false },
  ]

  return (
    <AppScreen title="Document vault">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px]" style={{ color: UI.secondary }}>
          12 files · Kapoor Villa
        </p>
        <span className="text-[11px] font-medium" style={{ color: UI.brand }}>
          + Upload
        </span>
      </div>
      <ul className="space-y-2">
        {files.map((f) => (
          <li
            key={f.code}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{
              background: f.active ? 'rgba(245,166,35,0.06)' : UI.bg,
              border: `1px solid ${f.active ? 'rgba(245,166,35,0.22)' : UI.border}`,
            }}
          >
            <FileText className="h-4 w-4 shrink-0" style={{ color: f.active ? '#b86a00' : UI.muted }} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium truncate" style={{ color: UI.text }}>
                {f.code} · {f.name}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: UI.muted }}>
                {f.ver} · Today 09:41
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: f.active ? 'rgba(245,166,35,0.14)' : 'rgba(0,0,0,0.04)',
                color: f.active ? '#b86a00' : UI.secondary,
              }}
            >
              {f.status}
            </span>
          </li>
        ))}
      </ul>
    </AppScreen>
  )
}

function RfiScreen() {
  const steps = [
    { label: 'Raised by contractor', done: true },
    { label: 'Answer from architect', done: true },
    { label: 'Drawing re-issued', done: true },
  ]

  return (
    <AppScreen title="RFI #061 · Stair landing">
      <div
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium mb-3"
        style={{ background: UI.bg, border: `1px solid ${UI.border}`, color: UI.secondary }}
      >
        <FileText className="h-3 w-3" />
        Linked to A-07 v14
      </div>

      <div className="rounded-xl p-3" style={{ background: UI.bg, border: `1px solid ${UI.border}` }}>
        <p className="text-[11px] font-medium" style={{ color: UI.muted }}>
          Question
        </p>
        <p className="text-[13px] mt-1 leading-relaxed" style={{ color: UI.text }}>
          Landing width at level 2 — confirm 1.05 m per NBC 4.3.2 or revise plan?
        </p>
      </div>

      <div className="rounded-xl p-3 mt-2" style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.18)' }}>
        <p className="text-[11px] font-medium" style={{ color: '#b86a00' }}>
          Answer · Priya N.
        </p>
        <p className="text-[13px] mt-1 leading-relaxed" style={{ color: UI.text }}>
          Revise to 1.10 m. Updated A-07 v14 issued — contractor notified.
        </p>
      </div>

      <ul className="mt-4 space-y-2">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[12px]" style={{ color: UI.secondary }}>
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: '#2ECC8A' }} />
            {s.label}
          </li>
        ))}
      </ul>
    </AppScreen>
  )
}

function ClientScreen() {
  const items = [
    { label: 'Tile sample — master bath', state: 'Awaiting approval' },
    { label: 'Weekly site photos', state: 'Viewed' },
    { label: 'Phase: Construction docs', state: '68% complete' },
  ]

  return (
    <AppScreen title="Client portal">
      <p className="text-[15px] font-semibold leading-snug" style={{ color: UI.text }}>
        Your home is in design development.
      </p>
      <p className="text-[13px] mt-2 leading-relaxed" style={{ color: UI.secondary }}>
        Staircase width was updated this week. Two items need your sign-off before we issue tender drawings.
      </p>

      <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: UI.bg }}>
        <div className="h-full w-[68%] rounded-full" style={{ background: UI.brand }} />
      </div>
      <p className="text-[11px] mt-1.5" style={{ color: UI.muted }}>
        68% through current phase
      </p>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
            style={{ background: UI.bg, border: `1px solid ${UI.border}` }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Circle className="h-3 w-3 shrink-0" style={{ color: UI.muted }} />
              <span className="text-[12px] truncate" style={{ color: UI.text }}>
                {item.label}
              </span>
            </div>
            <span className="text-[11px] shrink-0" style={{ color: UI.muted }}>
              {item.state}
            </span>
          </li>
        ))}
      </ul>
    </AppScreen>
  )
}

function StepPreview({ step, compact = false }: { step: Step; compact?: boolean }) {
  const Screen = step.Screen
  return (
    <div className={compact ? 'lp-flow-mockup-compact' : undefined}>
      <Screen />
    </div>
  )
}

function FlowStep({
  step,
  index,
  active,
  onActivate,
  observeMargin,
}: {
  step: Step
  index: number
  active: boolean
  onActivate: () => void
  observeMargin: UseInViewOptions['margin']
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: observeMargin })

  useEffect(() => {
    if (inView) onActivate()
  }, [inView, onActivate])

  return (
    <div
      ref={ref}
      className="relative flex flex-col justify-center py-8 sm:py-14 lg:py-16 min-h-[calc(100dvh-280px)] sm:min-h-[68dvh] lg:min-h-[62vh] lg:pl-10"
      data-flow-step={index}
    >
      <motion.span
        className="absolute left-0 top-1/2 hidden lg:block h-2 w-2 -translate-x-[5px] -translate-y-1/2 rounded-full"
        animate={{
          scale: active ? 1.15 : 0.85,
          backgroundColor: active ? 'var(--lp-brand)' : '#d2d2d7',
        }}
        transition={{ duration: 0.4 }}
        aria-hidden
      />

      <motion.span
        className="absolute left-0 top-8 lg:hidden h-1.5 w-1.5 rounded-full"
        animate={{
          scale: active ? 1.2 : 0.9,
          backgroundColor: active ? 'var(--lp-brand)' : '#d2d2d7',
        }}
        transition={{ duration: 0.4 }}
        aria-hidden
      />

      <motion.div
        initial={false}
        animate={{ opacity: active ? 1 : 0.2, y: active ? 0 : 10 }}
        transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <p className="text-[12px] sm:text-[13px] font-medium" style={{ color: active ? UI.text : UI.muted }}>
          {step.phase}
        </p>
        <h3
          className="mt-2 text-[clamp(1.375rem,5.5vw,2.125rem)] font-semibold tracking-tight leading-tight max-w-md"
          style={{ color: UI.text }}
        >
          {step.title}
        </h3>
        <p className="mt-2.5 sm:mt-3 text-[15px] sm:text-[17px] leading-relaxed max-w-md" style={{ color: UI.secondary }}>
          {step.body}
        </p>
        <ul className="mt-4 sm:mt-5 space-y-1.5 sm:space-y-2 max-w-md">
          {step.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-[13px] sm:text-[14px]" style={{ color: UI.secondary }}>
              <span
                className="mt-[7px] h-1 w-1 shrink-0 rounded-full"
                style={{ background: active ? 'var(--lp-brand)' : '#c7c7cc' }}
              />
              {b}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}

function FlowProgress({ activeIndex, compact = false }: { activeIndex: number; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 ${compact ? 'justify-center' : ''}`}>
      {STEPS.map((s, i) => (
        <div
          key={s.id}
          className="h-1 rounded-full transition-all duration-500"
          style={{
            width: i === activeIndex ? (compact ? 22 : 28) : 6,
            background: i <= activeIndex ? 'var(--lp-brand)' : '#d2d2d7',
          }}
        />
      ))}
      {!compact && (
        <span className="ml-2 text-[12px]" style={{ color: UI.muted }}>
          Scroll
        </span>
      )}
    </div>
  )
}

function StickyPreview({
  step,
  activeIndex,
  compact = false,
}: {
  step: Step
  activeIndex: number
  compact?: boolean
}) {
  return (
    <div className={compact ? '' : 'sticky top-28'}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: compact ? 16 : 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: compact ? -12 : -20 }}
          transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <StepPreview step={step} compact={compact} />
          <div className={compact ? 'mt-3' : 'mt-5'}>
            <FlowProgress activeIndex={activeIndex} compact={compact} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setMatches(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [query])

  return matches
}

export function HowItWorksFlow() {
  const [active, setActive] = useState(0)
  const headerRef = useRef<HTMLDivElement>(null)
  const mobilePreviewRef = useRef<HTMLDivElement>(null)
  const [mobilePreviewH, setMobilePreviewH] = useState(260)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })
  const isMobileFlow = useMediaQuery('(max-width: 1023px)')

  useEffect(() => {
    if (!isMobileFlow || !mobilePreviewRef.current) return
    const el = mobilePreviewRef.current
    const ro = new ResizeObserver(() => setMobilePreviewH(el.offsetHeight))
    ro.observe(el)
    setMobilePreviewH(el.offsetHeight)
    return () => ro.disconnect()
  }, [isMobileFlow, active])

  const observeMargin: UseInViewOptions['margin'] = isMobileFlow
    ? (`-${Math.max(mobilePreviewH + 8, 200)}px 0px -36% 0px` as UseInViewOptions['margin'])
    : '-40% 0px -40% 0px'

  return (
    <section id="flow" className="py-14 sm:py-20 lg:py-28 scroll-mt-16" style={{ background: '#fff' }}>
      <div className="mx-auto max-w-[980px] px-5 sm:px-6">
        <motion.div
          ref={headerRef}
          className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 lg:mb-14"
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <p className="lp-eyebrow">How it works</p>
          <h2 className="lp-section-title mt-2 sm:mt-3">From brief to client sign-off.</h2>
          <p className="lp-subhead mt-2 sm:mt-3 text-[1.0625rem] sm:text-[inherit]">
            Four phases you already run — now in one workspace.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-14 xl:gap-20">
          <div className="relative">
            {/* Sticky mockup on mobile — stays pinned while step copy scrolls (same as desktop) */}
            <div
              ref={mobilePreviewRef}
              className="lg:hidden sticky top-[3.25rem] z-20 lp-flow-sticky-preview mb-3 sm:mb-4"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="mb-2 text-[11px] font-medium text-center" style={{ color: UI.muted }}>
                {STEPS[active].phase}
              </p>
              <StickyPreview step={STEPS[active]} activeIndex={active} compact />
            </div>

            <div
              className="absolute left-0 top-0 bottom-0 w-px hidden lg:block"
              style={{ background: '#d2d2d7' }}
              aria-hidden
            />
            {STEPS.map((step, index) => (
              <FlowStep
                key={step.id}
                step={step}
                index={index}
                active={active === index}
                onActivate={() => setActive(index)}
                observeMargin={observeMargin}
              />
            ))}
          </div>

          <div className="hidden lg:block">
            <StickyPreview step={STEPS[active]} activeIndex={active} />
          </div>
        </div>
      </div>
    </section>
  )
}
