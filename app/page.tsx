'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Layers,
  MessagesSquare,
  Sparkles,
  FileText,
  Compass,
  HardHat,
  UserRound,
  Wrench,
  Package,
  Menu,
  X,
  Shield,
  Network,
  ChevronDown,
} from 'lucide-react'
import { WaitlistForm } from '@/components/site/WaitlistForm'
import { InteractivePrototype } from '@/components/site/InteractivePrototype'
import { HowItWorksFlow } from '@/components/site/HowItWorksFlow'

/* ────────────────────────────────────────
   Animation helpers
──────────────────────────────────────── */
function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 22, filter: 'blur(4px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

/* ────────────────────────────────────────
   Logo
──────────────────────────────────────── */
function LogoMark({ size = 26 }: { size?: number }) {
  const a = 'var(--amber)'
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="6" y="6"  width="28" height="5.5" rx="1.5" fill={a} />
      <rect x="6" y="15" width="22" height="5.5" rx="1.5" fill={a} opacity="0.72" />
      <rect x="6" y="24" width="16" height="5.5" rx="1.5" fill={a} opacity="0.44" />
      <rect x="6" y="33" width="10" height="4.5" rx="1.5" fill={a} opacity="0.22" />
    </svg>
  )
}

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 select-none">
      <LogoMark size={26} />
      <span
        className="font-body text-[17px] font-semibold tracking-wide"
        style={{ color: 'var(--on-surface)' }}
      >
        5BLOC
      </span>
    </Link>
  )
}

