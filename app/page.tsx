'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  Network
} from 'lucide-react'
import { WaitlistForm } from '@/components/site/WaitlistForm'
import { InteractivePrototype } from '@/components/site/InteractivePrototype'

export default function Home() {
  return (
    <div className="landing font-body h-full min-h-screen overflow-y-auto bg-[var(--surface-canvas)] text-[var(--on-surface)] selection:bg-[var(--amber)] selection:text-[var(--ink-black)]">
      <SiteHeader />
      <Hero />
      <Logos />
      <PrototypeSection />
      <Pillars />
      <RolesGrid />
      <ModulesSection />
      <FlowSection />
      <Testimonials />
      <FAQ />
      <WaitlistCTA />
      <SiteFooter />
    </div>
  )
}

function LogoMark({ size = 28 }: { size?: number }) {
  const a = 'var(--amber-dk)'
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className="shrink-0" aria-hidden>
      {[10, 20, 30].flatMap((x) => [10, 20, 30].map((y) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill={a} opacity="0.3" />
      )))}
      <rect x="6" y="6" width="28" height="6" rx="0" fill={a} />
      <rect x="6" y="15" width="22" height="6" rx="0" fill={a} opacity="0.75" />
      <rect x="6" y="24" width="16" height="6" rx="0" fill={a} opacity="0.5" />
      <rect x="6" y="33" width="10" height="5" rx="0" fill={a} opacity="0.28" />
    </svg>
  )
}

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <LogoMark size={28} />
      <span className="font-mono text-lg font-bold tracking-[0.08em] text-[var(--on-surface)]">
        5BLOC
      </span>
    </Link>
  )
}

