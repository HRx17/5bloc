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

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'drawings', label: 'Drawings', icon: Layers },
  { key: 'rfi', label: 'RFIs', icon: MessagesSquare },
  { key: 'boq', label: 'BOQ + AI', icon: Sparkles },
  { key: 'client', label: 'Client portal', icon: FileText },
]

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}

export function InteractivePrototype() {
  const [tab, setTab] = useState<TabKey>('drawings')
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(26,23,20,0.1)] bg-white shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] text-[#1a1714]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(26,23,20,0.1)] bg-[#f5f2ee] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#6b5e50]/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#6b5e50]/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#6b5e50]/30" />
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6b5e50]">
          5bloc.app / lotus-residences
        </div>
        <div className="font-mono text-[11px] text-[#2B7FFF]">demo</div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-[rgba(26,23,20,0.1)] bg-[#f5f2ee]/60 px-2 py-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              tab === t.key
                ? 'bg-white text-[#1a1714] shadow-sm ring-1 ring-[rgba(26,23,20,0.1)]'
                : 'text-[#6b5e50] hover:text-[#1a1714]'
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-[460px] bg-white">
        {tab === 'drawings' && <DrawingsDemo />}
        {tab === 'rfi' && <RfiDemo />}
        {tab === 'boq' && <BoqDemo />}
        {tab === 'client' && <ClientDemo />}
      </div>

      <div className="border-t border-[rgba(26,23,20,0.1)] bg-[#f5f2ee] px-4 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]">
        Live demo · no data is saved · click around
      </div>
    </div>
  )
}

/* ============== DRAWINGS ============== */

