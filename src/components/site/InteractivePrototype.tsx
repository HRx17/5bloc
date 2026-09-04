'use client'

import { useState } from 'react'
import {
  ChevronRight,
  FileText,
  Layers,
  MessagesSquare,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
  Send,
  Image as ImageIcon,
} from 'lucide-react'

type TabKey = 'drawings' | 'rfi' | 'boq' | 'client'

/* ── Dim dark palette ── */
const C = {
  base:    '#0b0c10',   // deepest bg
  mid:     '#13151a',   // panel bg
  raised:  '#1a1d24',   // card / sidebar
  hover:   '#1f2330',   // hover state
  border:  'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.10)',
  txt:     '#d8d3cc',   // primary text
  txtDim:  '#6e6660',   // secondary/muted
  amber:   '#F5A623',
  amberDim:'rgba(245,166,35,0.12)',
  blue:    'rgba(80,140,255,0.10)',
  success: '#2ECC8A',
}

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'drawings', label: 'Drawings', icon: Layers },
  { key: 'rfi',      label: 'RFIs',     icon: MessagesSquare },
  { key: 'boq',      label: 'BOQ + AI', icon: Sparkles },
  { key: 'client',   label: 'Client portal', icon: FileText },
]

function cn(...inputs: any[]) { return inputs.filter(Boolean).join(' ') }

export function InteractivePrototype() {
  const [tab, setTab] = useState<TabKey>('drawings')
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        background: C.base,
        boxShadow: '0 40px 100px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
        color: C.txt,
      }}
    >
      {/* Window chrome */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
        style={{ background: C.raised, boxShadow: `0 1px 0 ${C.border}` }}
      >
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }} />
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: C.txtDim }}>
          5bloc.app / kapoor-villa-juhu
        </div>
        <div className="font-mono text-[11px]" style={{ color: C.amber }}>demo</div>
      </div>

      {/* Tab bar */}
      <div
        className="flex flex-wrap gap-1 px-2 py-2"
        style={{ background: C.mid, boxShadow: `0 1px 0 ${C.border}` }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
            style={{
              background: tab === t.key ? C.raised : 'transparent',
              color: tab === t.key ? C.txt : C.txtDim,
              boxShadow: tab === t.key ? `inset 0 0 0 1px ${C.border}, 0 1px 4px rgba(0,0,0,0.3)` : 'none',
            }}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[460px]" style={{ background: C.base }}>
        {tab === 'drawings' && <DrawingsDemo />}
        {tab === 'rfi'      && <RfiDemo />}
        {tab === 'boq'      && <BoqDemo />}
        {tab === 'client'   && <ClientDemo />}
      </div>

      {/* Footer bar */}
      <div
        className="px-4 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ background: C.raised, boxShadow: `0 -1px 0 ${C.border}`, color: C.txtDim }}
      >
        Live demo · no data is saved · click around
      </div>
    </div>
  )
}

