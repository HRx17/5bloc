'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { ChevronDown, Menu, X } from 'lucide-react'
import { WaitlistForm } from '@/components/site/WaitlistForm'
import { InteractivePrototype } from '@/components/site/InteractivePrototype'
import { HowItWorksFlow } from '@/components/site/HowItWorksFlow'
import { Logo } from '@/components/brand/LogoMark'
import { createSupabaseClient } from '@/lib/supabase/client'
import { FAQS, FOUNDERS, FOUNDER_STORY, TESTIMONIALS, WAITLIST_AVATARS } from '@/lib/site/marketing'
import '../../app/landing.css'

const WAITLIST_COUNT = '400+'

/* ── Apple-style scroll reveal ── */
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-8%' })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

function AppleNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '#flow', label: 'How it works' },
    { href: '#prototype', label: 'Demo' },
    { href: '#marketplace', label: 'Marketplace' },
    { href: '#features', label: 'Features' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#founder', label: 'Founders' },
    { href: '/about', label: 'About' },
    { href: '/vs/5bloc-vs-procore', label: 'Compare' },
    { href: '#faq', label: 'FAQ' },
  ]

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'var(--lp-nav-bg-scrolled)' : 'var(--lp-nav-bg)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: scrolled ? '1px solid var(--lp-border)' : '1px solid transparent',
      }}
    >
      <div className="mx-auto flex h-11 max-w-[980px] items-center justify-between px-5 sm:px-6">
        <Link href="/" className="opacity-90 hover:opacity-100 transition-opacity select-none">
          <Logo size={22} showTagline={false} color="var(--lp-text)" />
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="lp-nav-link">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          <a href="#architect-waitlist" className="lp-nav-link hidden lg:inline">Architects</a>
          <Link href="/list-your-business" className="lp-btn lp-btn-nav">
            Contractors (free)
          </Link>
          <Link href="/join-as-vendor" className="lp-btn lp-btn-nav">
            Vendors (free)
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden p-2 -mr-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden border-t"
          style={{ borderColor: 'var(--lp-border)', background: 'var(--lp-nav-bg-scrolled)' }}
        >
          <div className="px-5 py-4 space-y-1">
            <div className="pb-4 mb-2 space-y-2 border-b" style={{ borderColor: 'var(--lp-border)' }}>
              <Link
                href="/list-your-business"
                onClick={() => setOpen(false)}
                className="lp-btn w-full text-[14px] min-h-[2.75rem]"
              >
                Contractors — join waitlist (free)
              </Link>
              <Link
                href="/join-as-vendor"
                onClick={() => setOpen(false)}
                className="lp-btn lp-btn-outline w-full text-[14px] min-h-[2.75rem]"
              >
                Vendors — join waitlist (free)
              </Link>
              <a
                href="#architect-waitlist"
                onClick={() => setOpen(false)}
                className="block text-center py-2.5 text-[15px] lp-link"
              >
                Architects — join waitlist (free)
              </a>
            </div>
            {[...links, { href: '#waitlist', label: 'Full signup form' }].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2.5 text-[17px]"
                style={{ color: 'var(--lp-text)' }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </header>
  )
}

