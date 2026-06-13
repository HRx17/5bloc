'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

type TabId = 'rfis' | 'messages' | 'meetings' | 'issues'

interface RFI {
  id: string; number: string; title: string; project: string
  raised_by: string; status: 'open' | 'answered' | 'overdue' | 'closed'
  due_date: string; priority: 'high' | 'medium' | 'low'
}

interface Message {
  id: string; sender: string; content: string; project: string
  channel: string; time: string; unread: boolean
}

interface Meeting {
  id: string; title: string; project: string
  date: string; attendees: string[]; status: 'upcoming' | 'done'
}

interface Issue {
  id: string; title: string; project: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'resolved'; assigned_to: string
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: 'Open',        color: 'var(--amber)',   bg: 'rgba(245,166,35,.10)' },
  answered:    { label: 'Answered',    color: 'var(--success)', bg: 'rgba(46,204,138,.10)' },
  overdue:     { label: 'Overdue',     color: 'var(--error)',   bg: 'rgba(255,138,128,.10)' },
  closed:      { label: 'Closed',      color: 'var(--stone)',   bg: 'rgba(138,128,120,.10)' },
  upcoming:    { label: 'Upcoming',    color: 'var(--blue)',    bg: 'rgba(122,184,255,.10)' },
  done:        { label: 'Done',        color: 'var(--success)', bg: 'rgba(46,204,138,.10)' },
  in_progress: { label: 'In Progress', color: 'var(--amber)',   bg: 'rgba(245,166,35,.10)' },
  resolved:    { label: 'Resolved',    color: 'var(--success)', bg: 'rgba(46,204,138,.10)' },
  critical:    { label: 'Critical',    color: 'var(--error)',   bg: 'rgba(255,138,128,.10)' },
  high:        { label: 'High',        color: 'var(--amber)',   bg: 'rgba(245,166,35,.10)' },
  medium:      { label: 'Medium',      color: 'var(--blue)',    bg: 'rgba(122,184,255,.10)' },
  low:         { label: 'Low',         color: 'var(--stone)',   bg: 'rgba(138,128,120,.10)' },
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.open
  return (
    <span
      className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full shrink-0"
      style={{ background: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  )
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="material-icons-outlined text-[42px] mb-4" style={{ color: 'var(--stone)', opacity: 0.3 }}>{icon}</span>
      <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>{title}</h3>
      <p className="text-[13px]" style={{ color: 'var(--stone)' }}>{sub}</p>
    </div>
  )
}