function DrawingsDemo() {
  const versions = [
    { v: 'v12', date: 'Today · 11:24', by: 'Aanya M.', status: 'current', note: 'Updated window head detail per RFI #042' },
    { v: 'v11', date: 'Yesterday', by: 'Aanya M.', status: 'superseded', note: 'Toilet plumbing revisions' },
    { v: 'v10', date: '5 Jun', by: 'Rohit S.', status: 'superseded', note: 'Client markup incorporated' },
    { v: 'v09', date: '1 Jun', by: 'Aanya M.', status: 'superseded', note: 'Initial GA' },
  ]
  const [active, setActive] = useState(0)
  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="border-b border-[rgba(26,23,20,0.1)] md:border-b-0 md:border-r">
        <div className="border-b border-[rgba(26,23,20,0.1)] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]">
          A-04 · Ground floor plan
        </div>
        <ol>
          {versions.map((v, i) => (
            <li key={v.v}>
              <button
                onClick={() => setActive(i)}
                className={cn(
                  'block w-full border-b border-[rgba(26,23,20,0.1)] px-4 py-3 text-left transition-colors hover:bg-[#f5f2ee]',
                  active === i && 'bg-[#f5f2ee]'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{v.v}</span>
                  <span
                    className={cn(
                      'font-mono text-[9px] uppercase tracking-[0.18em]',
                      v.status === 'current' ? 'text-[#2B7FFF]' : 'text-[#6b5e50]/70'
                    )}
                  >
                    {v.status}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-[#6b5e50]">{v.date} · {v.by}</div>
                <div className="mt-1 text-xs text-[#1a1714]">{v.note}</div>
              </button>
            </li>
          ))}
        </ol>
      </aside>
      <div className="flex flex-col bg-white">
        <div className="flex items-center justify-between border-b border-[rgba(26,23,20,0.1)] px-4 py-2">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6b5e50]">
            Viewing {versions[active].v} · {versions[active].by}
          </div>
          <div className="flex gap-1">
            <button className="rounded-md border border-[rgba(26,23,20,0.1)] bg-white px-2 py-1 text-xs hover:bg-[#f5f2ee]">Compare</button>
            <button className="rounded-md border border-[rgba(26,23,20,0.1)] bg-white px-2 py-1 text-xs hover:bg-[#f5f2ee]">Approve</button>
          </div>
        </div>
        <div className="blueprint-grid-lp relative h-72">
          <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full text-white/95">
            <g fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="40" y="40" width="320" height="220" />
              <line x1="40" y1="130" x2="360" y2="130" />
              <line x1="200" y1="40" x2="200" y2="260" />
              <line x1="40" y1="200" x2="200" y2="200" />
              <line x1="280" y1="130" x2="280" y2="260" />
              <circle cx="80" cy="170" r="12" />
              <path d="M40 70 L70 70 A20 20 0 0 1 70 90 L40 90" />
              {active === 0 && (
                <g stroke="#F5A623" strokeWidth="2">
                  <rect x="206" y="44" width="60" height="14" fill="none" />
                </g>
              )}
            </g>
            <g fill="currentColor" className="font-mono" fontSize="9">
              <text x="48" y="60">LIVING · 24.3 m²</text>
              <text x="208" y="60">KITCHEN · 12.1 m²</text>
              <text x="48" y="150">BED 01 · 18.7 m²</text>
              <text x="208" y="150">BATH</text>
              <text x="48" y="220">FOYER</text>
              <text x="208" y="220">BED 02 · 16.4 m²</text>
            </g>
            {active === 0 && (
              <g>
                <circle cx="236" cy="51" r="4" fill="#F5A623" />
                <text x="244" y="54" fill="#F5A623" fontSize="9" className="font-mono">RFI #042 resolved</text>
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  )
}

/* ============== RFI ============== */

type Message = { from: 'you' | 'contractor' | 'system'; body: string; time: string }

function RfiDemo() {
  const [messages, setMessages] = useState<Message[]>([
    { from: 'contractor', time: '10:14', body: "Window head detail on A-04 v11 doesn't match the section A-12 v3. Which is binding?" },
    { from: 'system', time: '10:14', body: 'Linked to A-04 · v11 · grid C4–D4' },
    { from: 'you', time: '10:36', body: 'A-12 is binding. Section governs over plan. Updating A-04.' },
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
      <div className="flex flex-col border-b border-[rgba(26,23,20,0.1)] md:border-b-0 md:border-r">
        <div className="flex items-center justify-between border-b border-[rgba(26,23,20,0.1)] px-4 py-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#2B7FFF]">RFI #042 · Open</div>
            <div className="mt-0.5 font-semibold text-base text-[#1a1714]">Window head detail conflict — A-04 vs A-12</div>
          </div>
          <button className="rounded-md border border-[rgba(26,23,20,0.1)] bg-white px-2 py-1 text-xs hover:bg-[#f5f2ee]">Mark resolved</button>
        </div>
        <div className="flex-grow flex flex-col justify-end p-4 bg-[#FAFAF8] h-[300px] overflow-y-auto space-y-3">
          {messages.map((m, i) => (
            <Bubble key={i} msg={m} />
          ))}
        </div>
        <div className="border-t border-[rgba(26,23,20,0.1)] bg-[#f5f2ee] p-3">
          <div className="flex items-end gap-2 rounded-lg border border-[rgba(26,23,20,0.1)] bg-white p-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder="Reply… (Enter to send)"
              className="flex-1 resize-none bg-transparent text-sm outline-none text-[#1a1714]"
            />
            <button onClick={send} className="grid h-8 w-8 place-items-center rounded-md bg-[#2B7FFF] text-white">
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
      <aside className="bg-[#f5f2ee]/60 p-4">
        <div className="border-b border-[rgba(26,23,20,0.1)] pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]">
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
              <dt className="text-[#6b5e50]">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
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
      <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-[rgba(26,23,20,0.1)] bg-[#f5f2ee] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]">
        <ImageIcon className="h-3 w-3" /> {msg.body}
      </div>
    )
  }
  const mine = msg.from === 'you'
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm', mine ? 'bg-[#2B7FFF] text-white' : 'bg-white text-[#1a1714]')}>
        <div className={cn('font-mono text-[9px] uppercase tracking-[0.18em]', mine ? 'text-white/70' : 'text-[#6b5e50]')}>
          {mine ? 'You' : 'Shenoy Build Co.'} · {msg.time}
        </div>
        <div className="mt-0.5">{msg.body}</div>
      </div>
    </div>
  )
}

/* ============== BOQ ============== */

function BoqDemo() {
  const [items, setItems] = useState([
    { code: 'CIV-01', desc: 'RCC M25 — slabs & beams', qty: 84, unit: 'm³', rate: 7800, ai: false },
    { code: 'MAS-01', desc: 'Brick masonry, 230mm', qty: 312, unit: 'm²', rate: 1240, ai: false },
    { code: 'FIN-04', desc: 'Vitrified tile flooring 600×600', qty: 218, unit: 'm²', rate: 1850, ai: false },
  ])
  const [estimating, setEstimating] = useState(false)
  const runAi = () => {
    setEstimating(true)
    setTimeout(() => {
      setItems((it) => [
        ...it,
        { code: 'ELE-02', desc: 'Conduit + wiring, 2BHK loop', qty: 6, unit: 'loops', rate: 18400, ai: true },
        { code: 'PLB-03', desc: 'CPVC supply lines incl. fittings', qty: 312, unit: 'm', rate: 295, ai: true },
        { code: 'DOO-01', desc: 'Flush door 35mm, both sides laminate', qty: 14, unit: 'no.', rate: 6450, ai: true },
      ])
      setEstimating(false)
    }, 900)
  }
  const total = items.reduce((s, i) => s + i.qty * i.rate, 0)
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-[rgba(26,23,20,0.1)] px-4 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#2B7FFF]">BOQ · Lotus Residences · Block A</div>
          <div className="mt-0.5 font-semibold text-base text-[#1a1714]">Draft — based on DPR v2</div>
        </div>
        <button
          onClick={runAi}
          disabled={estimating}
          className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(26,23,20,0.1)] bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#f5f2ee] disabled:opacity-60 text-[#1a1714]"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#2B7FFF]" />
          {estimating ? 'Estimating…' : 'AI estimate missing lines'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#f5f2ee]/60 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]">
            <tr>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2">Unit</th>
              <th className="px-4 py-2 text-right">Rate (₹)</th>
              <th className="px-4 py-2 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.code} className="border-t border-[rgba(26,23,20,0.1)] text-[#1a1714]">
                <td className="px-4 py-2 font-mono text-xs">{it.code}</td>
                <td className="px-4 py-2">
                  {it.desc}
                  {it.ai && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-[rgba(26,23,20,0.1)] bg-[#f5f2ee] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#2B7FFF]">
                      <Sparkles className="h-2.5 w-2.5" /> AI
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{it.qty}</td>
                <td className="px-4 py-2 text-[#6b5e50]">{it.unit}</td>
                <td className="px-4 py-2 text-right tabular-nums">{it.rate.toLocaleString('en-IN')}</td>
                <td className="px-4 py-2 text-right tabular-nums">{(it.qty * it.rate).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[rgba(26,23,20,0.1)] bg-[#f5f2ee]">
              <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]" colSpan={5}>
                Subtotal
              </td>
              <td className="px-4 py-3 text-right font-semibold text-base tabular-nums text-[#1a1714]">
                ₹ {total.toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="border-t border-[rgba(26,23,20,0.1)] bg-[#f5f2ee]/60 px-4 py-2.5 text-xs text-[#6b5e50]">
        Rates pulled from Karnataka SOR 2024 · your office rate book overrides where set.
      </div>
    </div>
  )
}

/* ============== CLIENT PORTAL ============== */

function ClientDemo() {
  const [approvals, setApprovals] = useState([
    { title: 'Vitrified tile sample — living areas', status: 'pending' as 'pending' | 'approved' },
    { title: 'Variation: extended kitchen island (+₹84,000)', status: 'pending' as 'pending' | 'approved' },
    { title: 'Final paint palette — bedrooms', status: 'approved' as 'pending' | 'approved' },
  ])
  const approve = (i: number) =>
    setApprovals((a) => a.map((x, idx) => (idx === i ? { ...x, status: 'approved' } : x)))
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr]">
      <section className="border-b border-[rgba(26,23,20,0.1)] md:border-b-0 md:border-r p-4">
        <div className="border-b border-[rgba(26,23,20,0.1)] pb-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#2B7FFF]">Your home, this week</div>
          <div className="mt-0.5 font-semibold text-lg text-[#1a1714]">Lotus Residences · Unit A-04</div>
        </div>
        <div className="grid gap-4 pt-4">
          <div className="rounded-xl border border-[rgba(26,23,20,0.1)] bg-[#FAFAF8] p-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]">Phase</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#2B7FFF]">62% · on track</div>
            </div>
            <div className="mt-2 font-medium text-base text-[#1a1714]">Interior finishing</div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f5f2ee]">
              <div className="h-full w-[62%] rounded-full bg-[#2B7FFF]" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-[#1a1714]">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6b5e50]">Started</div>
                <div className="mt-0.5 font-medium">12 Jan</div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6b5e50]">Handover</div>
                <div className="mt-0.5 font-medium">28 Sep</div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6b5e50]">Next milestone</div>
                <div className="mt-0.5 font-medium">Floor polish</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[rgba(26,23,20,0.1)] bg-white p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]">Next payment</div>
            <div className="mt-1 font-semibold text-2xl text-[#1a1714]">₹ 4,20,000</div>
            <div className="mt-0.5 text-xs text-[#6b5e50]">Due on floor polish completion · est. 14 Jun</div>
            <button className="mt-3 inline-flex items-center gap-1 rounded-md border border-[rgba(26,23,20,0.1)] bg-[#FAFAF8] px-3 py-1.5 text-xs hover:bg-[#f5f2ee] font-medium">
              View schedule <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </section>
      <section className="p-4">
        <div className="border-b border-[rgba(26,23,20,0.1)] pb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]">
          Waiting on you
        </div>
        <ul className="divide-y divide-[rgba(26,23,20,0.08)]">
          {approvals.map((a, i) => (
            <li key={a.title} className="flex items-start gap-3 py-3">
              <button
                onClick={() => approve(i)}
                className="mt-0.5 text-[#2B7FFF] hover:text-[#2B7FFF]/80 disabled:opacity-50"
                aria-label="Approve"
                disabled={a.status === 'approved'}
              >
                {a.status === 'approved' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5 text-[#6b5e50] hover:text-[#2B7FFF]" />
                )}
              </button>
              <div className="flex-1">
                <div className={cn('text-sm font-medium', a.status === 'approved' && 'text-[#6b5e50] line-through')}>
                  {a.title}
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]">
                  {a.status === 'approved' ? 'Approved · just now' : 'Tap to approve'}
                </div>
              </div>
            </li>
          ))}
          <li className="flex items-center gap-2 py-3 text-xs text-[#6b5e50]">
            <Plus className="h-3.5 w-3.5" /> Your architect will add items here as they come up.
          </li>
        </ul>
      </section>
    </div>
  )
}