function HeroRoleCards() {
  const cards = [
    {
      label: 'Architects',
      sub: 'Free waitlist',
      href: '#architect-waitlist',
    },
    {
      label: 'Contractors',
      sub: 'Free listing',
      href: '/list-your-business',
    },
    {
      label: 'Vendors',
      sub: 'Free listing',
      href: '/join-as-vendor',
    },
  ] as const

  return (
    <motion.div
      className="mt-10 sm:mt-12 max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.28 }}
    >
      <p className="text-[14px] mb-6" style={{ color: 'var(--lp-text-secondary)' }}>
        Free to list — choose your role
      </p>
      <div
        className="grid sm:grid-cols-3 rounded-2xl overflow-hidden lp-tile-row"
        style={{ background: 'var(--lp-border)' }}
      >
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="lp-tile block px-4 py-6 sm:px-5 sm:py-9 text-center transition-colors"
          >
            <p className="text-[19px] sm:text-[21px] font-semibold tracking-tight" style={{ color: 'var(--lp-text)' }}>
              {card.label}
            </p>
            <p className="mt-1 text-[14px]" style={{ color: 'var(--lp-text-secondary)' }}>
              {card.sub}
            </p>
            <p className="mt-4 lp-link text-[15px]">Join waitlist ›</p>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}

function AppleHero() {
  return (
    <section className="pt-24 pb-12 sm:pt-36 sm:pb-24 text-center" style={{ background: 'var(--lp-bg)' }}>
      <div className="mx-auto max-w-[980px] px-5 sm:px-6">
        <motion.div
          className="mb-5 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <span className="lp-scarcity-pill">Private beta · 10 practices onboarded per week</span>
        </motion.div>

        <motion.h1
          className="lp-headline"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.05 }}
        >
          The AEC project coordination platform for architect-led teams.
        </motion.h1>

        <motion.p
          className="lp-subhead mt-5 max-w-[560px] mx-auto"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15 }}
        >
          Stop running projects on 15 WhatsApp groups. One workspace where architects coordinate,
          contractors bid and deliver, vendors get discovered, and clients see progress — without
          another app to install.
        </motion.p>

        <WaitlistSocialProof />

        <motion.p
          className="mt-3 text-[13px]"
          style={{ color: 'var(--lp-text-secondary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          Built by{' '}
          <a href="#founder" className="lp-link text-[13px]">
            Haet Ranpariya
          </a>
          {' and '}
          <a href="#founder" className="lp-link text-[13px]">
            Parth Mehta
          </a>
          {' · '}
          <Link href="/about" className="lp-link text-[13px]">
            About
          </Link>
        </motion.p>

        <motion.div
          className="mt-8 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <a href="#prototype" className="lp-btn">Try the demo</a>
        </motion.div>

        <HeroRoleCards />

        <motion.div
          id="architect-waitlist"
          className="mt-12 max-w-md mx-auto scroll-mt-24"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <WaitlistForm compact source="hero" theme="apple" />
        </motion.div>
      </div>
    </section>
  )
}

function WaitlistSocialProof() {
  const [lastLabel, setLastLabel] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/waitlist/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d?.last_label) setLastLabel(d.last_label)
      })
      .catch(() => {})
  }, [])

  return (
    <motion.div
      className="mt-6 flex flex-col items-center gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center -space-x-2">
        {WAITLIST_AVATARS.map((a) => (
          <span
            key={a.initials}
            title={a.city}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold border-2"
            style={{
              background: '#F5A623',
              color: '#0C1220',
              borderColor: '#FAFAF8',
            }}
          >
            {a.initials}
          </span>
        ))}
      </div>
      <p className="text-[12px] text-center max-w-md" style={{ color: '#8C8680' }}>
        Join {WAITLIST_COUNT} people already on the waitlist across Mumbai, Delhi, Bangalore — and the US.
        {lastLabel ? <span className="block mt-1">{lastLabel}</span> : null}
      </p>
    </motion.div>
  )
}