/* ══════════════════ DRAWINGS ══════════════════ */
function DrawingsDemo() {
  const versions = [
    { v: 'v14', date: 'Today · 09:41',  by: 'Priya N.',  status: 'current',    note: 'Staircase landing width corrected per RFI #061 — NBC clause 4.3.2' },
    { v: 'v13', date: 'Yesterday',      by: 'Priya N.',  status: 'superseded', note: 'Structural consultant markup — column C7 shifted 150mm' },
    { v: 'v12', date: '9 Jun',          by: 'Dev R.',    status: 'superseded', note: 'Client-approved toilet layout revision, master bath' },
    { v: 'v11', date: '4 Jun',          by: 'Priya N.',  status: 'superseded', note: 'Initial issued-for-tender GA' },
  ]
  const [active, setActive] = useState(0)
  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside style={{ boxShadow: `inset -1px 0 0 ${C.border}`, background: C.mid }}>
        <div
          className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: C.txtDim, boxShadow: `0 1px 0 ${C.border}` }}
        >
          A-07 · First floor plan · 1:100
        </div>
        <ol>
          {versions.map((v, i) => (
            <li key={v.v}>
              <button
                onClick={() => setActive(i)}
                className="block w-full px-4 py-3 text-left transition-colors"
                style={{
                  background: active === i ? C.raised : 'transparent',
                  boxShadow: `0 1px 0 ${C.border}`,
                }}
                onMouseEnter={(e) => { if (active !== i) (e.currentTarget as HTMLElement).style.background = C.hover }}
                onMouseLeave={(e) => { if (active !== i) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm" style={{ color: C.txt }}>{v.v}</span>
                  <span
                    className="font-mono text-[9px] uppercase tracking-[0.18em]"
                    style={{ color: v.status === 'current' ? C.amber : C.txtDim }}
                  >
                    {v.status}
                  </span>
                </div>
                <div className="mt-0.5 text-xs" style={{ color: C.txtDim }}>{v.date} · {v.by}</div>
                <div className="mt-1 text-xs" style={{ color: C.txt }}>{v.note}</div>
              </button>
            </li>
          ))}
        </ol>
      </aside>

      {/* Blueprint viewer */}
      <div className="flex flex-col" style={{ background: C.base }}>
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ boxShadow: `0 1px 0 ${C.border}` }}
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: C.txtDim }}>
            Viewing {versions[active].v} · {versions[active].by}
          </div>
          <div className="flex gap-1">
            {['Compare', 'Approve'].map((label) => (
              <button
                key={label}
                className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                style={{ background: C.raised, color: C.txt, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = C.hover)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = C.raised)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Blueprint canvas */}
        <div
          className="relative h-72"
          style={{
            background: 'linear-gradient(135deg, #080c18 0%, #0a0f20 50%, #08111e 100%)',
            backgroundImage: 'radial-gradient(rgba(80,140,255,0.07) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
            <g fill="none" stroke="rgba(100,160,255,0.55)" strokeWidth="1">
              <rect x="40" y="40" width="320" height="220" />
              <line x1="40"  y1="130" x2="360" y2="130" />
              <line x1="200" y1="40"  x2="200" y2="260" />
              <line x1="40"  y1="200" x2="200" y2="200" />
              <line x1="280" y1="130" x2="280" y2="260" />
              <circle cx="80" cy="170" r="12" />
              <path d="M40 70 L70 70 A20 20 0 0 1 70 90 L40 90" />
              {active === 0 && (
                <g stroke="#F5A623" strokeWidth="1.5">
                  <rect x="40" y="180" width="80" height="20" fill="rgba(245,166,35,0.06)" />
                </g>
              )}
            </g>
            <g fill="rgba(140,190,255,0.65)" fontSize="9" fontFamily="monospace">
              <text x="48"  y="60">MASTER BED · 22.8 m²</text>
              <text x="208" y="60">DRESSING · 8.4 m²</text>
              <text x="48"  y="150">BED 02 · 17.2 m²</text>
              <text x="208" y="150">BATH · EN-SUITE</text>
              <text x="48"  y="220">PASSAGE</text>
              <text x="208" y="220">BED 03 · 15.6 m²</text>
            </g>
            {active === 0 && (
              <g>
                <circle cx="80" cy="190" r="4" fill="#F5A623" />
                <text x="88" y="193" fill="#F5A623" fontSize="9" fontFamily="monospace">RFI #061 resolved</text>
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════ RFI ══════════════════ */
type Message = { from: 'you' | 'contractor' | 'system'; body: string; time: string }

function RfiDemo() {
  const [messages, setMessages] = useState<Message[]>([
    { from: 'contractor', time: '08:52', body: "Staircase landing on A-07 v13 shows 900mm clear width but NBC Table 4.3.2 requires 1050mm min for residential above G+2. Which should we proceed with?" },
    { from: 'system',     time: '08:52', body: 'Linked to A-07 · v13 · staircase at grid D5–D6' },
    { from: 'you',        time: '09:18', body: 'Correct — NBC governs. Revising landing to 1100mm with a 50mm tolerance buffer. Updated in v14. Please hold wall marking until new drawing is issued.' },
  ])
  const [draft, setDraft] = useState('')
  const send = () => {
    if (!draft.trim()) return
    setMessages((m) => [...m, { from: 'you', time: 'now', body: draft.trim() }])
    setDraft('')
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { from: 'contractor', time: 'now', body: 'Understood. Holding wall marking. Will update setting-out once v14 is received. Can you share the revised staircase detail sheet separately?' },
      ])
    }, 700)
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">
      <div className="flex flex-col" style={{ boxShadow: `inset -1px 0 0 ${C.border}` }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ boxShadow: `0 1px 0 ${C.border}` }}
        >
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: C.amber }}>
              RFI #061 · Resolved
            </div>
            <div className="mt-0.5 font-semibold text-base" style={{ color: C.txt }}>
              Staircase landing width — NBC compliance, A-07
            </div>
          </div>
          <button
            className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
            style={{ background: C.raised, color: C.txt, boxShadow: `inset 0 0 0 1px ${C.border}` }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = C.hover)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = C.raised)}
          >
            Mark resolved
          </button>
        </div>

        {/* Message thread */}
        <div
          className="grow flex flex-col justify-end p-4 h-[300px] overflow-y-auto space-y-3"
          style={{ background: C.mid }}
        >
          {messages.map((m, i) => (
            <Bubble key={i} msg={m} />
          ))}
        </div>

        {/* Reply box */}
        <div className="p-3" style={{ background: C.raised, boxShadow: `0 -1px 0 ${C.border}` }}>
          <div
            className="flex items-end gap-2 rounded-xl p-2"
            style={{ background: C.base, boxShadow: `inset 0 0 0 1px ${C.border}` }}
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              rows={1}
              placeholder="Reply… (Enter to send)"
              className="grow resize-none bg-transparent text-sm outline-none"
              style={{ color: C.txt }}
            />
            <button
              onClick={send}
              className="grid h-8 w-8 place-items-center rounded-lg transition-colors"
              style={{ background: C.amber }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            >
              <Send className="h-3.5 w-3.5 text-black" />
            </button>
          </div>
        </div>
      </div>

      {/* Context sidebar */}
      <aside className="p-4" style={{ background: C.mid }}>
        <div
          className="pb-2 font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: C.txtDim, boxShadow: `0 1px 0 ${C.border}` }}
        >
          Context
        </div>
        <dl className="grid gap-3 pt-3 text-xs">
          {[
            ['Linked drawing', 'A-07 · v13'],
            ['Grid ref', 'D5–D6'],
            ['Raised by', 'Mehta Constructions'],
            ['Assigned', 'Priya Nair'],
            ['Cost impact', '₹0 (code compliance)'],
            ['Closed', 'Today · 09:41'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <dt style={{ color: C.txtDim }}>{k}</dt>
              <dd className="font-medium text-right" style={{ color: C.txt }}>{v}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  )
}

function Bubble({ msg }: { msg: Message }) {
  if (msg.from === 'system') {
    return (
      <div
        className="mx-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ background: C.raised, color: C.txtDim, boxShadow: `inset 0 0 0 1px ${C.border}` }}
      >
        <ImageIcon className="h-3 w-3" /> {msg.body}
      </div>
    )
  }
  const mine = msg.from === 'you'
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className="max-w-[80%] rounded-2xl px-3.5 py-2 text-sm"
        style={{
          background: mine ? C.amber : C.raised,
          color: mine ? '#0d0a00' : C.txt,
          boxShadow: mine ? 'none' : `inset 0 0 0 1px ${C.border}`,
        }}
      >
        <div
          className="font-mono text-[9px] uppercase tracking-[0.18em]"
          style={{ color: mine ? 'rgba(13,10,0,0.55)' : C.txtDim }}
        >
          {mine ? 'You' : 'Shenoy Build Co.'} · {msg.time}
        </div>
        <div className="mt-0.5">{msg.body}</div>
      </div>
    </div>
  )
}

/* ══════════════════ BOQ ══════════════════ */
function BoqDemo() {
  const [items, setItems] = useState([
    { code: 'STR-01', desc: 'RCC M30 — slabs, beams & columns',             qty: 112, unit: 'm³',  rate: 8600,  ai: false },
    { code: 'MAS-01', desc: 'AAC block masonry 200mm, 5th storey',          qty: 284, unit: 'm²',  rate: 1480,  ai: false },
    { code: 'FIN-07', desc: 'Italian marble flooring 800×800, living areas',qty: 186, unit: 'm²',  rate: 4200,  ai: false },
    { code: 'PLB-01', desc: 'CP fittings — Kohler Stile series, bathrooms', qty: 4,   unit: 'sets',rate: 38500, ai: false },
  ])
  const [estimating, setEstimating] = useState(false)
  const runAi = () => {
    setEstimating(true)
    setTimeout(() => {
      setItems((it) => [
        ...it,
        { code: 'ELE-03', desc: 'Concealed conduit + Havells wiring, 4BHK',  qty: 8,   unit: 'loops',rate: 22400, ai: true },
        { code: 'FIN-12', desc: 'False ceiling — gypsum grid with cove light', qty: 284, unit: 'm²',  rate: 680,   ai: true },
        { code: 'DOO-02', desc: 'Veneer flush door 40mm, fire-rated staircase',qty: 6,   unit: 'no.', rate: 14800, ai: true },
      ])
      setEstimating(false)
    }, 900)
  }
  const total = items.reduce((s, i) => s + i.qty * i.rate, 0)
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ boxShadow: `0 1px 0 ${C.border}` }}
      >
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: C.amber }}>
            BOQ · Kapoor Villa · Juhu · Floors 3–5
          </div>
          <div className="mt-0.5 font-semibold text-base" style={{ color: C.txt }}>Draft — based on DPR v3 · interiors scope</div>
        </div>
        <button
          onClick={runAi}
          disabled={estimating}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50"
          style={{ background: C.raised, color: C.txt, boxShadow: `inset 0 0 0 1px ${C.border}` }}
          onMouseEnter={(e) => { if (!estimating) (e.currentTarget as HTMLElement).style.background = C.hover }}
          onMouseLeave={(e) => { if (!estimating) (e.currentTarget as HTMLElement).style.background = C.raised }}
        >
          <Sparkles className="h-3.5 w-3.5" style={{ color: C.amber }} />
          {estimating ? 'Estimating…' : 'AI estimate missing lines'}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ background: C.mid }}>
            <tr>
              {['Code', 'Description', 'Qty', 'Unit', 'Rate (₹)', 'Amount (₹)'].map((h, i) => (
                <th
                  key={h}
                  className={cn('px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-left', i >= 2 && 'text-right')}
                  style={{ color: C.txtDim }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr
                key={it.code}
                style={{ boxShadow: `inset 0 1px 0 ${C.border}`, background: it.ai ? 'rgba(167,139,250,0.04)' : 'transparent' }}
              >
                <td className="px-4 py-2.5 font-mono text-xs" style={{ color: C.txtDim }}>{it.code}</td>
                <td className="px-4 py-2.5" style={{ color: C.txt }}>
                  {it.desc}
                  {it.ai && (
                    <span
                      className="ml-2 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em]"
                      style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}
                    >
                      <Sparkles className="h-2.5 w-2.5" /> AI
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: C.txt }}>{it.qty}</td>
                <td className="px-4 py-2.5" style={{ color: C.txtDim }}>{it.unit}</td>
                <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: C.txt }}>{it.rate.toLocaleString('en-IN')}</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-medium" style={{ color: C.txt }}>{(it.qty * it.rate).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: C.mid, boxShadow: `inset 0 1px 0 ${C.border}` }}>
              <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: C.txtDim }} colSpan={5}>
                Subtotal
              </td>
              <td className="px-4 py-3 text-right font-semibold text-base tabular-nums" style={{ color: C.txt }}>
                ₹ {total.toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div
        className="px-4 py-2.5 text-xs"
        style={{ background: C.mid, boxShadow: `inset 0 1px 0 ${C.border}`, color: C.txtDim }}
      >
        Rates from Maharashtra SOR 2024–25 · office rate book overrides applied for Italian marble &amp; CP fittings.
      </div>
    </div>
  )
}