function SiteHeader() {
  const [open, setOpen] = useState(false)
  const nav = [
    { href: '#prototype', label: 'Demo' },
    { href: '#pillars', label: 'Why 5Bloc' },
    { href: '#roles', label: 'Roles' },
    { href: '#modules', label: 'Modules' },
    { href: '#faq', label: 'FAQ' }
  ]

  return (
    <header className="sticky top-0 z-40 tracing-glass border-b border-[var(--surface-container-high)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-7 text-sm font-medium text-[var(--on-surface-variant)] md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="transition-colors hover:text-[var(--primary)] hover:drop-shadow-[0_0_8px_rgba(255,235,213,0.3)]">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/auth" className="text-sm font-medium text-[var(--on-surface-variant)] hover:text-[var(--primary)]">
            Sign In
          </Link>
          <a
            href="#waitlist"
            className="btn-pill-primary"
          >
            Join waitlist
          </a>
        </div>

        <button
          className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--surface-container)] text-[var(--on-surface)] md:hidden hover:shadow-[var(--glow-active)] transition-all"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="bg-[var(--surface-container)] md:hidden animate-stitch-reveal">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <nav className="grid gap-1 text-sm font-medium">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-[var(--on-surface-variant)] hover:bg-[var(--surface-elevated)] hover:text-[var(--on-surface)] transition-all"
                >
                  {n.label}
                </Link>
              ))}
              <div className="ghost-cut my-2"></div>
              <Link
                href="/auth"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-[var(--on-surface-variant)] hover:bg-[var(--surface-elevated)] hover:text-[var(--on-surface)] transition-all"
              >
                Sign In
              </Link>
              <div className="mt-4">
                <a
                  href="#waitlist"
                  onClick={() => setOpen(false)}
                  className="btn-pill-primary w-full"
                >
                  Join waitlist
                </a>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
      <div className="absolute inset-0 bg-ai-gradient opacity-20" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-elevated)] px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--amber)] shadow-1 animate-stitch-reveal delay-100">
            <Sparkles className="h-3 w-3" />
            <span>Private beta · Refractive Intelligence for AEC</span>
          </div>
          <h1 className="mt-8 font-display text-5xl leading-[1.1] sm:text-7xl lg:text-[80px] tracking-tight animate-stitch-reveal delay-200">
            The operating system{' '}
            <span className="font-editorial italic text-[var(--on-surface-variant)] font-normal">for the</span>{' '}
            architecture office.
          </h1>
          <p className="mt-8 mx-auto max-w-2xl text-lg text-[var(--on-surface-variant)] animate-stitch-reveal delay-300 font-body leading-relaxed">
            5Bloc replaces WhatsApp, Excel and email with a structured workspace
            built for AEC. Drawings have real version history. RFIs land in the
            right thread. Contractors bid where you already work.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-stitch-reveal delay-400">
            <WaitlistForm compact source="hero" />
            <a
              href="#prototype"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--tertiary-container)] hover:text-[var(--blue)] transition-colors mt-4 sm:mt-0"
            >
              Or try the live demo <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <dl className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-12 animate-stitch-reveal" style={{animationDelay: '500ms'}}>
            {[
              ['$11.3B', 'AEC software market'],
              ['122,769', 'Registered architects in India'],
              ['5–8', 'Disconnected tools per firm'],
            ].map(([n, l]) => (
              <div key={l} className="flex flex-col items-center">
                <div className="font-mono text-3xl font-bold text-[var(--primary)]">{n}</div>
                <div className="mt-2 font-mono text-[11px] uppercase tracking-widest text-[var(--on-surface-variant)]">{l}</div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

function Logos() {
  return (
    <section className="bg-[var(--surface-container-low)] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--on-surface-variant)] text-center">
            Built with practices in
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 font-display text-xl font-bold text-[var(--on-surface-variant)]/40">
            <span className="hover:text-[var(--on-surface-variant)] transition-colors cursor-default">BENGALURU</span>
            <span className="hover:text-[var(--on-surface-variant)] transition-colors cursor-default">MUMBAI</span>
            <span className="hover:text-[var(--on-surface-variant)] transition-colors cursor-default">AHMEDABAD</span>
            <span className="hover:text-[var(--on-surface-variant)] transition-colors cursor-default">PUNE</span>
            <span className="hover:text-[var(--on-surface-variant)] transition-colors cursor-default">NYC</span>
            <span className="hover:text-[var(--on-surface-variant)] transition-colors cursor-default">AUSTIN</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function PrototypeSection() {
  return (
    <section id="prototype" className="relative py-24 sm:py-32 bg-[var(--surface-canvas)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16 animate-stitch-reveal">
          <div className="max-w-2xl">
            <div className="metadata-caps text-[var(--amber)]">
              [⚡ Try it · no signup]
            </div>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl text-[var(--on-surface)] tracking-tight">
              A working slice of 5Bloc.
            </h2>
            <p className="mt-4 text-[var(--on-surface-variant)] text-lg">
              Click between modules. Browse drawing versions, reply to an RFI,
              ask AI to estimate missing BOQ lines, approve a sample as the
              client. Nothing is saved — it's just to show you the shape.
            </p>
          </div>
          <a
            href="#waitlist"
            className="btn-ai-wash shrink-0"
          >
            Like what you see? Join the waitlist <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="relative rounded-2xl bg-[var(--surface-container)] p-2 sm:p-4 shadow-3 animate-stitch-reveal delay-200" style={{ boxShadow: 'var(--glow-amber), var(--shadow-3)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-elevated)] to-transparent opacity-10 rounded-2xl"></div>
          <div className="relative rounded-xl overflow-hidden bg-[var(--surface-recessed)] ring-1 ring-[var(--surface-container-high)]">
            <InteractivePrototype />
          </div>
        </div>
      </div>
    </section>
  )
}

function Pillars() {
  const items = [
    { icon: Layers, title: 'Drawings with memory', body: 'Every drawing has a version. Every version has an owner, an approver and a moment in time. Audit trail by default.' },
    { icon: MessagesSquare, title: 'Email out of the loop', body: 'RFIs, submittals and approvals live in the project — not in 14 reply-all chains.' },
    { icon: Network, title: 'Trust, ported', body: 'Your trusted contractors and consultants move with you. Ratings accumulate across projects.' },
    { icon: Sparkles, title: 'AI where it earns its keep', body: 'Estimate BOQ from a DPR. Summarise a 60-page bye-law. Not gimmicks — chores.' },
    { icon: Shield, title: 'RERA-ready', body: 'Compliance and reporting baked in for Indian projects. Stripe + Razorpay for billing.' },
    { icon: FileText, title: 'One link for clients', body: 'A read-only portal in plain English. No software to install. No jargon to learn.' },
  ]
  return (
    <section id="pillars" className="py-24 sm:py-32 bg-[var(--surface-container-low)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[1fr_2fr]">
          <div className="animate-stitch-reveal">
            <div className="metadata-caps text-[var(--amber)]">
              [ Why 5Bloc ]
            </div>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl text-[var(--on-surface)] tracking-tight">
              Architecture deserves better than a group chat.
            </h2>
            <p className="mt-6 text-[var(--on-surface-variant)] text-lg">
              98% of Indian projects miss quality standards. Most run on WhatsApp,
              Excel and Gmail. 5Bloc gives every stakeholder one place to do
              their job — without learning new software.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 animate-stitch-reveal delay-200">
            {items.map((p, i) => (
              <div key={p.title} className="bg-[var(--surface-container)] p-8 rounded-2xl shadow-1 hover:shadow-2 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                   <p.icon className="h-24 w-24 text-[var(--amber)]" />
                </div>
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center mb-6 shadow-1 group-hover:shadow-[var(--glow-amber)] transition-shadow">
                    <p.icon className="h-6 w-6 text-[var(--amber)]" />
                  </div>
                  <div className="font-display font-bold text-xl text-[var(--on-surface)]">{p.title}</div>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--on-surface-variant)]">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function RolesGrid() {
  const list = [
    { icon: Compass, title: 'Architect', tagline: 'Run the office. Lead the design.', price: 'Paid' },
    { icon: HardHat, title: 'Contractor', tagline: 'Win work. Submit cleanly.', price: 'Free' },
    { icon: Building2, title: 'Builder', tagline: 'All your projects. One feed.', price: 'Free' },
    { icon: Wrench, title: 'Consultant', tagline: 'Discipline-scoped collaboration.', price: 'Free' },
    { icon: UserRound, title: 'Client', tagline: "Know what's happening.", price: 'Free' }
  ]
  return (
    <section id="roles" className="py-24 sm:py-32 bg-[var(--surface-canvas)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-stitch-reveal">
          <div className="metadata-caps text-[var(--amber)]">
            [ Five roles · one project ]
          </div>
          <h2 className="mt-4 max-w-2xl mx-auto font-display text-4xl sm:text-5xl text-[var(--on-surface)] tracking-tight">
            Architect pays.<br />
            <span className="font-editorial italic font-normal text-[var(--on-surface-variant)]">Everyone else joins free.</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-5 animate-stitch-reveal delay-200">
          {list.map((r, i) => (
            <div key={r.title} className="flex flex-col bg-[var(--surface-container)] p-6 rounded-2xl min-h-[220px] shadow-1 hover:shadow-[var(--glow-blue)] transition-all duration-300 hover:-translate-y-2">
              <r.icon className="h-6 w-6 text-[var(--blue)] mb-6" />
              <div className="font-display font-bold text-lg text-[var(--on-surface)]">{r.title}</div>
              <div className="mt-2 text-sm text-[var(--on-surface-variant)] leading-relaxed">{r.tagline}</div>
              <div className="mt-auto pt-6 border-t border-[var(--surface-container-high)] font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--blue)]">
                {r.price}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ModulesSection() {
  const modules = [
    { label: 'Project workspace', desc: 'Phases, milestones, tasks and a per-project home everyone shares.' },
    { label: 'Document vault', desc: 'Drawings, contracts and specs with real version history.' },
    { label: 'RFIs & submittals', desc: 'Structured Q&A linked to the drawing version it was raised against.' },
    { label: 'BOQ & feasibility', desc: 'AI-assisted cost estimates from government SOR and your own rates.' },
    { label: 'AI tools & CAD integration', desc: 'Drawing scan, Google Docs sync, and Autodesk Fusion 360 clash audits.' },
    { label: 'Permits & compliance', desc: 'RERA, local bye-laws and approvals — tracked, not lost in WhatsApp.' },
    { label: 'Site & field logs', desc: 'Daily reports, photos, snag lists synced with WhatsApp contractor threads.' },
    { label: 'Vendor marketplace', desc: 'Verified contractors and vendors in India. Trust travels between projects.' },
    { label: 'Client portal', desc: 'A read-only progress view your client will actually open and approve on.' },
    { label: 'Analytics & reports', desc: 'Time, cost and approval analytics across the office.' },
    { label: 'Portfolio showcase', desc: 'Your built work — discoverable by new clients.' },
    { label: 'Finance & billing', desc: 'Invoices, retention, GST. Razorpay and Stripe pipelines.' },
  ]
  return (
    <section id="modules" className="py-24 sm:py-32 bg-[var(--surface-container-low)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="animate-stitch-reveal">
          <div className="metadata-caps text-[var(--amber)]">
            [ 12 modules ]
          </div>
          <h2 className="mt-4 max-w-3xl font-display text-4xl sm:text-5xl text-[var(--on-surface)] tracking-tight">
            Every tool an office needs.<br />
            <span className="font-editorial italic font-normal text-[var(--on-surface-variant)]">None of the swivel-chair.</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-stitch-reveal delay-200">
          {modules.map((m, i) => (
            <div key={m.label} className="bg-[var(--surface-elevated)] p-6 rounded-2xl shadow-1 hover:shadow-2 transition-shadow">
              <div className="flex items-baseline justify-between mb-4">
                <div className="font-display font-bold text-lg text-[var(--on-surface)]">{m.label}</div>
                <div className="font-mono text-[12px] text-[var(--on-surface-variant)] opacity-50">
                  {String(i + 1).padStart(2, '0')}
                </div>
              </div>
              <div className="ghost-cut mb-4"></div>
              <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FlowSection() {
  const steps = [
    ['01', 'Architect creates project', 'Brief, drawings, scope, team — in one workspace.'],
    ['02', 'Invite collaborators', 'Builder, consultants, client. One click, role-scoped access.'],
    ['03', 'Tender or assign', 'Run a tender to verified contractors or assign your trusted ones.'],
    ['04', 'Drawings · RFIs · approvals', 'Versions tracked. RFIs linked. Approvals captured forever.'],
    ['05', 'Handover', 'As-builts, O&M manuals and a portfolio entry — the closing kit.'],
  ]
  return (
    <section className="py-24 sm:py-32 bg-[var(--surface-canvas)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-stitch-reveal">
          <div className="metadata-caps text-[var(--amber)]">
            [ From brief to handover ]
          </div>
          <h2 className="mt-4 max-w-3xl mx-auto font-display text-4xl sm:text-5xl text-[var(--on-surface)] tracking-tight">
            One thread for the whole lifecycle.
          </h2>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-5 animate-stitch-reveal delay-200 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-[44px] left-[10%] right-[10%] h-[2px] bg-[var(--surface-container-high)] z-0"></div>
          
          {steps.map(([n, t, d]) => (
            <div key={n} className="flex flex-col relative z-10 items-center text-center">
              <div className="h-12 w-12 rounded-full bg-[var(--surface-elevated)] border-4 border-[var(--surface-canvas)] flex items-center justify-center font-mono text-[14px] text-[var(--amber)] font-bold mb-6 shadow-1">
                {n}
              </div>
              <div className="font-display font-bold text-lg text-[var(--on-surface)]">{t}</div>
              <div className="mt-3 text-sm text-[var(--on-surface-variant)] leading-relaxed">{d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  const quotes = [
    {
      quote: 'Three projects in, my WhatsApp groups have gone quiet. RFIs land where the drawing lives, and the client portal has eliminated half my evening calls.',
      name: 'Aanya Mehta',
      role: 'Principal, Mehta + Rao Architects',
      city: 'Bengaluru',
    },
    {
      quote: 'We bid through 5Bloc now. Specs, BOQ, drawings — all versioned and in one place. I haven\'t received a \'final_final_v3.dwg\' email in months.',
      name: 'Rohit Shenoy',
      role: 'Director, Shenoy Build Co.',
      city: 'Mumbai',
    },
    {
      quote: 'As a client, I finally understand where my money is going. The portal speaks English, not architect.',
      name: 'Priya Iyer',
      role: 'Homeowner',
      city: 'Pune',
    },
  ]
  return (
    <section className="py-24 sm:py-32 bg-[var(--surface-container-low)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="animate-stitch-reveal">
          <div className="metadata-caps text-[var(--amber)]">
            [ From the field ]
          </div>
          <h2 className="mt-4 max-w-3xl font-display text-4xl sm:text-5xl text-[var(--on-surface)] tracking-tight">
            The practices using 5Bloc,<br />
            <span className="font-editorial italic font-normal text-[var(--on-surface-variant)]">in their own words.</span>
          </h2>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3 animate-stitch-reveal delay-200">
          {quotes.map((q) => (
            <figure key={q.name} className="flex flex-col bg-[var(--surface-container)] p-8 rounded-2xl shadow-1">
              <blockquote className="text-lg leading-relaxed text-[var(--on-surface)] font-editorial font-medium">
                <span className="font-display text-3xl leading-none text-[var(--amber)] mr-2">“</span>
                {q.quote}
              </blockquote>
              <figcaption className="mt-auto pt-8 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center font-display font-bold text-[var(--amber)]">
                  {q.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sm text-[var(--on-surface)]">{q.name}</div>
                  <div className="text-xs text-[var(--on-surface-variant)] mt-0.5">{q.role}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--blue)]">
                    {q.city}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQ() {
  const faqs = [
    {
      q: 'When does the beta open?',
      a: "We onboard 10 practices a week, in cohorts of architects + their teams. Sign up and we'll email you when your slot opens — usually within 2–3 weeks of joining the list.",
    },
    {
      q: 'Who actually pays for 5Bloc?',
      a: 'The architect\'s practice. Builders, contractors, consultants and clients join the projects you invite them to — free, with role-scoped access.',
    },
    {
      q: 'Do we need to migrate our existing projects?',
      a: 'No. Most firms start with one new project, then add older ones as they reach a milestone. Drawings, RFIs and documents import via drag-and-drop.',
    },
    {
      q: 'How is this different from Procore or ACC?',
      a: 'Those are excellent for large GCs. 5Bloc is built for the architect-led project — the kind that runs on WhatsApp today. It\'s lighter, faster to adopt, and priced for Indian and emerging-market practices.',
    },
    {
      q: "Does the AI link with tools like AutoCAD?",
      a: 'Yes, 5Bloc maps straight to Google Drive folders, syncs with WhatsApp site channels, and embeds a fully interactive CAD & Autodesk Fusion 360 viewer directly in the vault.',
    },
    {
      q: 'Does the AI just write fluff?',
      a: 'No. It estimates BOQ line items from a DPR, summarises bye-laws, drafts RFI responses, and answers questions grounded in the project\'s own files. Always editable, always cited.',
    },
  ]
  return (
    <section id="faq" className="py-24 sm:py-32 bg-[var(--surface-canvas)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.6fr]">
          <div className="animate-stitch-reveal">
            <div className="metadata-caps text-[var(--amber)]">
              [ Frequently asked ]
            </div>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl text-[var(--on-surface)] tracking-tight">
              Questions practices ask in the first call.
            </h2>
            <p className="mt-6 text-[var(--on-surface-variant)] text-base">
              Still on the fence? Email{' '}
              <a
                href="mailto:hello@5bloc.com"
                className="text-[var(--primary)] font-medium underline underline-offset-4 hover:text-[var(--amber)] transition-colors"
              >
                hello@5bloc.com
              </a>{' '}
              and we'll set up a 20-minute walkthrough.
            </p>
          </div>
          <dl className="grid gap-4 animate-stitch-reveal delay-200">
            {faqs.map((f) => (
              <div key={f.q} className="bg-[var(--surface-container)] rounded-2xl p-6 sm:p-8 shadow-1">
                <dt className="font-display font-bold text-xl text-[var(--on-surface)] mb-4">{f.q}</dt>
                <dd className="text-base text-[var(--on-surface-variant)] leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

function WaitlistCTA() {
  return (
    <section id="waitlist" className="bg-[var(--surface-canvas)] pb-24 sm:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-ai-gradient p-[1px] animate-stitch-reveal">
          <div className="relative bg-[var(--surface-container-lowest)]/80 backdrop-blur-2xl rounded-[2.5rem] px-6 py-16 sm:px-16 sm:py-24">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--amber)]/10 to-transparent opacity-50 rounded-[2.5rem]"></div>
            
            <div className="relative z-10 grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <div className="metadata-caps text-[var(--blue)]">
                  [ Private beta · invite-only ]
                </div>
                <h2 className="mt-6 font-display text-4xl sm:text-6xl text-[var(--on-surface)] tracking-tight">
                  Bring your next project to 5Bloc.
                </h2>
                <p className="mt-6 max-w-xl text-[var(--on-surface-variant)] text-lg leading-relaxed">
                  Tell us about your practice and we'll line up an onboarding
                  session. First three projects are always free.
                </p>
                <ul className="mt-10 grid gap-4 text-base">
                  {[
                    '10 practices onboarded per week',
                    'Unlimited invited collaborators',
                    'White-glove migration from existing tools',
                    'Direct line to the founding team',
                  ].map((b) => (
                    <li key={b} className="flex items-center gap-3 text-[var(--on-surface)] font-medium">
                      <div className="h-6 w-6 rounded-full bg-[var(--amber)]/20 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-[var(--amber)]" />
                      </div>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl bg-[var(--surface-elevated)] p-2 shadow-2 border border-[var(--surface-container-high)]">
                <WaitlistForm source="cta" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SiteFooter() {
  const cols = [
    {
      title: 'Product',
      links: [
        { href: '#prototype', label: 'Interactive demo' },
        { href: '#pillars', label: 'Why 5Bloc' },
        { href: '#roles', label: 'Stakeholder roles' },
        { href: '#modules', label: 'Product modules' }
      ],
    },
    {
      title: 'Company',
      links: [
        { href: 'mailto:hello@5bloc.com', label: 'Contact sales' },
        { href: '/auth', label: 'Client sign in' },
        { href: '/auth', label: 'Vendor registration' }
      ],
    }
  ]
  return (
    <footer className="border-t border-[var(--surface-container-high)] bg-[var(--surface-container)] text-[var(--on-surface)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-6 max-w-sm text-sm text-[var(--on-surface-variant)] leading-relaxed">
              The operating system for the architecture industry. Built with
              architects, in Bengaluru, Mumbai and Pune.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="metadata-caps text-[var(--on-surface-variant)] opacity-50 mb-6">
                [ {c.title} ]
              </div>
              <ul className="grid gap-4 text-sm font-medium">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[var(--on-surface)] transition-colors hover:text-[var(--primary)] hover:drop-shadow-[0_0_8px_rgba(255,235,213,0.3)]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-[var(--surface-container-high)] pt-8 text-sm text-[var(--on-surface-variant)] sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} 5Bloc Technologies. All rights reserved.</div>
          <div className="metadata-caps opacity-50">
            [ v1.0 · India ]
          </div>
        </div>
      </div>
    </footer>
  )
}