function MidPageWaitlistCTA() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      const el = document.querySelector<HTMLInputElement>('#waitlist input[type="email"]')
      document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
      el?.focus()
      return
    }
    setBusy(true)
    setError('')
    try {
      const supabase = createSupabaseClient()
      const { error: dbError } = await supabase.from('waitlist').insert({
        email: email.trim().toLowerCase(),
        role: 'architect',
        name: null,
        firm: null,
      })
      if (dbError && dbError.code !== '23505') {
        setError('Something went wrong. Please try again.')
      } else {
        setDone(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="lp-mid-cta py-12">
      <div className="mx-auto max-w-[680px] px-5 sm:px-6 text-center">
        <h2 className="text-[20px] font-semibold" style={{ color: '#0C1220' }}>
          Liked what you saw? You&apos;re a few clicks from using it on a real project.
        </h2>
        <p className="mt-3 text-[14px] mx-auto max-w-[480px]" style={{ color: '#5C5750' }}>
          Paid plans are waived for the test period. No credit card required.
        </p>
        {done ? (
          <p className="mt-6 text-[14px] font-medium" style={{ color: '#2ECC8A' }}>
            You&apos;re on the list — we&apos;ll be in touch.
          </p>
        ) : (
          <form
            onSubmit={submit}
            className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3"
          >
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="lp-mid-cta-input mx-auto sm:mx-0"
            />
            <button type="submit" disabled={busy} className="lp-mid-cta-btn w-full sm:w-auto">
              {busy ? 'Joining…' : 'Join waitlist →'}
            </button>
          </form>
        )}
        {error && (
          <p className="mt-3 text-[13px]" style={{ color: '#E84545' }}>{error}</p>
        )}
      </div>
    </section>
  )
}

function TestimonialSection() {
  return (
    <section className="py-16 sm:py-20" style={{ background: 'var(--lp-bg)' }}>
      <div className="mx-auto max-w-[980px] px-5 sm:px-6">
        <h2 className="lp-section-title text-center mb-10 sm:mb-14">From practices already on the beta</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl p-6 text-left"
              style={{ background: 'var(--lp-bg-alt)', boxShadow: 'inset 0 0 0 1px var(--lp-border)' }}
            >
              <blockquote className="text-[16px] leading-relaxed" style={{ color: '#0C1220' }}>
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <img
                  src={t.photo}
                  alt={t.name}
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--lp-text)' }}>
                    {t.name}
                  </p>
                  <p className="text-[12px]" style={{ color: 'var(--lp-text-secondary)' }}>
                    {t.role}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function FounderSection() {
  return (
    <section id="founder" className="py-16 sm:py-20" style={{ background: 'var(--lp-bg-alt)' }}>
      <div className="mx-auto max-w-[720px] px-5 sm:px-6">
        <p className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--lp-brand)' }}>
          Why we built this
        </p>
        <div className="mt-5 grid grid-cols-2 gap-4 max-w-md">
          {FOUNDERS.map((f) => (
            <div key={f.name} className="flex flex-col items-start gap-3">
              <img
                src={f.photo}
                alt={f.name}
                className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl object-cover"
              />
              <div>
                <h2 className="text-[18px] font-semibold tracking-tight" style={{ color: 'var(--lp-text)' }}>
                  {f.name}
                </h2>
                <p className="text-[13px]" style={{ color: 'var(--lp-text-secondary)' }}>
                  {f.role}
                </p>
                <a
                  href={f.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="lp-link inline-block mt-1 text-[14px]"
                >
                  LinkedIn →
                </a>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[16px] leading-relaxed" style={{ color: 'var(--lp-text-secondary)' }}>
          {FOUNDER_STORY}
        </p>
        <Link href="/about" className="lp-link inline-block mt-4 text-[15px]">
          Full story
        </Link>
      </div>
    </section>
  )
}

function PartnerStrip() {
  const items = [
    { label: 'Contractors', sub: 'List your firm free', href: '/list-your-business' },
    { label: 'Vendors', sub: 'List your catalogue free', href: '/join-as-vendor' },
  ]

  return (
    <section id="partner-waitlist" style={{ background: 'var(--lp-bg-alt)' }}>
      <div className="mx-auto max-w-[980px] px-5 sm:px-6 py-12 sm:py-14">
        <Reveal className="text-center mb-8">
          <h2 className="text-[21px] sm:text-[24px] font-semibold tracking-tight" style={{ color: 'var(--lp-text)' }}>
            Contractors and vendors
          </h2>
          <p className="lp-subhead mt-2 max-w-md mx-auto text-[17px]">
            Join the waitlist — no fees to get listed.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 gap-px rounded-2xl overflow-hidden max-w-2xl mx-auto lp-tile-row" style={{ background: 'var(--lp-border)' }}>
          {items.map((item, i) => (
            <Reveal key={item.label} delay={0.05 * i}>
              <Link href={item.href} className="lp-tile block px-6 py-8 text-center">
                <p className="text-[19px] font-semibold tracking-tight" style={{ color: 'var(--lp-text)' }}>
                  {item.label}
                </p>
                <p className="mt-1 text-[14px]" style={{ color: 'var(--lp-text-secondary)' }}>
                  {item.sub}
                </p>
                <p className="mt-4 lp-link text-[15px]">Join waitlist ›</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function AppleDemo() {
  return (
    <section id="prototype" className="py-20 sm:py-28" style={{ background: 'var(--lp-bg-dark)' }}>
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        <Reveal className="text-center mb-12 sm:mb-16">
          <h2 className="lp-section-title lp-headline-dark">See it yourself.</h2>
          <p className="lp-subhead lp-subhead-dark mt-4 max-w-xl mx-auto">
            A live project workspace. No signup required.
          </p>
          <a href="#prototype-demo" className="lp-link lp-link-dark inline-block mt-5">
            Explore the demo ›
          </a>
        </Reveal>

        <Reveal delay={0.1}>
          <div id="prototype-demo" className="lp-device lp-device-dark scroll-mt-24">
            <InteractivePrototype />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function AppleFeatures() {
  const features = [
    { title: 'Document vault', body: 'Every drawing version, saved and searchable.' },
    { title: 'RFIs & submittals', body: 'Tied to the plan they refer to — not lost in email.' },
    { title: 'AI cost estimator', body: 'BOQ lines from your DPR, in seconds.' },
    { title: 'Client portal', body: 'Plain-English progress. No app to install.' },
    { title: 'Permits & RERA', body: 'Compliance tracked inside the project.' },
    { title: 'Trusted network', body: 'Contractors and consultants you already work with.' },
  ]

  return (
    <section id="features" className="py-20 sm:py-28" style={{ background: 'var(--lp-bg)' }}>
      <div className="mx-auto max-w-[980px] px-5 sm:px-6">
        <Reveal className="text-center mb-14 sm:mb-20">
          <h2 className="lp-section-title">Built for how projects actually run.</h2>
          <p className="lp-subhead mt-4 max-w-lg mx-auto">
            One place instead of chats, spreadsheets, and scattered files.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={0.04 * i}>
              <div className="lp-feature-item h-full">
                <h3 className="text-[21px] font-semibold tracking-tight" style={{ color: 'var(--lp-text)' }}>
                  {f.title}
                </h3>
                <p className="mt-2 text-[17px] leading-relaxed" style={{ color: 'var(--lp-text-secondary)' }}>
                  {f.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function MarketplaceSection() {
  return (
    <section id="marketplace" className="py-20 sm:py-28 scroll-mt-24" style={{ background: 'var(--lp-bg)' }}>
      <div className="mx-auto max-w-[980px] px-5 sm:px-6">
        <Reveal className="text-center mb-12">
          <h2 className="lp-section-title">Vendors get discovered. Architects find the right trade.</h2>
          <p className="lp-subhead mt-4 max-w-2xl mx-auto">
            Coordination tools stop at the drawing. 5Bloc also lists contractors and vendors by trade and city,
            so a Mumbai façade job can find a listed fabricator — and that fabricator gets found by practices
            already running work on 5Bloc.
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <div
            className="rounded-2xl overflow-hidden grid md:grid-cols-[1fr_1.2fr]"
            style={{ background: 'var(--lp-bg-alt)', boxShadow: 'inset 0 0 0 1px var(--lp-border)' }}
          >
            <div className="p-6 sm:p-8 border-b md:border-b-0 md:border-r" style={{ borderColor: 'var(--lp-border)' }}>
              <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--lp-brand)' }}>
                Architect search
              </p>
              <div
                className="mt-4 rounded-xl px-3 py-2.5 text-[14px]"
                style={{ background: '#fff', boxShadow: 'inset 0 0 0 1px var(--lp-border)' }}
              >
                Façade · Mumbai
              </div>
              <ul className="mt-4 space-y-3">
                {['Apex Façade Systems · Andheri', 'South Bombay Glass · Colaba', 'Rivet Cladding Co. · Navi Mumbai'].map(
                  (row) => (
                    <li
                      key={row}
                      className="flex items-center justify-between rounded-xl px-3 py-3 text-[13px]"
                      style={{ background: '#fff', boxShadow: 'inset 0 0 0 1px var(--lp-border)' }}
                    >
                      <span>{row}</span>
                      <span className="lp-link text-[13px]">Invite</span>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--lp-brand)' }}>
                How it works
              </p>
              <ol className="mt-4 space-y-4 text-[16px] leading-relaxed" style={{ color: 'var(--lp-text-secondary)' }}>
                <li>1. Architect searches by trade and city inside the project.</li>
                <li>2. Listed vendors show portfolio, city, and whether they are open to bid.</li>
                <li>3. Invite them onto the job — they see drawings and RFIs, no extra seat fee.</li>
              </ol>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/join-as-vendor" className="lp-btn text-[14px]">
                  List as a vendor
                </Link>
                <Link href="/list-your-business" className="lp-link text-[15px] py-2">
                  Contractor listing ›
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function UsPricingSection() {
  return (
    <section id="pricing" className="py-20 sm:py-28 scroll-mt-24" style={{ background: 'var(--lp-bg-alt)' }}>
      <div className="mx-auto max-w-[980px] px-5 sm:px-6">
        <Reveal className="text-center mb-10">
          <h2 className="lp-section-title">Also available in the US</h2>
          <p className="lp-subhead mt-4 max-w-2xl mx-auto">
            Same architect-led workspace — RFIs, drawings, and a client portal with no app to install.
            US practices can join the waitlist today. Pricing below is the projected launch rate.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div
            className="rounded-2xl p-6"
            style={{ background: '#fff', boxShadow: 'inset 0 0 0 1px var(--lp-border)' }}
          >
            <p className="text-[13px] font-semibold" style={{ color: 'var(--lp-brand)' }}>
              Solo
            </p>
            <p className="mt-2 text-[32px] font-semibold tracking-tight">$15</p>
            <p className="text-[14px]" style={{ color: 'var(--lp-text-secondary)' }}>
              per month at launch, for a principal running their own jobs.
            </p>
          </div>
          <div
            className="rounded-2xl p-6"
            style={{ background: '#fff', boxShadow: 'inset 0 0 0 1px var(--lp-border)' }}
          >
            <p className="text-[13px] font-semibold" style={{ color: 'var(--lp-brand)' }}>
              Team
            </p>
            <p className="mt-2 text-[32px] font-semibold tracking-tight">$49.99+</p>
            <p className="text-[14px]" style={{ color: 'var(--lp-text-secondary)' }}>
              per month at launch. Invited contractors and clients stay free.
            </p>
          </div>
        </div>
        <p className="mt-6 text-center text-[13px]" style={{ color: 'var(--lp-text-tertiary)' }}>
          Add your US city on the waitlist form. India launch pricing remains in ₹ on the in-app billing screen.
        </p>
      </div>
    </section>
  )
}

function AppleFAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="py-20 sm:py-28" style={{ background: 'var(--lp-bg-alt)' }}>
      <div className="mx-auto max-w-[680px] px-5 sm:px-6">
        <Reveal className="text-center mb-12">
          <h2 className="lp-section-title">Questions & answers</h2>
        </Reveal>

        <dl>
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={0.04 * i}>
              <div className="lp-divider" />
              <dt>
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-4 py-5 text-left"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="text-[17px] font-semibold" style={{ color: 'var(--lp-text)' }}>
                    {f.q}
                  </span>
                  <motion.span animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.25 }}>
                    <ChevronDown className="h-5 w-5 shrink-0" style={{ color: 'var(--lp-text-tertiary)' }} />
                  </motion.span>
                </button>
              </dt>
              <motion.dd
                initial={false}
                animate={{ height: open === i ? 'auto' : 0, opacity: open === i ? 1 : 0 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden"
              >
                <p className="pb-5 text-[17px] leading-relaxed" style={{ color: 'var(--lp-text-secondary)' }}>
                  {f.a}
                  {f.q.includes('Procore') && (
                    <>
                      {' '}
                      <Link href="/vs/5bloc-vs-procore" className="lp-link text-[17px]">
                        5Bloc vs Procore
                      </Link>
                      {' · '}
                      <Link href="/vs/5bloc-vs-fieldwire" className="lp-link text-[17px]">
                        vs Fieldwire
                      </Link>
                    </>
                  )}
                </p>
              </motion.dd>
            </Reveal>
          ))}
          <div className="lp-divider" />
        </dl>

        <p className="mt-10 text-center text-[14px]" style={{ color: 'var(--lp-text-secondary)' }}>
          More questions?{' '}
          <a href="mailto:contact@5bloc.com" className="lp-link text-[14px]">contact@5bloc.com</a>
        </p>
      </div>
    </section>
  )
}

function AppleWaitlist() {
  return (
    <section id="waitlist" className="py-20 sm:py-28 scroll-mt-20" style={{ background: 'var(--lp-bg)' }}>
      <div className="mx-auto max-w-[680px] px-5 sm:px-6 text-center">
        <Reveal>
          <h2 className="lp-section-title">One workspace. For everyone on the build.</h2>
          <p className="lp-subhead mt-4 max-w-lg mx-auto">
            Architects, contractors, vendors — all on the same project, each in their role.
          </p>
        </Reveal>
        <Reveal delay={0.1} className="mt-10 text-left">
          <WaitlistForm source="cta" theme="apple" />
        </Reveal>
      </div>
    </section>
  )
}

function AppleFooter() {
  const groups = [
    {
      title: 'Explore',
      links: [
        { href: '#flow', label: 'How it works' },
        { href: '#pricing', label: 'Pricing' },
        { href: '/about', label: 'About' },
        { href: '/changelog', label: 'Changelog' },
        { href: '/vs/5bloc-vs-procore', label: 'vs Procore' },
        { href: '/vs/5bloc-vs-fieldwire', label: 'vs Fieldwire' },
        { href: '#faq', label: 'FAQ' },
      ],
    },
    {
      title: 'Join',
      links: [
        { href: '#architect-waitlist', label: 'Architects' },
        { href: '/list-your-business', label: 'Contractors' },
        { href: '/join-as-vendor', label: 'Vendors' },
        { href: 'mailto:contact@5bloc.com', label: 'Contact' },
      ],
    },
  ]

  return (
    <footer style={{ background: 'var(--lp-bg-alt)', borderTop: '1px solid var(--lp-border)' }}>
      <div className="mx-auto max-w-[980px] px-5 sm:px-6 py-12 sm:py-16">
        <div className="grid sm:grid-cols-3 gap-10">
          <div>
            <Logo size={18} showTagline={false} color="var(--lp-text)" />
            <p className="text-[12px] leading-relaxed max-w-xs mt-4" style={{ color: 'var(--lp-text-secondary)' }}>
              One workspace for architects, contractors, vendors, and clients.
            </p>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <p className="text-[12px] font-semibold mb-4" style={{ color: 'var(--lp-text)' }}>
                {g.title}
              </p>
              <ul className="space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="lp-link text-[12px]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="lp-divider mt-12 mb-6" />
        <p className="text-[12px]" style={{ color: 'var(--lp-text-tertiary)' }}>
          Copyright © {new Date().getFullYear()} 5Bloc Technologies. All rights reserved.
          {' · '}
          <Link href="/privacy" className="lp-link text-[12px]">Privacy</Link>
          {' · '}
          <Link href="/terms" className="lp-link text-[12px]">Terms</Link>
        </p>
      </div>
    </footer>
  )
}

export default function HomePage() {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
    document.documentElement.classList.add('landing-page-active')
    return () => {
      document.body.style.overflow = prev
      document.documentElement.style.overflow = ''
      document.documentElement.classList.remove('landing-page-active')
    }
  }, [])

  return (
    <div className="landing-apple min-h-screen">
      <AppleNav />
      <AppleHero />
      <HowItWorksFlow />
      <AppleDemo />
      <MarketplaceSection />
      <MidPageWaitlistCTA />
      <AppleFeatures />
      <UsPricingSection />
      <AppleFAQ />
      <TestimonialSection />
      <FounderSection />
      <AppleWaitlist />
      <PartnerStrip />
      <AppleFooter />
    </div>
  )
}
