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
  Building2,
  UserRound,
  Wrench,
  Menu,
  X,
  Shield,
  Network,
  ChevronDown,
  Zap,
} from 'lucide-react'
import { WaitlistForm } from '@/components/site/WaitlistForm'
import { InteractivePrototype } from '@/components/site/InteractivePrototype'

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
        className="font-mono text-[17px] font-bold tracking-widest"
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
    { href: '#prototype', label: 'Demo' },
    { href: '#pillars',   label: 'Why 5Bloc' },
    { href: '#modules',   label: 'Modules' },
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

        <div className="hidden md:flex items-center gap-3">
          <a href="#waitlist" className="btn-primary text-[13px] px-5 py-2.5">
            Join waitlist
          </a>
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
                href="#waitlist"
                onClick={() => setOpen(false)}
                className="btn-primary w-full text-center"
              >
                Join waitlist
              </a>
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
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-24">
      {/* ── Atmospheric background layers (Stitch-inspired) ── */}

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden
      />

      {/* Large horizon glow — violet/indigo rising from below (main Stitch signature) */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '75%',
          background: 'radial-gradient(ellipse 100% 70% at 50% 110%, rgba(102,51,238,0.28) 0%, rgba(71,36,180,0.14) 35%, transparent 65%)',
        }}
        aria-hidden
      />

      {/* Blue/cyan accent — upper right (primary diffuse) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%',
          right: '-8%',
          width: '65%',
          height: '70%',
          background: 'radial-gradient(ellipse at top right, rgba(56,130,255,0.26) 0%, rgba(30,80,220,0.14) 40%, transparent 70%)',
        }}
        aria-hidden
      />

      {/* Blue — upper left counter-light */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '0%',
          left: '-5%',
          width: '45%',
          height: '55%',
          background: 'radial-gradient(ellipse at top left, rgba(80,160,255,0.13) 0%, rgba(40,100,220,0.06) 50%, transparent 75%)',
        }}
        aria-hidden
      />

      {/* Deep cyan mid-centre sweep */}
      <div
        className="absolute inset-x-0 pointer-events-none"
        style={{
          top: '20%',
          height: '40%',
          background: 'radial-gradient(ellipse 70% 50% at 60% 40%, rgba(0,160,255,0.07) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      {/* Amber ember — lower left brand anchor */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '5%',
          left: '-2%',
          width: '45%',
          height: '50%',
          background: 'radial-gradient(ellipse at bottom left, rgba(245,166,35,0.11) 0%, rgba(200,110,20,0.05) 45%, transparent 70%)',
        }}
        aria-hidden
      />

      {/* Subtle pink/magenta mid-left warmth */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '30%',
          left: '5%',
          width: '30%',
          height: '40%',
          background: 'radial-gradient(ellipse at center, rgba(180,60,180,0.07) 0%, transparent 65%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-10 font-mono text-[10.5px] uppercase tracking-[0.18em]"
          style={{
            background: 'rgba(245,166,35,0.08)',
            color: 'var(--amber)',
            boxShadow: 'inset 0 0 0 1px rgba(245,166,35,0.18)',
          }}
        >
          <Sparkles className="h-3 w-3" />
          Private beta · Now open for early practices
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="font-display font-bold tracking-tight leading-[1.04]"
          style={{
            fontSize: 'clamp(44px, 7.5vw, 82px)',
            color: 'var(--on-surface)',
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
        >
          Run your practice.{' '}
          <br className="hidden sm:block" />
          <span
            className="font-editorial font-normal italic"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            Not your group chats.
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          className="mt-7 mx-auto max-w-xl text-[18px] leading-relaxed"
          style={{ color: 'var(--on-surface-variant)' }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
        >
          5Bloc replaces WhatsApp, Excel and email with one workspace built for architects.
          Drawings, RFIs, invoices, and clients — all in one place.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.28 }}
        >
          <WaitlistForm compact source="hero" />
          <a
            href="#prototype"
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold transition-colors"
            style={{ color: 'var(--stone)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--on-surface)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--stone)')}
          >
            See it in action <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>

        {/* Stats */}
        <motion.dl
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
        >
          {[
            ['14+', 'WhatsApp groups per project on average'],
            ['122,769', 'Registered architects in India'],
            ['5–8', 'Disconnected tools per firm'],
          ].map(([n, l]) => (
            <div key={l} className="flex flex-col items-center">
              <div
                className="font-mono text-[30px] font-bold"
                style={{ color: 'var(--amber)' }}
              >
                {n}
              </div>
              <div
                className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em]"
                style={{ color: 'var(--stone)' }}
              >
                {l}
              </div>
            </div>
          ))}
        </motion.dl>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ color: 'var(--stone)' }}
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ────────────────────────────────────────
   Pain → Solution strip