/* ────────────────────────────────────────
   Site Header
──────────────────────────────────────── */
function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const nav = [
    { href: '#flow',      label: 'How it works' },
    { href: '#prototype', label: 'Live demo' },
    { href: '#features',  label: 'Features' },
    { href: '#faq',       label: 'FAQ' },
  ]

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(8,8,16,0.82)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px) saturate(160%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(160%)' : 'none',
        boxShadow: scrolled ? '0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Wordmark />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="transition-colors duration-150"
              style={{ color: scrolled ? 'var(--on-surface-variant)' : 'var(--stone)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--on-surface)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = scrolled ? 'var(--on-surface-variant)' : 'var(--stone)')}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          <a
            href="#architect-waitlist"
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-all"
            style={{
              background: 'rgba(245,166,35,0.10)',
              color: 'var(--amber)',
              boxShadow: 'inset 0 0 0 1px rgba(245,166,35,0.35)',
            }}
          >
            <Compass className="h-3.5 w-3.5" />
            Architects (free)
          </a>
          <Link
            href="/list-your-business"
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-all"
            style={{
              background: 'rgba(122,184,255,0.10)',
              color: 'var(--blue)',
              boxShadow: 'inset 0 0 0 1px rgba(122,184,255,0.35)',
            }}
          >
            <HardHat className="h-3.5 w-3.5" />
            Contractors (free)
          </Link>
          <Link
            href="/join-as-vendor"
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-all"
            style={{
              background: 'rgba(167,139,250,0.10)',
              color: 'var(--purple)',
              boxShadow: 'inset 0 0 0 1px rgba(167,139,250,0.35)',
            }}
          >
            <Package className="h-3.5 w-3.5" />
            Vendors (free)
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          style={{ background: 'var(--surface-container-low)', boxShadow: 'var(--shadow-3)' }}
        >
          <div className="mx-auto max-w-7xl px-5 py-5">
            <nav className="grid gap-1">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-[14px] font-medium transition-all"
                  style={{ color: 'var(--on-surface-variant)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-container)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="ghost-cut my-4" />
            <div className="flex flex-col gap-3">
              <a
                href="#architect-waitlist"
                onClick={() => setOpen(false)}
                className="w-full text-center inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[13.5px] font-semibold"
                style={{
                  background: 'rgba(245,166,35,0.12)',
                  color: 'var(--amber)',
                  boxShadow: 'inset 0 0 0 1px rgba(245,166,35,0.35)',
                }}
              >
                <Compass className="h-4 w-4" />
                Architects — join waitlist (free)
              </a>
              <Link
                href="/list-your-business"
                onClick={() => setOpen(false)}
                className="w-full text-center inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[13.5px] font-semibold"
                style={{
                  background: 'rgba(122,184,255,0.12)',
                  color: 'var(--blue)',
                  boxShadow: 'inset 0 0 0 1px rgba(122,184,255,0.35)',
                }}
              >
                <HardHat className="h-4 w-4" />
                Contractors — join waitlist (free)
              </Link>
              <Link
                href="/join-as-vendor"
                onClick={() => setOpen(false)}
                className="w-full text-center inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[13.5px] font-semibold"
                style={{
                  background: 'rgba(167,139,250,0.12)',
                  color: 'var(--purple)',
                  boxShadow: 'inset 0 0 0 1px rgba(167,139,250,0.35)',
                }}
              >
                <Package className="h-4 w-4" />
                Vendors — join waitlist (free)
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  )
}

/* ────────────────────────────────────────
   Sticky waitlist bar
──────────────────────────────────────── */
function StickyBar() {
  const [visible, setVisible] = useState(false)
  const [atCta, setAtCta] = useState(false)
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY
      const waitlistEl = document.getElementById('waitlist')
      if (waitlistEl) {
        const rect = waitlistEl.getBoundingClientRect()
        setAtCta(rect.top < window.innerHeight)
      }
      setVisible(scrollY > 500)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible || atCta) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || done) return
    setBusy(true)
    try {
      const { createSupabaseClient } = await import('@/lib/supabase/client')
      const supabase = createSupabaseClient()
      await supabase.from('waitlist').insert({ email: email.trim().toLowerCase(), role: 'unknown' })
      setDone(true)
    } catch {
      setDone(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(10,10,18,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -1px 0 rgba(255,255,255,0.07), 0 -8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div className="mx-auto max-w-3xl px-5 py-3 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <p className="text-[13px] font-medium hidden sm:block shrink-0" style={{ color: 'var(--on-surface-variant)' }}>
          Get early access — <span style={{ color: 'var(--amber)' }}>10 practices onboarded per week</span>
        </p>
        {done ? (
          <p className="text-[13px] font-semibold w-full sm:w-auto text-center" style={{ color: '#2ECC8A' }}>
            ✓ You&apos;re on the list!
          </p>
        ) : (
          <form onSubmit={submit} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 flex-1 sm:w-56 rounded-lg px-3 text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.07)',
                color: 'var(--on-surface)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10)',
              }}
            />
            <button
              type="submit"
              disabled={busy}
              className="btn-primary h-9 px-5 text-[13px] shrink-0"
              style={{ padding: '0 18px' }}
            >
              {busy ? '…' : 'Join waitlist'}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  )
}

/* ────────────────────────────────────────
   Hero
──────────────────────────────────────── */
function Hero() {
  const roles = [
    { icon: Compass,  label: 'Architects',   color: 'var(--amber)' },
    { icon: HardHat,  label: 'Contractors',  color: 'var(--blue)' },
    { icon: Package,  label: 'Vendors',      color: 'var(--purple)' },
    { icon: UserRound, label: 'Clients',     color: 'var(--success)' },
  ]

  return (
    <section className="relative overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-16">
      {/* Background — same atmosphere, less height */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '80%',
          background: 'radial-gradient(ellipse 100% 70% at 50% 110%, rgba(102,51,238,0.28) 0%, rgba(71,36,180,0.14) 35%, transparent 65%)',
        }}
        aria-hidden
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%', right: '-8%', width: '65%', height: '70%',
          background: 'radial-gradient(ellipse at top right, rgba(56,130,255,0.26) 0%, rgba(30,80,220,0.14) 40%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 font-mono text-[10.5px] uppercase tracking-[0.18em]"
          style={{
            background: 'rgba(245,166,35,0.08)',
            color: 'var(--amber)',
            boxShadow: 'inset 0 0 0 1px rgba(245,166,35,0.18)',
          }}
        >
          <Sparkles className="h-3 w-3" />
          Architects · contractors · vendors · clients
        </motion.div>

        <motion.h1
          className="font-brand tracking-tight leading-[1.06]"
          style={{ fontSize: 'clamp(34px, 6vw, 60px)', color: 'var(--on-surface)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
        >
          Everyone on the project,{' '}
          <span className="font-editorial font-normal italic" style={{ color: 'var(--amber)' }}>
            one workspace
          </span>
        </motion.h1>

        <motion.p
          className="mt-5 mx-auto max-w-2xl text-[17px] sm:text-[18px] leading-relaxed"
          style={{ color: 'var(--on-surface-variant)' }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.14 }}
        >
          Whether you design, build, supply, or own the project — 5Bloc keeps drawings, RFIs,
          approvals, and updates in one place instead of WhatsApp and email.
        </motion.p>

        <motion.div
          className="mt-7 flex flex-wrap items-center justify-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.22 }}
        >
          {roles.map((r) => (
            <span
              key={r.label}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--on-surface-variant)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)',
              }}
            >
              <r.icon className="h-3.5 w-3.5" style={{ color: r.color }} />
              {r.label}
            </span>
          ))}
        </motion.div>

        {/* Waitlist CTAs — free for all */}
        <motion.div
          className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto text-left"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.26 }}
        >
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <a
              href="#architect-waitlist"
              className="group flex items-start gap-3 rounded-2xl p-4 h-full transition-all"
              style={{
                background: 'rgba(245,166,35,0.08)',
                boxShadow: 'inset 0 0 0 1.5px rgba(245,166,35,0.35), 0 8px 32px rgba(245,166,35,0.08)',
              }}
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--amber)' }}
              >
                <Compass className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--amber)' }}>
                  Free for architects
                </p>
                <p className="font-brand text-[15px] mt-0.5" style={{ color: 'var(--on-surface)' }}>
                  Join the architect waitlist
                </p>
                <p className="text-[12px] mt-1 flex items-center gap-1 font-semibold" style={{ color: 'var(--amber)' }}>
                  Run projects in one place
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </p>
              </div>
            </a>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <Link
              href="/list-your-business"
              className="group flex items-start gap-3 rounded-2xl p-4 h-full transition-all"
              style={{
                background: 'rgba(122,184,255,0.08)',
                boxShadow: 'inset 0 0 0 1.5px rgba(122,184,255,0.35), 0 8px 32px rgba(56,130,255,0.08)',
              }}
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(122,184,255,0.15)', color: 'var(--blue)' }}
              >
                <HardHat className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--blue)' }}>
                  Free for contractors
                </p>
                <p className="font-brand text-[15px] mt-0.5" style={{ color: 'var(--on-surface)' }}>
                  Join the contractor waitlist
                </p>
                <p className="text-[12px] mt-1 flex items-center gap-1 font-semibold" style={{ color: 'var(--blue)' }}>
                  Get listed & win projects
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </p>
              </div>
            </Link>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <Link
              href="/join-as-vendor"
              className="group flex items-start gap-3 rounded-2xl p-4 h-full transition-all"
              style={{
                background: 'rgba(167,139,250,0.08)',
                boxShadow: 'inset 0 0 0 1.5px rgba(167,139,250,0.35), 0 8px 32px rgba(167,139,250,0.08)',
              }}
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(167,139,250,0.15)', color: 'var(--purple)' }}
              >
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--purple)' }}>
                  Free for vendors
                </p>
                <p className="font-brand text-[15px] mt-0.5" style={{ color: 'var(--on-surface)' }}>
                  Join the vendor waitlist
                </p>
                <p className="text-[12px] mt-1 flex items-center gap-1 font-semibold" style={{ color: 'var(--purple)' }}>
                  List your catalogue & RFQs
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </p>
              </div>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          id="architect-waitlist"
          className="mt-8 max-w-md mx-auto scroll-mt-28"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.32 }}
        >
          <p className="text-[11px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--amber)' }}>
            Free for architects & design studios
          </p>
          <WaitlistForm compact source="hero" />
        </motion.div>

        <motion.div
          className="mt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.65, delay: 0.38 }}
        >
          <a
            href="#flow"
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold transition-colors"
            style={{ color: 'var(--stone)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--on-surface)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--stone)')}
          >
            See how it works <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────
   Pain → Solution strip
