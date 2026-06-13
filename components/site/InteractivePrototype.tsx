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
          5bloc.app / lotus-residences
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
    { v: 'v12', date: 'Today · 11:24', by: 'Aanya M.', status: 'current',    note: 'Updated window head detail per RFI #042' },
    { v: 'v11', date: 'Yesterday',     by: 'Aanya M.', status: 'superseded', note: 'Toilet plumbing revisions' },
    { v: 'v10', date: '5 Jun',         by: 'Rohit S.', status: 'superseded', note: 'Client markup incorporated' },
    { v: 'v09', date: '1 Jun',         by: 'Aanya M.', status: 'superseded', note: 'Initial GA' },
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
          A-04 · Ground floor plan
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
                  <rect x="206" y="44" width="60" height="14" fill="rgba(245,166,35,0.06)" />
                </g>
              )}
            </g>
            <g fill="rgba(140,190,255,0.65)" fontSize="9" fontFamily="monospace">
              <text x="48"  y="60">LIVING · 24.3 m²</text>
              <text x="208" y="60">KITCHEN · 12.1 m²</text>
              <text x="48"  y="150">BED 01 · 18.7 m²</text>
              <text x="208" y="150">BATH</text>
              <text x="48"  y="220">FOYER</text>
              <text x="208" y="220">BED 02 · 16.4 m²</text>
            </g>
            {active === 0 && (
              <g>
                <circle cx="236" cy="51" r="4" fill="#F5A623" />
                <text x="244" y="54" fill="#F5A623" fontSize="9" fontFamily="monospace">RFI #042 resolved</text>
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
    { from: 'contractor', time: '10:14', body: "Window head detail on A-04 v11 doesn't match the section A-12 v3. Which is binding?" },
    { from: 'system',     time: '10:14', body: 'Linked to A-04 · v11 · grid C4–D4' },
    { from: 'you',        time: '10:36', body: 'A-12 is binding. Section governs over plan. Updating A-04.' },
  ])
  const [draft, setDraft] = useState('')
  const send = () => {
    if (!draft.trim()) return
    setMessages((m) => [...m, { from: 'you', time: 'now', body: draft.trim() }])
    setDraft('')
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { from: 'contractor', time: 'now', body: 'Got it. Proceeding with section detail. Will close RFI on site sign-off.' },
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
              RFI #042 · Open
            </div>
            <div className="mt-0.5 font-semibold text-base" style={{ color: C.txt }}>
              Window head detail conflict — A-04 vs A-12
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
            ['Linked drawing', 'A-04 · v11'],
            ['Grid ref', 'C4–D4'],
            ['Raised by', 'Shenoy Build Co.'],
            ['Assigned', 'Aanya Mehta'],
            ['Cost impact', '₹0 (clarification)'],
            ['SLA', '12h remaining'],
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
    { code: 'CIV-01', desc: 'RCC M25 — slabs & beams',         qty: 84,  unit: 'm³',   rate: 7800,  ai: false },
    { code: 'MAS-01', desc: 'Brick masonry, 230mm',             qty: 312, unit: 'm²',   rate: 1240,  ai: false },
    { code: 'FIN-04', desc: 'Vitrified tile flooring 600×600',  qty: 218, unit: 'm²',   rate: 1850,  ai: false },
  ])
  const [estimating, setEstimating] = useState(false)
  const runAi = () => {
    setEstimating(true)
    setTimeout(() => {
      setItems((it) => [
        ...it,
        { code: 'ELE-02', desc: 'Conduit + wiring, 2BHK loop',            qty: 6,   unit: 'loops', rate: 18400, ai: true },
        { code: 'PLB-03', desc: 'CPVC supply lines incl. fittings',        qty: 312, unit: 'm',     rate: 295,   ai: true },
        { code: 'DOO-01', desc: 'Flush door 35mm, both sides laminate',    qty: 14,  unit: 'no.',   rate: 6450,  ai: true },
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
            BOQ · Lotus Residences · Block A
          </div>
          <div className="mt-0.5 font-semibold text-base" style={{ color: C.txt }}>Draft — based on DPR v2</div>
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
        Rates pulled from Karnataka SOR 2024 · your office rate book overrides where set.
      </div>
    </div>
  )
}

/* ══════════════════ CLIENT PORTAL ══════════════════ */
function ClientDemo() {
  const [approvals, setApprovals] = useState([
    { title: 'Vitrified tile sample — living areas',                    status: 'pending'  as 'pending' | 'approved' },
    { title: 'Variation: extended kitchen island (+₹84,000)',           status: 'pending'  as 'pending' | 'approved' },
    { title: 'Final paint palette — bedrooms',                          status: 'approved' as 'pending' | 'approved' },
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
          <div className="mt-0.5 font-semibold text-lg" style={{ color: C.txt }}>Lotus Residences · Unit A-04</div>
        </div>

        <div className="grid gap-3 pt-4">
          {/* Phase card */}
          <div
            className="rounded-xl p-4"
            style={{ background: C.mid, boxShadow: `inset 0 0 0 1px ${C.border}` }}
          >
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: C.txtDim }}>Phase</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: C.amber }}>62% · on track</div>
            </div>
            <div className="mt-2 font-medium text-base" style={{ color: C.txt }}>Interior finishing</div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full"
              style={{ background: C.raised }}
            >
              <div className="h-full rounded-full" style={{ width: '62%', background: C.amber }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              {[['Started', '12 Jan'], ['Handover', '28 Sep'], ['Next milestone', 'Floor polish']].map(([k, v]) => (
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
            <div className="mt-1 font-semibold text-2xl" style={{ color: C.txt }}>₹ 4,20,000</div>
            <div className="mt-0.5 text-xs" style={{ color: C.txtDim }}>Due on floor polish completion · est. 14 Jun</div>
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
