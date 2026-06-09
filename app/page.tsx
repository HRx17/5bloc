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
    <div className="landing font-sans h-full min-h-screen overflow-y-auto bg-[#FAFAF8] text-[#1a1714]">
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
  const a = '#F5A623'
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className="shrink-0" aria-hidden>
      {[10, 20, 30].flatMap((x) => [10, 20, 30].map((y) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill={a} opacity="0.18" />
      )))}
      <rect x="6" y="6" width="28" height="6" rx="1.5" fill={a} />
      <rect x="6" y="15" width="22" height="6" rx="1.5" fill={a} opacity="0.75" />
      <rect x="6" y="24" width="16" height="6" rx="1.5" fill={a} opacity="0.5" />
      <rect x="6" y="33" width="10" height="5" rx="1.5" fill={a} opacity="0.28" />
    </svg>
  )
}

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <LogoMark size={28} />
      <span className="font-mono text-lg font-bold tracking-[0.04em]">
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
    <header className="sticky top-0 z-40 border-b border-[rgba(26,23,20,0.1)] bg-[#FAFAF8]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-7 text-sm font-medium text-[#6b5e50] md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="transition-colors hover:text-[#1a1714]">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/auth" className="text-sm font-medium text-[#6b5e50] hover:text-[#1a1714]">
            Sign In
          </Link>
          <a
            href="#waitlist"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[#F5A623] px-4 text-xs font-semibold text-white hover:bg-[#ffb94a]"
          >
            Join waitlist
          </a>
        </div>

        <button
          className="grid h-9 w-9 place-items-center rounded-md border border-[rgba(26,23,20,0.1)] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-[rgba(26,23,20,0.1)] bg-[#FAFAF8] md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <nav className="grid gap-1 text-sm font-medium">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-[#6b5e50] hover:bg-[#f5f2ee] hover:text-[#1a1714]"
                >
                  {n.label}
                </Link>
              ))}
              <Link
                href="/auth"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-[#6b5e50] hover:bg-[#f5f2ee] hover:text-[#1a1714]"
              >
                Sign In
              </Link>
              <div className="mt-2">
                <a
                  href="#waitlist"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#F5A623] text-sm font-semibold text-white hover:bg-[#ffb94a]"
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
    <section className="relative overflow-hidden border-b border-[rgba(26,23,20,0.1)]">
      <div className="absolute inset-0 paper-grid opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(26,23,20,0.1)] bg-white px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#6b5e50]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2B7FFF]" />
            Private beta · India + US · Onboarding 10 practices / week
          </div>
          <h1 className="mt-6 text-5xl leading-[1.02] sm:text-6xl lg:text-[68px]">
            The operating system{' '}
            <span className="italic text-[#6b5e50]">for the</span>{' '}
            architecture office.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[#6b5e50]">
            5Bloc replaces WhatsApp, Excel and email with a structured workspace
            built for AEC. Drawings have real version history. RFIs land in the
            right thread. Contractors bid where you already work.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <WaitlistForm compact source="hero" />
            <a
              href="#prototype"
              className="inline-flex items-center gap-1 text-sm text-[#6b5e50] transition-colors hover:text-[#1a1714]"
            >
              or try the live demo <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-6 border-t border-[rgba(26,23,20,0.1)] pt-8">
            {[
              ['$11.3B', 'AEC software market'],
              ['122,769', 'Registered architects in India'],
              ['5–8', 'Disconnected tools per firm'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="text-2xl font-bold font-mono text-[#1a1714]">{n}</div>
                <div className="mt-1 text-xs text-[#6b5e50]">{l}</div>
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
    <section className="border-b border-[rgba(26,23,20,0.1)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-y-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#6b5e50]">
            Built with practices in
          </div>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-2 text-lg font-bold text-[#1a1714]/70">
            <span>Bengaluru</span>
            <span>Mumbai</span>
            <span>Ahmedabad</span>
            <span>Pune</span>
            <span>NYC</span>
            <span>Austin</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function PrototypeSection() {
  return (
    <section id="prototype" className="border-b border-[rgba(26,23,20,0.1)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#2B7FFF]">
              Try it · no signup
            </div>
            <h2 className="mt-3 text-3xl sm:text-4xl text-[#1a1714]">
              A working slice of 5Bloc, right here.
            </h2>
            <p className="mt-4 text-[#6b5e50]">
              Click between modules. Browse drawing versions, reply to an RFI,
              ask AI to estimate missing BOQ lines, approve a sample as the
              client. Nothing is saved — it's just to show you the shape.
            </p>
          </div>
          <a
            href="#waitlist"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#1a1714] hover:text-[#2B7FFF]"
          >
            Like what you see? Join the waitlist <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="mt-10">
          <InteractivePrototype />
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
    <section id="pillars" className="border-b border-[rgba(26,23,20,0.1)] bg-[#FAFAF8]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#2B7FFF]">
              Why 5Bloc
            </div>
            <h2 className="mt-3 text-3xl sm:text-4xl text-[#1a1714]">
              Architecture deserves better than a group chat.
            </h2>
            <p className="mt-4 text-[#6b5e50]">
              98% of Indian projects miss quality standards. Most run on WhatsApp,
              Excel and Gmail. 5Bloc gives every stakeholder one place to do
              their job — without learning new software.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-[rgba(26,23,20,0.1)] bg-[rgba(26,23,20,0.08)] sm:grid-cols-2">
            {items.map((p) => (
              <div key={p.title} className="bg-white p-6">
                <p.icon className="h-5 w-5 text-[#2B7FFF]" />
                <div className="mt-4 font-semibold text-lg text-[#1a1714]">{p.title}</div>
                <p className="mt-1.5 text-sm text-[#6b5e50]">{p.body}</p>
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
    { icon: Compass, title: 'Architect', tagline: 'Run the office. Lead the design. One workspace.', price: '₹2,999–7,999 / mo' },
    { icon: HardHat, title: 'Contractor', tagline: 'Win work. Submit cleanly. Get paid faster.', price: 'Free / ₹999 verified' },
    { icon: Building2, title: 'Builder / Developer', tagline: 'All your projects, all your architects. One feed.', price: 'Free · Invited' },
    { icon: Wrench, title: 'Consultant', tagline: 'Discipline-scoped collaboration without chaos.', price: 'Free · Invited' },
    { icon: UserRound, title: 'Client', tagline: "Know what's happening — without learning software.", price: 'Free · Invited' }
  ]
  return (
    <section id="roles" className="border-b border-[rgba(26,23,20,0.1)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#2B7FFF]">
            Five roles · one project
          </div>
          <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl text-[#1a1714]">
            Architect pays. Everyone else joins free.
          </h2>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-[rgba(26,23,20,0.1)] bg-[rgba(26,23,20,0.08)] md:grid-cols-5">
          {list.map((r) => (
            <div key={r.title} className="flex flex-col bg-white p-6 min-h-[180px]">
              <r.icon className="h-5 w-5 text-[#2B7FFF]" />
              <div className="mt-4 font-semibold text-lg text-[#1a1714]">{r.title}</div>
              <div className="mt-1.5 text-xs text-[#6b5e50]">{r.tagline}</div>
              <div className="mt-auto pt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]/80">
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
    <section id="modules" className="border-b border-[rgba(26,23,20,0.1)] bg-[#FAFAF8]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#2B7FFF]">
          12 modules
        </div>
        <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl text-[#1a1714]">
          Every tool an office needs. None of the swivel-chair.
        </h2>

        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-[rgba(26,23,20,0.1)] bg-[rgba(26,23,20,0.08)] md:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => (
            <div key={m.label} className="bg-white p-6">
              <div className="flex items-baseline justify-between">
                <div className="font-semibold text-lg text-[#1a1714]">{m.label}</div>
                <div className="font-mono text-[10px] text-[#6b5e50]">
                  {String(i + 1).padStart(2, '0')}
                </div>
              </div>
              <p className="mt-2 text-sm text-[#6b5e50]">{m.desc}</p>
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
    <section className="border-b border-[rgba(26,23,20,0.1)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#2B7FFF]">
          From brief to handover
        </div>
        <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl text-[#1a1714]">
          One thread for the whole project lifecycle.
        </h2>
        <ol className="mt-10 grid gap-px overflow-hidden rounded-xl border border-[rgba(26,23,20,0.1)] bg-[rgba(26,23,20,0.08)] md:grid-cols-5">
          {steps.map(([n, t, d]) => (
            <li key={n} className="flex flex-col bg-white p-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#2B7FFF]">
                Step {n}
              </div>
              <div className="mt-2 font-semibold text-lg text-[#1a1714]">{t}</div>
              <div className="mt-1 text-sm text-[#6b5e50]">{d}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Testimonials() {
  const quotes = [
    {
      quote:
        'Three projects in, my WhatsApp groups have gone quiet. RFIs land where the drawing lives, and the client portal has eliminated half my evening calls.',
      name: 'Aanya Mehta',
      role: 'Principal, Mehta + Rao Architects',
      city: 'Bengaluru',
    },
    {
      quote:
        'We bid through 5Bloc now. Specs, BOQ, drawings — all versioned and in one place. I haven\'t received a \'final_final_v3.dwg\' email in months.',
      name: 'Rohit Shenoy',
      role: 'Director, Shenoy Build Co.',
      city: 'Mumbai',
    },
    {
      quote:
        'As a client, I finally understand where my money is going. The portal speaks English, not architect.',
      name: 'Priya Iyer',
      role: 'Homeowner',
      city: 'Pune',
    },
  ]
  return (
    <section className="border-b border-[rgba(26,23,20,0.1)] bg-[#FAFAF8]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#2B7FFF]">
          From the field
        </div>
        <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl text-[#1a1714]">
          The practices using 5Bloc, in their own words.
        </h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-[rgba(26,23,20,0.1)] bg-[rgba(26,23,20,0.08)] md:grid-cols-3">
          {quotes.map((q) => (
            <figure key={q.name} className="flex flex-col bg-white p-7">
              <blockquote className="text-base leading-relaxed text-[#1a1714]">
                <span className="font-serif text-3xl leading-none text-[#2B7FFF] mr-1">“</span>
                {q.quote}
              </blockquote>
              <figcaption className="mt-auto border-t border-[rgba(26,23,20,0.1)] pt-4">
                <div className="font-semibold text-[#1a1714]">{q.name}</div>
                <div className="text-xs text-[#6b5e50]">{q.role}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]/70">
                  {q.city}
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
      q: 'How is this different from Procore or Autodesk Construction Cloud?',
      a: 'Those are excellent for large GCs. 5Bloc is built for the architect-led project — the kind that runs on WhatsApp today. It\'s lighter, faster to adopt, and priced for Indian and emerging-market practices.',
    },
    {
      q: "Does the AI link with tools like AutoCAD and Google Docs?",
      a: 'Yes, 5Bloc maps straight to Google Drive folders, syncs with WhatsApp site channels, and embeds a fully interactive CAD & Autodesk Fusion 360 viewer for DWG/DXF files directly in the vault.',
    },
    {
      q: 'Does the AI just write fluff?',
      a: 'No. It estimates BOQ line items from a DPR, summarises bye-laws, drafts RFI responses, and answers questions grounded in the project\'s own files. Always editable, always cited.',
    },
  ]
  return (
    <section id="faq" className="border-b border-[rgba(26,23,20,0.1)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#2B7FFF]">
              Frequently asked
            </div>
            <h2 className="mt-3 text-3xl sm:text-4xl text-[#1a1714]">
              The questions practices ask in the first call.
            </h2>
            <p className="mt-4 text-[#6b5e50] text-sm">
              Still on the fence? Email{' '}
              <a
                href="mailto:hello@5bloc.com"
                className="text-[#1a1714] underline underline-offset-4 hover:text-[#2B7FFF]"
              >
                hello@5bloc.com
              </a>{' '}
              and we'll set up a 20-minute walkthrough.
            </p>
          </div>
          <dl className="divide-y divide-[rgba(26,23,20,0.1)] border-y border-[rgba(26,23,20,0.1)]">
            {faqs.map((f) => (
              <div key={f.q} className="grid gap-2 py-6 sm:grid-cols-[auto_1fr] sm:gap-8">
                <dt className="text-base font-semibold text-[#1a1714] sm:max-w-[260px]">{f.q}</dt>
                <dd className="text-sm text-[#6b5e50]">{f.a}</dd>
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
    <section id="waitlist" className="bg-[#FAFAF8]">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#F5A623] px-6 py-14 text-white sm:px-12 sm:py-16">
          <div className="absolute inset-0 paper-grid opacity-[0.06]" aria-hidden />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-16">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/80">
                Private beta · invite-only
              </div>
              <h2 className="mt-3 text-3xl sm:text-5xl text-white">
                Bring your next project to 5Bloc.
              </h2>
              <p className="mt-4 max-w-xl text-white/90 text-sm leading-relaxed">
                Tell us about your practice and we'll line up an onboarding
                session. First three projects are always free.
              </p>
              <ul className="mt-8 grid gap-2.5 text-sm">
                {[
                  '10 practices onboarded per week',
                  'Unlimited invited collaborators',
                  'White-glove migration from your existing tools',
                  'Direct line to the founding team on WhatsApp',
                ].map((b) => (
                  <li key={b} className="flex items-center gap-2 text-white">
                    <Check className="h-4 w-4 text-[#2B7FFF]" /> {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-1">
              <WaitlistForm source="cta" />
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
    <footer className="border-t border-[rgba(26,23,20,0.1)] bg-white text-[#1a1714]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-sm text-sm text-[#6b5e50]">
              The operating system for the architecture industry. Built with
              architects, in Bengaluru, Mumbai and Pune.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6b5e50]">
                {c.title}
              </div>
              <ul className="mt-4 grid gap-2 text-sm font-medium">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[#6b5e50] transition-colors hover:text-[#2B7FFF]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-[rgba(26,23,20,0.1)] pt-6 text-xs text-[#6b5e50] sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} 5Bloc Technologies. All rights reserved.</div>
          <div className="font-mono uppercase tracking-[0.18em]">
            v1.0 · India
          </div>
        </div>
      </div>
    </footer>
  )
}
