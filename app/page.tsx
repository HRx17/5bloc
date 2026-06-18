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
import './landing.css'

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
    { href: '#features', label: 'Features' },
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
          Construction runs on 15 WhatsApp groups.
          <br />
          <span className="lp-headline-amber">There&apos;s a better way.</span>
        </motion.h1>

        <motion.p
          className="lp-subhead mt-5 max-w-[560px] mx-auto"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15 }}
        >
          One workspace where architects coordinate, contractors bid and deliver, vendors get discovered, and clients see progress — without another app to install.
        </motion.p>

        <motion.p
          className="mt-4 text-[12px] text-center"
          style={{ color: '#8C8680' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Join {WAITLIST_COUNT} people already on the waitlist across Mumbai, Delhi &amp; Bangalore
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
          First 3 projects are free. No credit card. We onboard 10 practices per week.
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
    <section className="pt-[60px] pb-10" style={{ background: 'var(--lp-bg)' }}>
      <div className="mx-auto max-w-[640px] px-5 sm:px-6 text-center">
        <span
          className="block text-[80px] leading-none mb-[-16px]"
          style={{ color: '#F5A623', fontFamily: 'var(--lp-font)' }}
          aria-hidden
        >
          &ldquo;
        </span>
        <blockquote
          className="text-[20px] italic leading-[1.6]"
          style={{ color: '#0C1220', fontFamily: 'var(--lp-font)' }}
        >
          I&apos;ve managed 14 projects. Every single one ran on WhatsApp groups I couldn&apos;t search and Excel sheets nobody trusted. 5Bloc is what I wished existed when I started my practice.
        </blockquote>
        <p className="mt-4 text-[14px]" style={{ color: '#5C5750' }}>
          — Practicing architect, Mumbai · Early access user
        </p>
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

function AppleFAQ() {
  const [open, setOpen] = useState<number | null>(0)
  const faqs = [
    { q: 'What is 5Bloc?', a: 'One workspace for everyone on a build project. Drawings, RFIs, and updates — instead of WhatsApp and email.' },
    { q: 'Is it free to join?', a: 'Yes. The waitlist is free for architects, contractors, and vendors. Early architects get their first three projects free at launch.' },
    { q: 'Who pays later?', a: 'After launch, the architect\'s practice carries the subscription. Everyone invited to a project stays free.' },
    { q: 'I\'m a contractor or vendor — how do I join?', a: 'Use the contractor or vendor buttons at the top of the page. Listing is free — we\'ll email you when onboarding opens in your city.' },
    { q: 'How is this different from Procore?', a: '5Bloc is built for architect-led projects in India — lighter, faster to adopt, priced for smaller practices.' },
  ]

  return (
    <section id="faq" className="py-20 sm:py-28" style={{ background: 'var(--lp-bg-alt)' }}>
      <div className="mx-auto max-w-[680px] px-5 sm:px-6">
        <Reveal className="text-center mb-12">
          <h2 className="lp-section-title">Questions & answers</h2>
        </Reveal>

        <dl>
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={0.05 * i}>
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
        { href: '#prototype', label: 'Demo' },
        { href: '#features', label: 'Features' },
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
                    <Link href={l.href} className="text-[12px] lp-link text-[12px]">
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
        </p>
      </div>
    </footer>
  )
}

export default function Home() {
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
      <MidPageWaitlistCTA />
      <AppleFeatures />
      <AppleFAQ />
      <TestimonialSection />
      <AppleWaitlist />
      <PartnerStrip />
      <AppleFooter />
    </div>
  )
}