──────────────────────────────────────── */
function PainStrip() {
  const items = [
    {
      before: '14 WhatsApp groups',
      beforeSub: 'per active project',
      after: 'One project workspace',
      afterSub: 'everyone in their role',
    },
    {
      before: 'final_v3_FINAL.dwg',
      beforeSub: 'in someone\'s email',
      after: 'Version history, always',
      afterSub: 'linked to the RFI that changed it',
    },
    {
      before: 'Client calls every evening',
      beforeSub: '"what\'s the status?"',
      after: 'Portal they open themselves',
      afterSub: 'plain English, no software',
    },
  ]
  return (
    <section style={{ background: 'rgba(255,255,255,0.022)' }} className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeUp>
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.22em] mb-10" style={{ color: 'var(--stone)' }}>
            Sound familiar?
          </p>
        </FadeUp>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item, i) => (
            <FadeUp key={item.before} delay={0.07 * i}>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--surface-container)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
              >
                {/* Before */}
                <div className="px-5 py-4" style={{ background: 'rgba(255,80,80,0.04)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,100,100,0.6)' }}>Before</span>
                  </div>
                  <p className="font-display font-bold text-[15px]" style={{ color: 'var(--on-surface)' }}>{item.before}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--stone)' }}>{item.beforeSub}</p>
                </div>
                {/* After */}
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(46,204,138,0.7)' }}>With 5Bloc</span>
                  </div>
                  <p className="font-display font-bold text-[15px]" style={{ color: 'var(--amber)' }}>{item.after}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--stone)' }}>{item.afterSub}</p>
                </div>
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
    <section id="prototype" className="relative py-28 sm:py-36" style={{ background: 'var(--surface-canvas)' }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeUp>
          <div className="flex flex-col md:flex-row items-end justify-between gap-10 mb-16">
            <div className="max-w-2xl">
              <span className="metadata-caps" style={{ color: 'var(--amber)' }}>
                ⚡ Try it · no signup required
              </span>
              <h2
                className="mt-5 font-display font-bold text-[42px] sm:text-[52px] tracking-tight leading-[1.08]"
                style={{ color: 'var(--on-surface)' }}
              >
                A working slice of 5Bloc.
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                Click between modules. Browse drawing versions, reply to an RFI,
                ask AI to estimate missing BOQ lines, approve a sample as the client.
              </p>
            </div>
            <a href="#waitlist" className="btn-ai-wash shrink-0">
              Like what you see? Join waitlist <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </FadeUp>

        <FadeUp delay={0.12}>
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
   Pillars
──────────────────────────────────────── */
function Pillars() {
  const items = [
    { icon: Layers,        title: 'Drawings with memory',     body: 'Every drawing has a version, an owner, an approver and a moment in time. Audit trail by default.' },
    { icon: MessagesSquare,title: 'Email out of the loop',    body: 'RFIs, submittals and approvals live in the project — not in 14 reply-all chains.' },
    { icon: Network,       title: 'Trust, ported',            body: 'Your trusted contractors and consultants move with you. Ratings accumulate across projects.' },
    { icon: Sparkles,      title: 'AI where it earns its keep',body: 'Estimate BOQ from a DPR. Summarise a 60-page bye-law. Not gimmicks — chores.' },
    { icon: Shield,        title: 'RERA-ready',               body: 'Compliance and reporting baked in for Indian projects. Stripe + Razorpay for billing.' },
    { icon: FileText,      title: 'One link for clients',     body: 'A read-only portal in plain English. No software to install. No jargon to learn.' },
  ]

  return (
    <section
      id="pillars"
      className="py-28 sm:py-36 relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.018)' }}
    >
      {/* Section atmosphere */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 90% 50%, rgba(56,130,255,0.06) 0%, transparent 60%)' }} aria-hidden />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-16 lg:grid-cols-[1fr_2fr] lg:items-start">
          <FadeUp>
            <span className="metadata-caps" style={{ color: 'var(--amber)' }}>Why 5Bloc</span>
            <h2
              className="mt-5 font-display font-bold text-[40px] sm:text-[50px] tracking-tight leading-[1.08]"
              style={{ color: 'var(--on-surface)' }}
            >
              Architecture deserves better than a group chat.
            </h2>
            <p className="mt-6 text-[16px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
              98% of Indian projects miss quality standards. Most run on WhatsApp,
              Excel and Gmail. 5Bloc gives every stakeholder one place to do their
              job — without learning new software.
            </p>
          </FadeUp>

          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((p, i) => (
              <FadeUp key={p.title} delay={0.06 * i}>
                <motion.div
                  className="card-5bloc h-full group"
                  whileHover={{ y: -3, transition: { duration: 0.22 } }}
                >
                  <div
                    className="h-11 w-11 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300"
                    style={{
                      background: 'var(--surface-elevated)',
                      color: 'var(--amber)',
                      boxShadow: 'var(--shadow-1)',
                    }}
                  >
                    <p.icon className="h-5 w-5" />
                  </div>
                  <div className="font-display font-bold text-[17px]" style={{ color: 'var(--on-surface)' }}>
                    {p.title}
                  </div>
                  <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                    {p.body}
                  </p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
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
    { icon: Compass,   title: 'Architect',   tagline: 'Run the office. Lead the design.',   price: 'Paid',  accentVar: '--amber' },
    { icon: HardHat,   title: 'Contractor',  tagline: 'Win work. Submit cleanly.',          price: 'Free',  accentVar: '--blue' },
    { icon: Building2, title: 'Builder',     tagline: 'All your projects. One feed.',       price: 'Free',  accentVar: '--blue' },
    { icon: Wrench,    title: 'Consultant',  tagline: 'Discipline-scoped collaboration.',   price: 'Free',  accentVar: '--blue' },
    { icon: UserRound, title: 'Client',      tagline: "Know what's happening.",             price: 'Free',  accentVar: '--blue' },
  ]

  return (
    <section id="roles" className="py-28 sm:py-36 relative overflow-hidden" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 100%, rgba(102,51,238,0.07) 0%, transparent 60%)' }} aria-hidden />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeUp className="text-center mb-16">
          <span className="metadata-caps" style={{ color: 'var(--amber)' }}>Five roles · one project</span>
          <h2
            className="mt-5 max-w-2xl mx-auto font-display font-bold text-[40px] sm:text-[50px] tracking-tight leading-[1.08]"
            style={{ color: 'var(--on-surface)' }}
          >
            Architect pays.{' '}
            <span className="font-editorial font-normal italic" style={{ color: 'var(--on-surface-variant)' }}>
              Everyone else joins free.
            </span>
          </h2>
        </FadeUp>

        <div className="grid gap-3 md:grid-cols-5">
          {list.map((r, i) => {
            const accent = `var(${r.accentVar})`
            return (
              <FadeUp key={r.title} delay={0.07 * i}>
                <motion.div
                  className="flex flex-col card-5bloc min-h-[210px]"
                  whileHover={{ y: -4, boxShadow: `0 0 0 1px ${accent}22, var(--shadow-3)`, transition: { duration: 0.2 } }}
                >
                  <r.icon className="h-5 w-5 mb-5" style={{ color: accent }} />
                  <div className="font-display font-bold text-[16px]" style={{ color: 'var(--on-surface)' }}>
                    {r.title}
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed flex-1" style={{ color: 'var(--on-surface-variant)' }}>
                    {r.tagline}
                  </p>
                  <div
                    className="mt-auto pt-5 font-mono text-[10px] uppercase tracking-[0.18em]"
                    style={{
                      color: accent,
                      boxShadow: '0 -1px 0 rgba(255,255,255,0.06)',
                      paddingTop: '14px',
                    }}
                  >
                    {r.price}
                  </div>
                </motion.div>
              </FadeUp>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────
   Modules
──────────────────────────────────────── */
function ModulesSection() {
  const modules = [
    { label: 'Document vault',       desc: 'Drawings, contracts and specs with real version history. Every revision linked to the RFI that caused it.' },
    { label: 'RFIs & submittals',    desc: 'Structured Q&A tied to the exact drawing version and grid reference — not a separate email chain.' },
    { label: 'AI cost estimator',    desc: 'Estimate BOQ lines from your DPR using government SOR rates. Missing items filled by AI in seconds.' },
    { label: 'Client portal',        desc: 'A read-only progress view in plain English. Clients approve samples, see payments, stop calling.' },
    { label: 'Permits & compliance', desc: 'RERA, NBC, local bye-laws — tracked and flagged. Not buried in a WhatsApp thread.' },
    { label: 'Vendor marketplace',   desc: 'Verified contractors and consultants in India. Their ratings follow them across projects.' },
  ]

  return (
    <section
      id="modules"
      className="py-28 sm:py-36 relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.018)' }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 10% 50%, rgba(245,166,35,0.05) 0%, transparent 65%)' }} aria-hidden />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeUp className="mb-16">
          <span className="metadata-caps" style={{ color: 'var(--amber)' }}>Core modules</span>
          <h2
            className="mt-5 max-w-3xl font-display font-bold text-[40px] sm:text-[50px] tracking-tight leading-[1.08]"
            style={{ color: 'var(--on-surface)' }}
          >
            Every tool your office needs.{' '}
            <span className="font-editorial font-normal italic" style={{ color: 'var(--on-surface-variant)' }}>
              None of the swivel-chair.
            </span>
          </h2>
        </FadeUp>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => (
            <FadeUp key={m.label} delay={0.04 * i}>
              <div
                className="card-5bloc h-full"
                style={{ background: 'var(--surface-elevated)' }}
              >
                <div className="flex items-baseline justify-between mb-4">
                  <div
                    className="font-display font-bold text-[16px]"
                    style={{ color: 'var(--on-surface)' }}
                  >
                    {m.label}
                  </div>
                  <div
                    className="font-mono text-[11px]"
                    style={{ color: 'var(--stone)', opacity: 0.45 }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                </div>
                <div className="ghost-cut mb-4" />
                <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                  {m.desc}
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
   How it works — 3 steps
──────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      n: '01',
      icon: 'add_circle_outline',
      title: 'Create your project',
      body: 'Add your brief, upload drawings, and invite your team — architect, contractor, consultant, client. Each person gets exactly the access they need.',
    },
    {
      n: '02',
      icon: 'hub',
      title: 'Run everything in one place',
      body: 'RFIs link to the drawing version they reference. BOQ lines are AI-estimated from your DPR. Site logs, invoices, permits — all connected.',
    },
    {
      n: '03',
      icon: 'person_check',
      title: 'Client always knows the status',
      body: 'A read-only portal in plain English. Your client approves samples, sees payment milestones, and stops calling you for updates.',
    },
  ]

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.018)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(56,130,255,0.05) 0%, transparent 60%)' }} aria-hidden />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeUp className="text-center mb-16">
          <span className="metadata-caps" style={{ color: 'var(--amber)' }}>How it works</span>
          <h2
            className="mt-5 max-w-2xl mx-auto font-display font-bold text-[38px] sm:text-[48px] tracking-tight leading-[1.08]"
            style={{ color: 'var(--on-surface)' }}
          >
            Three steps.{' '}
            <span className="font-editorial font-normal italic" style={{ color: 'var(--on-surface-variant)' }}>
              One place.
            </span>
          </h2>
        </FadeUp>

        <div className="grid gap-5 md:grid-cols-3 relative">
          <div
            className="hidden md:block absolute top-[52px] left-[18%] right-[18%] h-px"
            style={{ background: 'var(--surface-container-high)' }}
            aria-hidden
          />
          {steps.map((s, i) => (
            <FadeUp key={s.n} delay={0.1 * i} className="relative z-10">
              <div className="card-5bloc h-full">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="h-11 w-11 rounded-full flex items-center justify-center font-mono text-[13px] font-bold shrink-0"
                    style={{ background: 'var(--surface-elevated)', color: 'var(--amber)', boxShadow: 'var(--glow-amber)' }}
                  >
                    {s.n}
                  </div>
                  <span className="material-icons-outlined text-[20px]" style={{ color: 'var(--stone)' }}>{s.icon}</span>
                </div>
                <div className="font-display font-bold text-[17px] mb-3" style={{ color: 'var(--on-surface)' }}>
                  {s.title}
                </div>
                <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                  {s.body}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.3} className="flex justify-center mt-10">
          <a href="#waitlist" className="btn-primary">
            Get early access <ArrowRight className="h-4 w-4" />
          </a>
        </FadeUp>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────
   Testimonials — compact, above prototype
──────────────────────────────────────── */
function Testimonials() {
  const quotes = [
    {
      quote: 'Three projects in, my WhatsApp groups have gone quiet. RFIs land where the drawing lives, and the client portal has eliminated half my evening calls.',
      name: 'Aanya Mehta',
      role: 'Principal Architect',
      firm: 'Mehta + Rao Architects',
      city: 'Bengaluru',
    },
    {
      quote: "We bid through 5Bloc now. Specs, BOQ, drawings — all versioned and in one place. I haven't received a 'final_final_v3.dwg' email in months.",
      name: 'Rohit Shenoy',
      role: 'Director',
      firm: 'Shenoy Build Co.',
      city: 'Mumbai',
    },
    {
      quote: "As a client I finally understand where my money is going. The portal speaks plain English — I don't need to call my architect every other evening.",
      name: 'Priya Iyer',
      role: 'Homeowner',
      firm: 'Kapoor Villa project',
      city: 'Pune',
    },
  ]

  return (
    <section className="py-16 sm:py-20 relative overflow-hidden" style={{ background: 'transparent' }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeUp>
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.22em] mb-10" style={{ color: 'var(--stone)' }}>
            Early users say
          </p>
        </FadeUp>
        <div className="grid gap-4 md:grid-cols-3">
          {quotes.map((q, i) => (
            <FadeUp key={q.name} delay={0.08 * i}>
              <motion.figure
                className="card-5bloc h-full flex flex-col"
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
              >
                <blockquote
                  className="flex-1 text-[14.5px] leading-relaxed"
                  style={{ color: 'var(--on-surface-variant)' }}
                >
                  <span className="font-display text-[28px] leading-none mr-1" style={{ color: 'var(--amber)' }}>
                    &ldquo;
                  </span>
                  {q.quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0"
                    style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--amber)' }}
                  >
                    {q.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-[13px]" style={{ color: 'var(--on-surface)' }}>
                      {q.name}
                    </div>
                    <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--stone)' }}>
                      {q.role} · {q.firm}
                    </div>
                  </div>
                </figcaption>
              </motion.figure>
            </FadeUp>
          ))}
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
    { q: 'When does the beta open?', a: "We onboard 10 practices a week, in cohorts of architects + their teams. Sign up and we'll email you when your slot opens — usually within 2–3 weeks of joining the list." },
    { q: 'Who actually pays for 5Bloc?', a: "The architect's practice. Builders, contractors, consultants and clients join the projects you invite them to — free, with role-scoped access." },
    { q: 'Do we need to migrate our existing projects?', a: 'No. Most firms start with one new project, then add older ones as they reach a milestone. Drawings, RFIs and documents import via drag-and-drop.' },
    { q: 'How is this different from Procore or ACC?', a: "Those are excellent for large GCs. 5Bloc is built for the architect-led project — the kind that runs on WhatsApp today. It's lighter, faster to adopt, and priced for Indian and emerging-market practices." },
    { q: 'Does the AI link with tools like AutoCAD?', a: 'Yes, 5Bloc maps straight to Google Drive folders, syncs with WhatsApp site channels, and embeds a fully interactive CAD & Autodesk Fusion 360 viewer directly in the vault.' },
    { q: 'Does the AI just write fluff?', a: "No. It estimates BOQ line items from a DPR, summarises bye-laws, drafts RFI responses, and answers questions grounded in the project's own files. Always editable, always cited." },
  ]

  return (
    <section id="faq" className="py-28 sm:py-36 relative overflow-hidden" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 60% at 20% 50%, rgba(56,130,255,0.05) 0%, transparent 60%)' }} aria-hidden />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.6fr] lg:items-start">
          <FadeUp>
            <span className="metadata-caps" style={{ color: 'var(--amber)' }}>Frequently asked</span>
            <h2
              className="mt-5 font-display font-bold text-[40px] sm:text-[50px] tracking-tight leading-[1.08]"
              style={{ color: 'var(--on-surface)' }}
            >
              Questions practices ask in the first call.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
              Still on the fence?{' '}
              <a
                href="mailto:contact@5bloc.com"
                className="font-medium underline underline-offset-4 transition-colors"
                style={{ color: 'var(--amber)' }}
              >
                contact@5bloc.com
              </a>{' '}
              — we'll do a 20-minute walkthrough.
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <dl className="grid gap-2">
              {faqs.map((f, i) => (
                <motion.div
                  key={f.q}
                  className="card-5bloc cursor-pointer"
                  style={{ padding: '18px 22px' }}
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <dt className="flex items-center justify-between gap-4">
                    <span className="font-display font-bold text-[16px]" style={{ color: 'var(--on-surface)' }}>
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
        </div>
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
      className="py-28 sm:py-32 relative overflow-hidden"
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
              className="relative rounded-[calc(2.5rem-1px)] px-8 py-20 sm:px-16 sm:py-24 overflow-hidden"
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
                    className="mt-6 font-display font-bold leading-[1.06] tracking-tight"
                    style={{ fontSize: 'clamp(36px, 5vw, 58px)', color: 'var(--on-surface)' }}
                  >
                    Bring your next project to 5Bloc.
                  </h2>
                  <p className="mt-6 max-w-lg text-[16px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                    Tell us about your practice and we'll line up an onboarding session.
                    First three projects are always free.
                  </p>
                  <ul className="mt-10 grid gap-3.5">
                    {[
                      '10 practices onboarded per week',
                      'Unlimited invited collaborators',
                      'White-glove migration from existing tools',
                      'Direct line to the founding team',
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
        { href: '#prototype', label: 'Interactive demo' },
        { href: '#pillars',   label: 'Why 5Bloc' },
        { href: '#roles',     label: 'Stakeholder roles' },
        { href: '#modules',   label: 'Product modules' },
      ],
    },
    {
      title: 'Company',
      links: [
        { href: 'mailto:contact@5bloc.com', label: 'Contact us' },
        { href: '#waitlist',              label: 'Join the beta' },
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
              The operating system for the architecture industry. Built with architects,
              in Bengaluru, Mumbai and Pune.
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
      <PainStrip />
      <Testimonials />
      <PrototypeSection />
      <Pillars />
      <HowItWorks />
      <RolesGrid />
      <ModulesSection />
      <FAQ />
      <WaitlistCTA />
      <SiteFooter />
    </div>
  )
}