──────────────────────────────────────── */
function PainStrip() {
  const items = [
    { problem: '14 group chats per project', solution: 'One project workspace' },
    { problem: 'Drawings lost in email', solution: 'Version history on every file' },
    { problem: 'Clients call every evening', solution: 'Portal they check themselves' },
  ]
  return (
    <section style={{ background: 'rgba(255,255,255,0.022)' }} className="py-10 sm:py-12">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <p className="text-center text-[13px] mb-6" style={{ color: 'var(--stone)' }}>
          Today most projects run on chats and spreadsheets. 5Bloc fixes that.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {items.map((item, i) => (
            <FadeUp key={item.problem} delay={0.05 * i}>
              <div
                className="rounded-xl px-4 py-3.5 text-center"
                style={{ background: 'var(--surface-container)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)' }}
              >
                <p className="text-[12px] line-through" style={{ color: 'rgba(255,120,120,0.75)' }}>
                  {item.problem}
                </p>
                <p className="mt-1.5 text-[14px] font-semibold flex items-center justify-center gap-1.5" style={{ color: 'var(--amber)' }}>
                  <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                  {item.solution}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────
   Prototype section
──────────────────────────────────────── */
function PrototypeSection() {
  return (
    <section id="prototype" className="relative py-16 sm:py-24" style={{ background: 'var(--surface-canvas)' }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeUp>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="metadata-caps" style={{ color: 'var(--amber)' }}>
              Live demo · no signup
            </span>
            <h2
              className="mt-4 font-brand text-[32px] sm:text-[40px] tracking-tight leading-[1.1]"
              style={{ color: 'var(--on-surface)' }}
            >
              Click around a real project
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
              Browse drawings, reply to an RFI, run an AI estimate, or approve a sample as the client.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div
            className="relative rounded-2xl p-2 sm:p-3"
            style={{
              background: 'var(--surface-container)',
              boxShadow: 'var(--glow-amber), var(--shadow-4)',
            }}
          >
            <div
              className="relative rounded-xl overflow-hidden"
              style={{ background: 'var(--surface-recessed)' }}
            >
              <InteractivePrototype />
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────
   Features — everything in one place
──────────────────────────────────────── */
function FeaturesSection() {
  const items = [
    { icon: Layers,         title: 'Document vault',      body: 'Drawings and specs with version history on every file.' },
    { icon: MessagesSquare, title: 'RFIs & submittals',   body: 'Questions stay on the drawing — not in email chains.' },
    { icon: Sparkles,       title: 'AI cost estimator',   body: 'Estimate BOQ lines from your DPR in seconds.' },
    { icon: FileText,       title: 'Client portal',       body: 'Clients see progress in plain English. No app to install.' },
    { icon: Shield,         title: 'Permits & RERA',      body: 'Compliance tracked in the project, not buried in email.' },
    { icon: Network,        title: 'Trusted network',     body: 'Invite contractors and consultants. Ratings follow them.' },
  ]

  return (
    <section id="features" className="py-16 sm:py-24 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.018)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 10% 50%, rgba(245,166,35,0.05) 0%, transparent 65%)' }} aria-hidden />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeUp className="text-center max-w-2xl mx-auto mb-10">
          <span className="metadata-caps" style={{ color: 'var(--amber)' }}>What you get</span>
          <h2
            className="mt-4 font-brand text-[32px] sm:text-[40px] tracking-tight leading-[1.1]"
            style={{ color: 'var(--on-surface)' }}
          >
            Everything your office needs
          </h2>
          <p className="mt-3 text-[15px]" style={{ color: 'var(--on-surface-variant)' }}>
            One workspace instead of five different tools.
          </p>
        </FadeUp>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <FadeUp key={item.title} delay={0.04 * i}>
              <motion.div className="card-5bloc h-full" whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--surface-elevated)', color: 'var(--amber)' }}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                </div>
                <p className="font-brand text-[16px]" style={{ color: 'var(--on-surface)' }}>{item.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>{item.body}</p>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────
   Roles Grid
──────────────────────────────────────── */
function RolesGrid() {
  const list = [
    { icon: Compass,   title: 'Architect',  tagline: 'Runs the project',  price: 'Free',  accentVar: '--amber',  href: '#architect-waitlist', cta: 'Join waitlist →' },
    { icon: HardHat,   title: 'Contractor', tagline: 'Site & submittals', price: 'Free',  accentVar: '--blue',   href: '/list-your-business', cta: 'Join waitlist →' },
    { icon: Package,   title: 'Vendor',     tagline: 'Materials & RFQs',  price: 'Free',  accentVar: '--purple', href: '/join-as-vendor',     cta: 'Join waitlist →' },
    { icon: Wrench,    title: 'Consultant', tagline: 'Reviews & RFIs',    price: 'Free',  accentVar: '--blue',   href: '#waitlist',       cta: 'Join waitlist' },
    { icon: UserRound, title: 'Client',     tagline: 'Tracks progress',   price: 'Free',  accentVar: '--success', href: '#waitlist',       cta: 'Join waitlist' },
  ]

  return (
    <section id="roles" className="py-14 sm:py-20 relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <FadeUp className="text-center mb-8">
          <h2 className="font-brand text-[28px] sm:text-[34px] tracking-tight" style={{ color: 'var(--on-surface)' }}>
            Built for every role on the project
          </h2>
          <p className="mt-2 text-[14px]" style={{ color: 'var(--on-surface-variant)' }}>
            Listing is free for architects, contractors, and vendors. Join the waitlist for your role below.
          </p>
        </FadeUp>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {list.map((r, i) => {
            const accent = `var(${r.accentVar})`
            const isPartner = r.title === 'Architect' || r.title === 'Contractor' || r.title === 'Vendor'
            return (
              <FadeUp key={r.title} delay={0.05 * i}>
                <Link
                  href={r.href}
                  className="card-5bloc text-center py-5 px-3 block h-full transition-all hover:-translate-y-0.5"
                  style={isPartner ? { boxShadow: `inset 0 0 0 1px ${accent}33` } : undefined}
                >
                  <r.icon className="h-5 w-5 mx-auto mb-3" style={{ color: accent }} />
                  <p className="font-brand text-[15px]" style={{ color: 'var(--on-surface)' }}>{r.title}</p>
                  <p className="mt-1 text-[12px]" style={{ color: 'var(--stone)' }}>{r.tagline}</p>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-widest" style={{ color: accent }}>{r.price}</p>
                  <p className="mt-3 text-[11.5px] font-semibold" style={{ color: accent }}>{r.cta}</p>
                </Link>
              </FadeUp>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────
   FAQ
──────────────────────────────────────── */
function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  const faqs = [
    { q: 'What is 5Bloc?', a: 'One workspace for everyone on a build project — architects, contractors, vendors, consultants, and clients. Drawings, RFIs, and updates live in one place instead of WhatsApp and email.' },
    { q: 'Is it free to join?', a: 'Yes. Listing on the waitlist is free for architects, contractors, and vendors. Early architect members also get their first three projects free at launch.' },
    { q: 'Who pays later?', a: 'After launch, the architect\'s practice carries the workspace subscription. Contractors, vendors, consultants, and clients stay free on projects they\'re invited to.' },
    { q: 'I\'m a contractor or vendor — how do I join?', a: 'Click the contractor or vendor card at the top of the page. Listing is free — we\'ll email you when onboarding opens in your city.' },
    { q: 'When can I start?', a: 'We onboard a small batch of practices each week. Join the waitlist and we\'ll email you when your slot opens.' },
    { q: 'Do I need to move old projects?', a: 'No. Start with one new project. Add older work later when you\'re ready.' },
    { q: 'How is this different from Procore?', a: '5Bloc is built for architect-led projects in India — lighter, faster to set up, and priced for smaller practices.' },
  ]

  return (
    <section id="faq" className="py-16 sm:py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 60% at 20% 50%, rgba(56,130,255,0.05) 0%, transparent 60%)' }} aria-hidden />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeUp className="text-center mb-8">
          <span className="metadata-caps" style={{ color: 'var(--amber)' }}>FAQ</span>
          <h2 className="mt-4 font-brand text-[28px] sm:text-[36px] tracking-tight" style={{ color: 'var(--on-surface)' }}>
            Common questions
          </h2>
        </FadeUp>

        <FadeUp delay={0.08}>
          <dl className="grid gap-2 max-w-2xl mx-auto">
              {faqs.map((f, i) => (
                <motion.div
                  key={f.q}
                  className="card-5bloc cursor-pointer"
                  style={{ padding: '18px 22px' }}
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <dt className="flex items-center justify-between gap-4">
                    <span className="font-brand text-[16px]" style={{ color: 'var(--on-surface)' }}>
                      {f.q}
                    </span>
                    <motion.span
                      animate={{ rotate: open === i ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                      style={{ color: 'var(--stone)' }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </dt>
                  <motion.dd
                    initial={false}
                    animate={{ height: open === i ? 'auto' : 0, opacity: open === i ? 1 : 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    <p className="pt-4 text-[14px] leading-relaxed">{f.a}</p>
                  </motion.dd>
                </motion.div>
              ))}
            </dl>
          </FadeUp>
          <p className="mt-8 text-center text-[13px]" style={{ color: 'var(--stone)' }}>
            More questions?{' '}
            <a href="mailto:contact@5bloc.com" className="underline underline-offset-2" style={{ color: 'var(--amber)' }}>
              contact@5bloc.com
            </a>
          </p>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────
   Waitlist CTA
──────────────────────────────────────── */
function WaitlistCTA() {
  return (
    <section
      id="waitlist"
      className="py-16 sm:py-24 relative overflow-hidden"
      style={{ background: 'transparent' }}
    >
      {/* Strong atmospheric glow for the CTA climax */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 80%, rgba(102,51,238,0.16) 0%, rgba(56,130,255,0.08) 40%, transparent 70%)' }} aria-hidden />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} aria-hidden />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeUp>
          <div
            className="relative overflow-hidden rounded-[2.5rem] p-px"
            style={{
              background: 'linear-gradient(135deg, rgba(245,166,35,0.25), rgba(122,184,255,0.12), rgba(245,166,35,0.08))',
            }}
          >
            <div
              className="relative rounded-[calc(2.5rem-1px)] px-6 py-14 sm:px-12 sm:py-16 overflow-hidden"
              style={{ background: 'var(--surface-container-lowest)' }}
            >
              {/* Ambient glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 20% 50%, rgba(245,166,35,0.06) 0%, transparent 60%)',
                }}
                aria-hidden
              />

              <div className="relative z-10 grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
                <div>
                  <span className="metadata-caps" style={{ color: 'var(--blue)' }}>
                    Private beta · invite-only
                  </span>
                  <h2
                    className="mt-4 font-brand leading-[1.08] tracking-tight"
                    style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: 'var(--on-surface)' }}
                  >
                    Join the waitlist
                  </h2>
                  <p className="mt-4 max-w-lg text-[15px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                    Free to join the waitlist. We onboard a small batch each week — early architects get their first three projects free.
                  </p>
                  <ul className="mt-6 grid gap-2.5">
                    {[
                      'Free listing for architects',
                      'Free for invited team members',
                      'Help moving off spreadsheets',
                    ].map((b) => (
                      <li key={b} className="flex items-center gap-3 text-[14.5px] font-medium" style={{ color: 'var(--on-surface)' }}>
                        <div
                          className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(245,166,35,0.15)' }}
                        >
                          <Check className="h-3 w-3" style={{ color: 'var(--amber)' }} />
                        </div>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className="rounded-2xl p-2"
                  style={{
                    background: 'var(--surface-elevated)',
                    boxShadow: 'var(--shadow-3)',
                  }}
                >
                  <WaitlistForm source="cta" />
                </div>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────
   Footer
──────────────────────────────────────── */
function SiteFooter() {
  const cols = [
    {
      title: 'Product',
      links: [
        { href: '#flow',      label: 'How it works' },
        { href: '#prototype', label: 'Live demo' },
        { href: '#features',  label: 'Features' },
        { href: '#architect-waitlist',  label: 'Architect waitlist (free)' },
        { href: '#waitlist',            label: 'Full signup form' },
      ],
    },
    {
      title: 'Company',
      links: [
        { href: '#architect-waitlist',  label: 'Architect waitlist (free)' },
        { href: '/list-your-business',    label: 'Contractor waitlist (free)' },
        { href: '/join-as-vendor',        label: 'Vendor waitlist (free)' },
        { href: 'mailto:contact@5bloc.com', label: 'Contact us' },
      ],
    },
  ]

  return (
    <footer style={{ background: 'rgba(255,255,255,0.025)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-sm text-[13.5px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
              One workspace for architects, contractors, vendors, and clients on every build project.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="label-sm mb-6" style={{ color: 'var(--stone)', opacity: 0.5 }}>
                {c.title}
              </div>
              <ul className="grid gap-4 text-[13.5px] font-medium">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="transition-colors duration-150"
                      style={{ color: 'var(--on-surface-variant)' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--on-surface)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--on-surface-variant)')}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-16 flex flex-col items-start justify-between gap-3 pt-8 text-[12px] sm:flex-row sm:items-center"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)', color: 'var(--stone)' }}
        >
          <div>© {new Date().getFullYear()} 5Bloc Technologies. All rights reserved.</div>
          <div className="label-sm opacity-40">v1.0 · India</div>
        </div>
      </div>
    </footer>
  )
}

/* ────────────────────────────────────────
   Page
──────────────────────────────────────── */
export default function Home() {
  // Release body overflow-hidden (set by the app shell layout) so
  // the landing page scrolls at the document level. window.scrollY
  // then works correctly for the header blur effect.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
    return () => {
      document.body.style.overflow = prev
      document.documentElement.style.overflow = ''
    }
  }, [])

  return (
    <div
      className="font-body"
      style={{
        background: '#080810',
        color: 'var(--on-surface)',
      }}
    >
      <SiteHeader />
      <StickyBar />
      <Hero />
      <HowItWorksFlow />
      <PainStrip />
      <PrototypeSection />
      <FeaturesSection />
      <RolesGrid />
      <FAQ />
      <WaitlistCTA />
      <SiteFooter />
    </div>
  )
}
