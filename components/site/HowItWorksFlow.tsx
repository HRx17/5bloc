'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderPlus,
  Upload,
  MessageSquare,
  Eye,
  ArrowRight,
  Check,
} from 'lucide-react'

const STEPS = [
  {
    id: 'project',
    icon: FolderPlus,
    label: 'Step 1',
    title: 'Create your project',
    body: 'Add the client, site, and team. Everyone gets the right access — architect, contractor, consultant, client.',
    visual: {
      title: 'Shah Residence · Mumbai',
      lines: [
        { label: 'Architect', value: 'You', color: 'var(--amber)' },
        { label: 'Contractor', value: 'Invited', color: 'var(--blue)' },
        { label: 'Client', value: 'Portal access', color: 'var(--success)' },
      ],
    },
  },
  {
    id: 'drawings',
    icon: Upload,
    label: 'Step 2',
    title: 'Upload drawings',
    body: 'Store plans and specs in one vault. Every version is saved — no more hunting for "final_v3_FINAL.dwg".',
    visual: {
      title: 'Document vault',
      lines: [
        { label: 'A-07 Floor plan', value: 'v14 · today', color: 'var(--amber)' },
        { label: 'A-07 Floor plan', value: 'v13 · archived', color: 'var(--stone)' },
        { label: 'Structural set', value: 'v6 · linked', color: 'var(--blue)' },
      ],
    },
  },
  {
    id: 'collaborate',
    icon: MessageSquare,
    label: 'Step 3',
    title: 'Run the project together',
    body: 'RFIs, submittals, and approvals stay on the drawing they refer to — not lost in group chats or email.',
    visual: {
      title: 'RFI #061 · Stair landing width',
      lines: [
        { label: 'Linked to', value: 'Drawing A-07 v14', color: 'var(--blue)' },
        { label: 'Status', value: 'Answered', color: 'var(--success)' },
        { label: 'Contractor', value: 'Notified', color: 'var(--stone)' },
      ],
    },
  },
  {
    id: 'client',
    icon: Eye,
    label: 'Step 4',
    title: 'Client stays in the loop',
    body: 'They open a simple portal to see progress, approve samples, and check payments — without calling you every evening.',
    visual: {
      title: 'Client portal',
      lines: [
        { label: 'Phase', value: 'Construction docs', color: 'var(--amber)' },
        { label: 'Pending', value: '2 approvals', color: 'var(--blue)' },
        { label: 'Updates', value: 'Plain English', color: 'var(--success)' },
      ],
    },
  },
] as const

const STEP_MS = 4500