/* ══════════════════ CLIENT PORTAL ══════════════════ */
function ClientDemo() {
  const [approvals, setApprovals] = useState([
    { title: 'Italian marble sample — Statuario Bianco, living & dining',  status: 'pending'  as 'pending' | 'approved' },
    { title: 'Variation order #3 — home theatre acoustic wall (+₹2,18,000)', status: 'pending'  as 'pending' | 'approved' },
    { title: 'CP fittings selection — Kohler Stile Matt Black, all baths',  status: 'approved' as 'pending' | 'approved' },
  ])
  const approve = (i: number) =>
    setApprovals((a) => a.map((x, idx) => (idx === i ? { ...x, status: 'approved' } : x)))

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr]">
      {/* Left — progress */}
      <section className="p-4" style={{ boxShadow: `inset -1px 0 0 ${C.border}` }}>
        <div className="pb-3" style={{ boxShadow: `0 1px 0 ${C.border}` }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: C.amber }}>
            Your home, this week
          </div>
          <div className="mt-0.5 font-semibold text-lg" style={{ color: C.txt }}>Kapoor Villa · Juhu Tara Road</div>
        </div>

        <div className="grid gap-3 pt-4">
          {/* Phase card */}
          <div
            className="rounded-xl p-4"
            style={{ background: C.mid, boxShadow: `inset 0 0 0 1px ${C.border}` }}
          >
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: C.txtDim }}>Phase</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: C.amber }}>67% · on track</div>
            </div>
            <div className="mt-2 font-medium text-base" style={{ color: C.txt }}>Finishing & MEP rough-in</div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full"
              style={{ background: C.raised }}
            >
              <div className="h-full rounded-full" style={{ width: '67%', background: C.amber }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              {[['Started', '3 Feb'], ['Handover', '15 Nov'], ['Next milestone', 'False ceiling']].map(([k, v]) => (
                <div key={k}>
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: C.txtDim }}>{k}</div>
                  <div className="mt-0.5 font-medium" style={{ color: C.txt }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment card */}
          <div
            className="rounded-xl p-4"
            style={{ background: C.mid, boxShadow: `inset 0 0 0 1px ${C.border}` }}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: C.txtDim }}>Next payment</div>
            <div className="mt-1 font-semibold text-2xl" style={{ color: C.txt }}>₹ 18,50,000</div>
            <div className="mt-0.5 text-xs" style={{ color: C.txtDim }}>Due on false ceiling completion · est. 28 Jun</div>
            <button
              className="mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ background: C.raised, color: C.txt, boxShadow: `inset 0 0 0 1px ${C.border}` }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = C.hover)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = C.raised)}
            >
              View schedule <ChevronRight className="h-3 w-3 ml-0.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Right — approvals */}
      <section className="p-4">
        <div
          className="pb-3 font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: C.txtDim, boxShadow: `0 1px 0 ${C.border}` }}
        >
          Waiting on you
        </div>
        <ul>
          {approvals.map((a, i) => (
            <li
              key={a.title}
              className="flex items-start gap-3 py-3"
              style={i > 0 ? { boxShadow: `inset 0 1px 0 ${C.border}` } : {}}
            >
              <button
                onClick={() => approve(i)}
                className="mt-0.5 transition-colors"
                style={{ color: a.status === 'approved' ? C.success : C.txtDim }}
                aria-label="Approve"
                disabled={a.status === 'approved'}
                onMouseEnter={(e) => { if (a.status !== 'approved') (e.currentTarget as HTMLElement).style.color = C.amber }}
                onMouseLeave={(e) => { if (a.status !== 'approved') (e.currentTarget as HTMLElement).style.color = C.txtDim }}
              >
                {a.status === 'approved'
                  ? <CheckCircle2 className="h-5 w-5" />
                  : <Circle className="h-5 w-5" />}
              </button>
              <div className="flex-1">
                <div
                  className="text-sm font-medium"
                  style={{ color: a.status === 'approved' ? C.txtDim : C.txt, textDecoration: a.status === 'approved' ? 'line-through' : 'none' }}
                >
                  {a.title}
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: C.txtDim }}>
                  {a.status === 'approved' ? 'Approved · just now' : 'Tap to approve'}
                </div>
              </div>
            </li>
          ))}
          <li
            className="flex items-center gap-2 py-3 text-xs"
            style={{ color: C.txtDim, boxShadow: `inset 0 1px 0 ${C.border}` }}
          >
            <Plus className="h-3.5 w-3.5" /> Your architect will add items here as they come up.
          </li>
        </ul>
      </section>
    </div>
  )
}