export default function CoordinationHub() {
  const [tab,  setTab]  = useState<TabId>('rfis')
  const [loading, setLoading] = useState(true)
  const [rfis,     setRfis]     = useState<RFI[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [issues,   setIssues]   = useState<Issue[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      setRfis([
        { id: 'r1', number: 'RFI-008', title: 'Slab reinforcement bar dia clarification', project: 'Wadhwa Prime Plaza',          raised_by: 'Amit Sharma',  status: 'overdue',  due_date: '2026-06-10', priority: 'high'   },
        { id: 'r2', number: 'RFI-012', title: 'Column footing depth at grid B3',          project: 'Lodha Signature Residences',  raised_by: 'Ravi Gupta',   status: 'open',     due_date: '2026-06-18', priority: 'medium' },
        { id: 'r3', number: 'RFI-003', title: 'Electrical conduit routing in basement',   project: 'Wadhwa Prime Plaza',          raised_by: 'Priya Mehta',  status: 'answered', due_date: '2026-06-20', priority: 'low'    },
        { id: 'r4', number: 'RFI-005', title: 'HVAC duct size at level 4 ceiling',        project: 'Gundecha Industrial Park',    raised_by: 'Suresh Nair',  status: 'open',     due_date: '2026-06-22', priority: 'high'   },
        { id: 'r5', number: 'RFI-009', title: 'Window sill waterproofing specification',  project: 'Lodha Signature Residences',  raised_by: 'Karan Shah',   status: 'closed',   due_date: '2026-06-05', priority: 'low'    },
      ])
      setMessages([
        { id: 'm1', sender: 'Amit Sharma',  content: 'Drawing revision uploaded — please review before Thursday site meeting.',    project: 'Wadhwa Prime Plaza',         channel: 'Project Messages', time: '10m', unread: true  },
        { id: 'm2', sender: 'Parth Patel',  content: 'Client approved the schematic design. Moving to DD phase.',                  project: 'Lodha Signature Residences', channel: 'Project Messages', time: '1h',  unread: false },
        { id: 'm3', sender: 'Suresh Nair',  content: 'Requesting clarity on the BOQ line item for structural steel.',              project: 'Gundecha Industrial Park',   channel: 'Project Messages', time: '3h',  unread: true  },
        { id: 'm4', sender: 'Ravi Gupta',   content: 'Confirmed site visit for 16 June at 10:00 AM. Please bring signed drawings.', project: 'Wadhwa Prime Plaza',         channel: 'Project Messages', time: '1d',  unread: false },
      ])
      setMeetings([
        { id: 'mt1', title: 'Structural Coordination — Week 24',     project: 'Wadhwa Prime Plaza',         date: '2026-06-16 10:00', attendees: ['Parth', 'Amit', 'Ravi'],         status: 'upcoming' },
        { id: 'mt2', title: 'Client Design Review — DD Phase',       project: 'Lodha Signature Residences', date: '2026-06-18 15:00', attendees: ['Parth', 'Karan Shah', 'MEP Lead'], status: 'upcoming' },
        { id: 'mt3', title: 'Site Inspection — Foundation Progress', project: 'Wadhwa Prime Plaza',         date: '2026-06-10 09:00', attendees: ['Parth', 'Suresh', 'Contractor'],  status: 'done' },
        { id: 'mt4', title: 'Pre-Design Kickoff',                    project: 'Gundecha Industrial Park',   date: '2026-06-08 11:00', attendees: ['Parth', 'Developer Team'],         status: 'done' },
      ])
      setIssues([
        { id: 'i1', title: 'Cracked plaster panel near stairwell B2', project: 'Wadhwa Prime Plaza',         severity: 'high',     status: 'open',        assigned_to: 'Amit Sharma' },
        { id: 'i2', title: 'Missing expansion joint at podium slab',   project: 'Lodha Signature Residences', severity: 'critical', status: 'in_progress', assigned_to: 'Ravi Gupta'  },
        { id: 'i3', title: 'Incorrect tile grout colour — lobby',      project: 'Lodha Signature Residences', severity: 'medium',   status: 'open',        assigned_to: 'Site Foreman'},
        { id: 'i4', title: 'Rainwater drain blocked on Level 2 slab',  project: 'Gundecha Industrial Park',   severity: 'high',     status: 'resolved',    assigned_to: 'Suresh Nair' },
      ])
      setLoading(false)
    }, 500)
    return () => clearTimeout(t)
  }, [])

  const TABS: { id: TabId; label: string; icon: string; count: () => number }[] = [
    { id: 'rfis',     label: 'RFIs',     icon: 'forum',          count: () => rfis.filter(r => r.status !== 'closed').length },
    { id: 'messages', label: 'Messages', icon: 'chat',           count: () => messages.filter(m => m.unread).length },
    { id: 'meetings', label: 'Meetings', icon: 'event',          count: () => meetings.filter(m => m.status === 'upcoming').length },
    { id: 'issues',   label: 'Issues',   icon: 'warning_amber',  count: () => issues.filter(i => i.status !== 'resolved').length },
  ]

  const filterText = search.toLowerCase()

  return (
    <div className="p-5 lg:p-7 max-w-[1240px] mx-auto space-y-6">

      {/* ── Header ── */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <p className="text-[12px] mb-1" style={{ color: 'var(--stone)' }}>All projects</p>
          <h1 className="font-display font-bold text-[28px] lg:text-[34px] leading-tight" style={{ color: 'var(--on-surface)' }}>
            Coordination
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--on-surface-variant)' }}>
            RFIs, messages, meetings and site issues — across all projects in one place.
          </p>
        </div>

        {/* Search */}
        <div className="relative shrink-0 w-full sm:w-[240px]">
          <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[15px] pointer-events-none" style={{ color: 'var(--stone)' }}>search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="input-5bloc pl-9 py-2.5 text-[13px]"
          />
        </div>
      </motion.div>

      {/* ── Stats row ── */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
      >
        {[
          { label: 'Open RFIs',        value: rfis.filter(r => r.status === 'open').length,     color: 'var(--amber)', icon: 'forum'         },
          { label: 'Overdue RFIs',     value: rfis.filter(r => r.status === 'overdue').length,  color: 'var(--error)', icon: 'schedule'      },
          { label: 'Upcoming meetings',value: meetings.filter(m => m.status === 'upcoming').length, color: 'var(--blue)', icon: 'event'       },
          { label: 'Open issues',      value: issues.filter(i => i.status !== 'resolved').length,   color: 'var(--purple)', icon: 'warning_amber' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4"
            style={{ background: 'var(--surface-container)', boxShadow: `inset 3px 0 0 ${s.color}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons-outlined text-[15px]" style={{ color: s.color }}>{s.icon}</span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--stone)' }}>{s.label}</span>
            </div>
            <p className="font-display font-bold text-[24px]" style={{ color: 'var(--on-surface)' }}>
              {loading ? '—' : s.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* ── Tab bar ── */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const active = tab === t.id
          const count = t.count()
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all shrink-0"
              style={{
                background: active ? 'var(--surface-container)' : 'transparent',
                color: active ? 'var(--on-surface)' : 'var(--stone)',
                boxShadow: active ? 'inset 0 0 0 1px rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <span className="material-icons-outlined text-[15px]" style={{ color: active ? 'var(--amber)' : 'var(--stone)' }}>{t.icon}</span>
              {t.label}
              {!loading && count > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: active ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.06)', color: active ? 'var(--amber)' : 'var(--stone)' }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >

          {/* ─── RFIs ─── */}
          {tab === 'rfis' && (
            loading ? (
              <div className="space-y-2">
                {[0,1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
              </div>
            ) : rfis.filter(r =>
              !filterText || r.title.toLowerCase().includes(filterText) ||
              r.project.toLowerCase().includes(filterText) || r.number.toLowerCase().includes(filterText)
            ).length === 0 ? (
              <EmptyState icon="forum" title="No RFIs found" sub="Raise an RFI from within a project" />
            ) : (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--surface-container)' }}
              >
                <table className="w-full text-[13px]">
                  <thead>
                    <tr style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.04)' }}>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--stone)' }}>RFI</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--stone)' }}>Title</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--stone)' }}>Project</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--stone)' }}>Raised by</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--stone)' }}>Due</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--stone)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfis
                      .filter(r => !filterText || r.title.toLowerCase().includes(filterText) || r.project.toLowerCase().includes(filterText) || r.number.toLowerCase().includes(filterText))
                      .map((rfi, idx) => (
                        <tr
                          key={rfi.id}
                          className="transition-colors cursor-pointer"
                          style={idx > 0 ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' } : {}}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
                        >
                          <td className="py-3.5 px-4 font-mono text-[11px]" style={{ color: 'var(--stone)' }}>{rfi.number}</td>
                          <td className="py-3.5 px-4 font-medium" style={{ color: 'var(--on-surface)' }}>
                            <span className="line-clamp-1">{rfi.title}</span>
                          </td>
                          <td className="py-3.5 px-4 hidden md:table-cell" style={{ color: 'var(--on-surface-variant)' }}>
                            <span className="line-clamp-1">{rfi.project}</span>
                          </td>
                          <td className="py-3.5 px-4 hidden lg:table-cell" style={{ color: 'var(--stone)' }}>{rfi.raised_by}</td>
                          <td className="py-3.5 px-4 hidden lg:table-cell font-mono text-[11px]" style={{ color: rfi.status === 'overdue' ? 'var(--error)' : 'var(--stone)' }}>{rfi.due_date}</td>
                          <td className="py-3.5 px-4"><StatusBadge status={rfi.status} /></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* ─── Messages ─── */}
          {tab === 'messages' && (
            loading ? (
              <div className="space-y-2">{[0,1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
            ) : messages.filter(m =>
              !filterText || m.content.toLowerCase().includes(filterText) ||
              m.sender.toLowerCase().includes(filterText) || m.project.toLowerCase().includes(filterText)
            ).length === 0 ? (
              <EmptyState icon="chat" title="No messages yet" sub="Messages sent within projects will appear here" />
            ) : (
              <div className="space-y-2">
                {messages
                  .filter(m => !filterText || m.content.toLowerCase().includes(filterText) || m.sender.toLowerCase().includes(filterText) || m.project.toLowerCase().includes(filterText))
                  .map((msg) => (
                    <motion.div
                      key={msg.id}
                      className="flex gap-4 rounded-2xl p-4 cursor-pointer transition-all"
                      style={{ background: 'var(--surface-container)' }}
                      whileHover={{ x: 2 }}
                    >
                      <div
                        className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-[12px] font-bold"
                        style={{ background: 'rgba(122,184,255,0.12)', color: 'var(--blue)' }}
                      >
                        {msg.sender.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold" style={{ color: 'var(--on-surface)' }}>{msg.sender}</span>
                            {msg.unread && <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--blue)' }} />}
                          </div>
                          <span className="font-mono text-[10px] shrink-0" style={{ color: 'var(--stone)' }}>{msg.time}</span>
                        </div>
                        <p className="text-[12.5px] line-clamp-2" style={{ color: 'var(--on-surface-variant)' }}>{msg.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--stone)' }}>{msg.project}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )
          )}

          {/* ─── Meetings ─── */}
          {tab === 'meetings' && (
            loading ? (
              <div className="space-y-2">{[0,1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
            ) : meetings.filter(m =>
              !filterText || m.title.toLowerCase().includes(filterText) || m.project.toLowerCase().includes(filterText)
            ).length === 0 ? (
              <EmptyState icon="event" title="No meetings scheduled" sub="Create a meeting from within a project" />
            ) : (
              <div className="space-y-2">
                {meetings
                  .filter(m => !filterText || m.title.toLowerCase().includes(filterText) || m.project.toLowerCase().includes(filterText))
                  .sort((a, b) => (a.status === 'upcoming' ? -1 : 1))
                  .map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex items-center gap-4 rounded-2xl p-4"
                      style={{ background: 'var(--surface-container)' }}
                    >
                      <div
                        className="w-12 h-12 shrink-0 flex flex-col items-center justify-center rounded-xl text-center"
                        style={{ background: meeting.status === 'upcoming' ? 'rgba(122,184,255,0.10)' : 'rgba(138,128,120,0.10)' }}
                      >
                        <span className="text-[18px] font-bold font-display leading-none" style={{ color: meeting.status === 'upcoming' ? 'var(--blue)' : 'var(--stone)' }}>
                          {new Date(meeting.date).getDate()}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider" style={{ color: meeting.status === 'upcoming' ? 'var(--blue)' : 'var(--stone)', opacity: 0.7 }}>
                          {new Date(meeting.date).toLocaleString('en', { month: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold line-clamp-1" style={{ color: 'var(--on-surface)' }}>{meeting.title}</p>
                        <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--stone)' }}>
                          {meeting.project} · {meeting.attendees.slice(0,3).join(', ')}{meeting.attendees.length > 3 ? ` +${meeting.attendees.length - 3}` : ''}
                        </p>
                      </div>
                      <StatusBadge status={meeting.status} />
                    </div>
                  ))}
              </div>
            )
          )}

          {/* ─── Issues ─── */}
          {tab === 'issues' && (
            loading ? (
              <div className="space-y-2">{[0,1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
            ) : issues.filter(i =>
              !filterText || i.title.toLowerCase().includes(filterText) || i.project.toLowerCase().includes(filterText)
            ).length === 0 ? (
              <EmptyState icon="warning_amber" title="No issues logged" sub="Issues can be raised from a site visit or the project Issues tab" />
            ) : (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--surface-container)' }}
              >
                <table className="w-full text-[13px]">
                  <thead>
                    <tr style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.04)' }}>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--stone)' }}>Severity</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--stone)' }}>Issue</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--stone)' }}>Project</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--stone)' }}>Assigned to</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--stone)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues
                      .filter(i => !filterText || i.title.toLowerCase().includes(filterText) || i.project.toLowerCase().includes(filterText))
                      .map((issue, idx) => (
                        <tr
                          key={issue.id}
                          className="transition-colors cursor-pointer"
                          style={idx > 0 ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' } : {}}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
                        >
                          <td className="py-3.5 px-4"><StatusBadge status={issue.severity} /></td>
                          <td className="py-3.5 px-4 font-medium" style={{ color: 'var(--on-surface)' }}>
                            <span className="line-clamp-1">{issue.title}</span>
                          </td>
                          <td className="py-3.5 px-4 hidden md:table-cell" style={{ color: 'var(--on-surface-variant)' }}>
                            <span className="line-clamp-1">{issue.project}</span>
                          </td>
                          <td className="py-3.5 px-4 hidden lg:table-cell" style={{ color: 'var(--stone)' }}>{issue.assigned_to}</td>
                          <td className="py-3.5 px-4"><StatusBadge status={issue.status} /></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