export function HowItWorksFlow() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const goNext = useCallback(() => {
    setActive((i) => (i + 1) % STEPS.length)
  }, [])

  useEffect(() => {
    if (paused) return
    const t = setInterval(goNext, STEP_MS)
    return () => clearInterval(t)
  }, [paused, goNext, active])

  const step = STEPS[active]
  const Icon = step.icon

  return (
    <section id="flow" className="py-16 sm:py-24 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(56,130,255,0.08) 0%, transparent 65%)' }}
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="metadata-caps" style={{ color: 'var(--amber)' }}>
            How it works
          </span>
          <h2
            className="mt-4 font-brand text-[32px] sm:text-[42px] tracking-tight leading-[1.1]"
            style={{ color: 'var(--on-surface)' }}
          >
            From messy chats to one clear workspace
          </h2>
          <p className="mt-3 text-[15px] sm:text-[16px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
            Four steps. Same project, same team — just organised.
          </p>
        </div>

        <div
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10 items-stretch"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Step picker */}
          <div className="flex flex-col gap-2">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon
              const isActive = i === active
              return (
                <motion.button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className="text-left rounded-2xl px-4 py-4 sm:px-5 sm:py-5 transition-colors"
                  style={{
                    background: isActive ? 'var(--surface-container)' : 'transparent',
                    boxShadow: isActive
                      ? 'inset 0 0 0 1px rgba(245,166,35,0.22), var(--shadow-2)'
                      : 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                  }}
                  whileHover={{ x: isActive ? 0 : 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: isActive ? 'rgba(245,166,35,0.12)' : 'var(--surface-container-low)',
                        color: isActive ? 'var(--amber)' : 'var(--stone)',
                      }}
                    >
                      <StepIcon className="h-[18px] w-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--stone)' }}>
                          {s.label}
                        </span>
                        {isActive && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider"
                            style={{ color: 'var(--amber)' }}
                          >
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--amber)] animate-pulse" />
                            Live
                          </motion.span>
                        )}
                      </div>
                      <p className="font-brand text-[15px] sm:text-[16px] mt-0.5" style={{ color: isActive ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>
                        {s.title}
                      </p>
                      <AnimatePresence mode="wait">
                        {isActive && (
                          <motion.p
                            key={s.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="mt-2 text-[13px] leading-relaxed overflow-hidden"
                            style={{ color: 'var(--stone)' }}
                          >
                            {s.body}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {isActive && (
                    <motion.div
                      className="mt-4 h-0.5 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        key={`progress-${active}-${paused}`}
                        className="h-full rounded-full"
                        style={{ background: 'var(--amber)' }}
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: paused ? 0 : STEP_MS / 1000, ease: 'linear' }}
                      />
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Animated preview panel */}
          <div
            className="relative rounded-2xl overflow-hidden min-h-[280px] sm:min-h-[340px]"
            style={{
              background: 'var(--surface-container)',
              boxShadow: 'var(--glow-amber), var(--shadow-4)',
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-10 flex items-center gap-2 px-4"
              style={{ background: 'var(--surface-container-low)', boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.05)' }}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(255,100,100,0.5)' }} />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(245,166,35,0.5)' }} />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(46,204,138,0.5)' }} />
              <span className="ml-2 font-mono text-[10px] tracking-wider" style={{ color: 'var(--stone)' }}>
                5Bloc workspace
              </span>
            </div>

            <div className="pt-10 p-5 sm:p-6 h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 24, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -24, filter: 'blur(6px)' }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="h-11 w-11 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--amber)' }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--stone)' }}>
                        {step.label}
                      </p>
                      <p className="font-brand text-[17px]" style={{ color: 'var(--on-surface)' }}>
                        {step.visual.title}
                      </p>
                    </div>
                  </div>

                  <div
                    className="rounded-xl p-4 flex-1 space-y-3"
                    style={{ background: 'var(--surface-recessed)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)' }}
                  >
                    {step.visual.lines.map((line, li) => (
                      <motion.div
                        key={`${step.id}-${line.label}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 * li, duration: 0.35 }}
                        className="flex items-center justify-between gap-3 py-2"
                        style={{ boxShadow: li < step.visual.lines.length - 1 ? 'inset 0 -1px 0 rgba(255,255,255,0.04)' : undefined }}
                      >
                        <span className="text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
                          {line.label}
                        </span>
                        <span className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: line.color }}>
                          {li === 0 && step.id === 'collaborate' && <Check className="h-3.5 w-3.5" />}
                          {line.value}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Flow arrows between steps — decorative */}
                  <div className="mt-4 flex items-center justify-center gap-1.5">
                    {STEPS.map((_, i) => (
                      <motion.div
                        key={i}
                        className="h-1 rounded-full"
                        animate={{
                          width: i === active ? 20 : 6,
                          opacity: i === active ? 1 : 0.35,
                        }}
                        style={{ background: i <= active ? 'var(--amber)' : 'var(--stone)' }}
                        transition={{ duration: 0.3 }}
                      />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#prototype" className="btn-primary">
            Try the live demo <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#waitlist"
            className="text-[13.5px] font-semibold transition-colors"
            style={{ color: 'var(--stone)' }}
          >
            Join the waitlist
          </a>
        </div>
      </div>
    </section>
  )
}
