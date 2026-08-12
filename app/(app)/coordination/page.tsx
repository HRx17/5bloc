'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { GmailPanel } from '@/components/integrations/GmailPanel'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { supabaseClient } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/data/client-data'
import { conversationTitle, getMyProfile, initialsOf, listConversations, relativeTime } from '@/lib/data/messages'

type TabId = 'rfis' | 'messages' | 'meetings' | 'issues' | 'gmail'

interface RFI {
  id: string; number: string; title: string; project: string; project_id: string
  raised_by: string; status: 'open' | 'answered' | 'overdue' | 'closed'
  due_date: string; priority: 'high' | 'medium' | 'low'; description: string
}

interface ConversationSummary {
  id: string; title: string; project: string
  preview: string; time: string; unread: number
}

interface Meeting {
  id: string; title: string; project: string; project_id: string
  date: string; attendees: string[]; status: 'upcoming' | 'done'
}

interface Issue {
  id: string; title: string; project: string; project_id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'resolved'; assigned_to: string; description: string
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

function TabEmpty({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="material-icons-outlined text-[28px] mb-4" style={{ color: 'var(--stone)', opacity: 0.3 }}>{icon}</span>
      <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>{title}</h3>
      <p className="text-[13px] max-w-sm" style={{ color: 'var(--stone)' }}>{sub}</p>
    </div>
  )
}

function TabSkeleton({ height = 56 }: { height?: number }) {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="w-full" style={{ height }} />
      ))}
    </div>
  )
}

/** `attendees` may arrive as a jsonb array, a JSON string, or a comma/newline list. */
function toAttendees(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean)
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.map((v) => String(v)).filter(Boolean)
  } catch {
    // not JSON — fall through to a plain list
  }
  return value.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
}

function rfiStatusOf(row: any): RFI['status'] {
  const raw = String(row.status ?? 'open')
  if (raw === 'closed') return 'closed'
  if (raw === 'answered') return 'answered'
  const due = row.due_date ? String(row.due_date).slice(0, 10) : ''
  if (due && due < new Date().toISOString().slice(0, 10)) return 'overdue'
  return 'open'
}

export default function CoordinationHub() {
  const { toast } = useToast()
  const confirm = useConfirm()

  const [tab,  setTab]  = useState<TabId>('rfis')
  const [loading, setLoading] = useState(true)
  const [rfis,     setRfis]     = useState<RFI[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [issues,   setIssues]   = useState<Issue[]>([])
  const [rfisError,     setRfisError]     = useState<unknown>(null)
  const [meetingsError, setMeetingsError] = useState<unknown>(null)
  const [issuesError,   setIssuesError]   = useState<unknown>(null)

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [conversationsError, setConversationsError] = useState<unknown>(null)

  const [search, setSearch] = useState('')
  const [selectedRfi, setSelectedRfi] = useState<RFI | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [rfiResponse, setRfiResponse] = useState('')
  const [respondingRfi, setRespondingRfi] = useState(false)
  const [resolvingIssue, setResolvingIssue] = useState(false)

  const load = useCallback(async (options?: { quiet?: boolean }) => {
    if (!options?.quiet) setLoading(true)
    setRfisError(null)
    setIssuesError(null)
    setMeetingsError(null)

    if (!hasSupabaseEnv()) {
      const notConfigured = new Error('Coordination data is not configured in this environment.')
      setRfisError(notConfigured)
      setIssuesError(notConfigured)
      setMeetingsError(notConfigured)
      setLoading(false)
      return
    }

    // Each dataset stands on its own: a failure in one must not blank out the others.
    let rfiRes, issueRes, meetingRes
    try {
      ;[rfiRes, issueRes, meetingRes] = await Promise.all([
        supabaseClient.from('rfis').select('*, projects(name)').order('rfi_number', { ascending: true }),
        supabaseClient.from('issues').select('*, projects(name)').order('issue_number', { ascending: true }),
        supabaseClient.from('meetings').select('*, projects(name)').order('meeting_date', { ascending: false }),
      ])
    } catch (err) {
      setRfisError(err)
      setIssuesError(err)
      setMeetingsError(err)
      setLoading(false)
      return
    }

    if (rfiRes.error) {
      setRfisError(new Error(rfiRes.error.message || 'Could not load RFIs'))
    } else {
      setRfis((rfiRes.data || []).map((r: any) => ({
        id: r.id,
        number: `RFI-${String(r.rfi_number ?? 0).padStart(3, '0')}`,
        title: r.title ?? 'Untitled RFI',
        project: (r as { projects?: { name?: string } | null }).projects?.name ?? '—',
        project_id: r.project_id ?? '',
        raised_by: r.raised_by ?? '—',
        status: rfiStatusOf(r),
        due_date: r.due_date ? String(r.due_date).slice(0, 10) : '',
        priority: (r.is_scope_change ? 'high' : 'medium') as RFI['priority'],
        description: r.description ?? '',
      })))
    }

    if (issueRes.error) {
      setIssuesError(new Error(issueRes.error.message || 'Could not load site issues'))
    } else {
      setIssues((issueRes.data || []).map((i: any) => ({
        id: i.id,
        title: i.title ?? 'Untitled issue',
        project: (i as { projects?: { name?: string } | null }).projects?.name ?? '—',
        project_id: i.project_id ?? '',
        severity: (['critical', 'high', 'medium', 'low'].includes(i.severity) ? i.severity : 'medium') as Issue['severity'],
        status: (['open', 'in_progress', 'resolved'].includes(i.status) ? i.status : 'open') as Issue['status'],
        assigned_to: i.assigned_to ?? '—',
        description: i.description ?? '',
      })))
    }

    if (meetingRes.error) {
      setMeetingsError(new Error(meetingRes.error.message || 'Could not load meetings'))
    } else {
      const today = new Date().toISOString().slice(0, 10)
      setMeetings((meetingRes.data || []).map((m: any) => {
        const date = m.meeting_date ?? m.date ?? ''
        return {
          id: m.id,
          title: m.title ?? 'Untitled meeting',
          project: (m as { projects?: { name?: string } | null }).projects?.name ?? '—',
          project_id: m.project_id ?? '',
          date: String(date),
          attendees: toAttendees(m.attendees),
          status: (String(date).slice(0, 10) >= today ? 'upcoming' : 'done') as Meeting['status'],
        }
      }))
    }

    setLoading(false)
  }, [])

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true)
    setConversationsError(null)
    try {
      if (!hasSupabaseEnv()) throw new Error('Messaging is not configured in this environment.')
      const profile = await getMyProfile()
      if (!profile) throw new Error('Could not identify your account')

      const [convs, { data: projectRows }] = await Promise.all([
        listConversations(profile.id),
        supabaseClient.from('projects').select('id, name'),
      ])
      const projectNames = new Map<string, string>(
        (projectRows || []).map((p: any) => [String(p.id), String(p.name ?? '')])
      )

      setConversations(convs.map((c) => ({
        id: c.id,
        title: conversationTitle(c, profile.id),
        project: (c.project_id && projectNames.get(c.project_id)) || '',
        preview: c.lastMessage?.body || 'No messages yet',
        time: c.lastMessage ? relativeTime(c.lastMessage.created_at) : '',
        unread: c.unread,
      })))
    } catch (err) {
      setConversationsError(err)
    } finally {
      setLoadingConversations(false)
    }
  }, [])

  useEffect(() => {
    load()
    loadConversations()
  }, [load, loadConversations])

  const respondToRfi = async () => {
    if (!selectedRfi || respondingRfi) return
    if (!selectedRfi.project_id) {
      toast('This RFI is not linked to a project, so it cannot be answered here.', 'error')
      return
    }
    const text = rfiResponse.trim()
    if (!text) {
      toast('Write your response before sending it', 'warning')
      return
    }
    setRespondingRfi(true)
    try {
      const res = await fetch(`/api/projects/${selectedRfi.project_id}/rfis`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfi_id: selectedRfi.id, response: text }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast(data.error || 'Could not send your response. Try again.', 'error')
        return
      }
      toast(`Response sent on ${selectedRfi.number} — whoever raised it has been notified`, 'success')
      setSelectedRfi(null)
      setRfiResponse('')
      await load({ quiet: true })
    } catch (err: any) {
      toast(err?.message || 'Could not reach the server. Try again.', 'error')
    } finally {
      setRespondingRfi(false)
    }
  }

  const resolveIssue = async () => {
    if (!selectedIssue || resolvingIssue) return
    if (!selectedIssue.project_id) {
      toast('This issue is not linked to a project, so it cannot be resolved here.', 'error')
      return
    }
    const ok = await confirm({
      title: 'Mark this issue resolved?',
      message: `${selectedIssue.title} will be closed for everyone on ${selectedIssue.project}. Reopening it means raising the issue again.`,
      confirmLabel: 'Mark resolved',
    })
    if (!ok) return

    setResolvingIssue(true)
    try {
      const res = await fetch(`/api/projects/${selectedIssue.project_id}/issues`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue_id: selectedIssue.id, status: 'resolved' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast(data.error || 'Could not update this issue. Try again.', 'error')
        return
      }
      toast(`${selectedIssue.title} marked resolved`, 'success')
      setSelectedIssue(null)
      await load({ quiet: true })
    } catch (err: any) {
      toast(err?.message || 'Could not reach the server. Try again.', 'error')
    } finally {
      setResolvingIssue(false)
    }
  }

  const TABS: { id: TabId; label: string; icon: string; count: () => number }[] = [
    { id: 'rfis',     label: 'RFIs',     icon: 'forum',          count: () => rfis.filter(r => r.status !== 'closed').length },
    { id: 'messages', label: 'Messages', icon: 'chat',           count: () => conversations.reduce((n, c) => n + (c.unread > 0 ? 1 : 0), 0) },
    { id: 'meetings', label: 'Meetings', icon: 'event',          count: () => meetings.filter(m => m.status === 'upcoming').length },
    { id: 'issues',   label: 'Issues',   icon: 'warning_amber',  count: () => issues.filter(i => i.status !== 'resolved').length },
    { id: 'gmail',    label: 'Gmail',    icon: 'mail',           count: () => 0 },
  ]

  const filterText = search.toLowerCase()

  const visibleRfis = rfis.filter(r =>
    !filterText || r.title.toLowerCase().includes(filterText) ||
    r.project.toLowerCase().includes(filterText) || r.number.toLowerCase().includes(filterText)
  )
  const visibleConversations = conversations.filter(c =>
    !filterText || c.title.toLowerCase().includes(filterText) ||
    c.preview.toLowerCase().includes(filterText) || c.project.toLowerCase().includes(filterText)
  )
  const visibleMeetings = meetings.filter(m =>
    !filterText || m.title.toLowerCase().includes(filterText) || m.project.toLowerCase().includes(filterText)
  )
  const visibleIssues = issues.filter(i =>
    !filterText || i.title.toLowerCase().includes(filterText) || i.project.toLowerCase().includes(filterText)
  )

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
          <h1 className="font-display text-[22px] lg:text-[26px] leading-tight" style={{ color: 'var(--on-surface)' }}>
            Coordination
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--on-surface-variant)' }}>
            RFIs, messages, meetings and site issues — across all projects in one place.
          </p>
        </div>

        {/* Search */}
        <div className="search-5bloc shrink-0 w-full sm:w-[240px]">
          <span className="material-icons-outlined">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
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
          { label: 'Open RFIs',         value: rfis.filter(r => r.status === 'open').length,        unavailable: !!rfisError,     color: 'var(--amber)',  icon: 'forum',         tab: 'rfis'     as TabId },
          { label: 'Overdue RFIs',      value: rfis.filter(r => r.status === 'overdue').length,     unavailable: !!rfisError,     color: 'var(--error)',  icon: 'schedule',      tab: 'rfis'     as TabId },
          { label: 'Upcoming meetings', value: meetings.filter(m => m.status === 'upcoming').length, unavailable: !!meetingsError, color: 'var(--blue)',   icon: 'event',         tab: 'meetings' as TabId },
          { label: 'Open issues',       value: issues.filter(i => i.status !== 'resolved').length,   unavailable: !!issuesError,   color: 'var(--purple)', icon: 'warning_amber', tab: 'issues'   as TabId },
        ].map((s) => (
          <motion.button
            key={s.label}
            onClick={() => setTab(s.tab)}
            className="rounded-2xl p-4 text-left w-full"
            whileHover={{ y: -3 }}
            transition={{ duration: 0.18 }}
            style={{ background: 'var(--surface-container)', boxShadow: `inset 3px 0 0 ${s.color}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons-outlined text-[15px]" style={{ color: s.color }}>{s.icon}</span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--stone)' }}>{s.label}</span>
            </div>
            <p className="font-display text-[20px]" style={{ color: 'var(--on-surface)' }}>
              {loading || s.unavailable ? '—' : s.value}
            </p>
          </motion.button>
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
              <TabSkeleton />
            ) : rfisError ? (
              <ErrorState
                title="Could not load RFIs"
                description="Your RFIs are still on file — this view could not read them. Try again."
                error={rfisError}
                onRetry={() => load()}
              />
            ) : visibleRfis.length === 0 ? (
              <TabEmpty
                icon={filterText ? 'search_off' : 'forum'}
                title={filterText ? `No RFIs match “${search}”` : 'No RFIs raised yet'}
                sub={
                  filterText
                    ? 'Search looks at the RFI number, title and project. Clear it to see every open RFI.'
                    : 'RFIs raised on any project land here so nothing sits unanswered. Open a project to raise the first one.'
                }
              />
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
                    {visibleRfis.map((rfi, idx) => (
                      <tr
                        key={rfi.id}
                        className="transition-colors cursor-pointer"
                        style={idx > 0 ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' } : {}}
                        onClick={() => { setSelectedRfi(rfi); setRfiResponse('') }}
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
                        <td className="py-3.5 px-4 hidden lg:table-cell font-mono text-[11px]" style={{ color: rfi.status === 'overdue' ? 'var(--error)' : 'var(--stone)' }}>{rfi.due_date || '—'}</td>
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
            loadingConversations ? (
              <TabSkeleton height={64} />
            ) : conversationsError ? (
              <ErrorState
                title="Could not load your conversations"
                description="Your messages are unaffected — this summary could not be built. Try again, or open Messages directly."
                error={conversationsError}
                onRetry={loadConversations}
              />
            ) : visibleConversations.length === 0 ? (
              <TabEmpty
                icon={filterText ? 'search_off' : 'chat'}
                title={filterText ? `No conversations match “${search}”` : 'No conversations yet'}
                sub={
                  filterText
                    ? 'Search covers the thread name, project and latest message. Clear it to see every conversation.'
                    : 'Threads with your architects, consultants and contractors appear here, so you can catch up across every job in one pass.'
                }
              />
            ) : (
              <div className="space-y-2">
                {visibleConversations.map((conv) => (
                  <Link key={conv.id} href={`/messages?c=${conv.id}`}>
                    <motion.div
                      className="flex gap-4 rounded-2xl p-4 cursor-pointer transition-all"
                      style={{ background: 'var(--surface-container)' }}
                      whileHover={{ x: 2 }}
                    >
                      <div
                        className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-[12px] font-bold"
                        style={{ background: 'rgba(122,184,255,0.12)', color: 'var(--blue)' }}
                      >
                        {initialsOf(conv.title)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold" style={{ color: 'var(--on-surface)' }}>{conv.title}</span>
                            {conv.unread > 0 && <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--blue)' }} />}
                          </div>
                          <span className="font-mono text-[10px] shrink-0" style={{ color: 'var(--stone)' }}>{conv.time}</span>
                        </div>
                        <p className="text-[12.5px] line-clamp-2" style={{ color: 'var(--on-surface-variant)' }}>{conv.preview}</p>
                        {conv.project && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--stone)' }}>{conv.project}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )
          )}

          {/* ─── Meetings ─── */}
          {tab === 'meetings' && (
            loading ? (
              <TabSkeleton height={64} />
            ) : meetingsError ? (
              <ErrorState
                title="Could not load meetings"
                description="Nothing has been cancelled — the schedule could not be read. Try again."
                error={meetingsError}
                onRetry={() => load()}
              />
            ) : visibleMeetings.length === 0 ? (
              <TabEmpty
                icon={filterText ? 'search_off' : 'event'}
                title={filterText ? `No meetings match “${search}”` : 'No meetings scheduled'}
                sub={
                  filterText
                    ? 'Search covers the meeting title and project. Clear it to see upcoming and past meetings.'
                    : 'Site meetings and design reviews scheduled in a project show up here with attendees and dates.'
                }
              />
            ) : (
              <div className="space-y-2">
                {visibleMeetings
                  .slice()
                  .sort((a, b) => (a.status === b.status ? 0 : a.status === 'upcoming' ? -1 : 1))
                  .map((meeting) => {
                    const row = (
                      <div
                        className="flex items-center gap-4 rounded-2xl p-4"
                        style={{ background: 'var(--surface-container)' }}
                      >
                        <div
                          className="w-12 h-12 shrink-0 flex flex-col items-center justify-center rounded-xl text-center"
                          style={{ background: meeting.status === 'upcoming' ? 'rgba(122,184,255,0.10)' : 'rgba(138,128,120,0.10)' }}
                        >
                          <span className="text-[18px] font-bold font-display leading-none" style={{ color: meeting.status === 'upcoming' ? 'var(--blue)' : 'var(--stone)' }}>
                            {meeting.date ? new Date(meeting.date).getDate() : '—'}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider" style={{ color: meeting.status === 'upcoming' ? 'var(--blue)' : 'var(--stone)', opacity: 0.7 }}>
                            {meeting.date ? new Date(meeting.date).toLocaleString('en', { month: 'short' }) : ''}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold line-clamp-1" style={{ color: 'var(--on-surface)' }}>{meeting.title}</p>
                          <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--stone)' }}>
                            {meeting.project}
                            {meeting.attendees.length > 0
                              ? ` · ${meeting.attendees.slice(0, 3).join(', ')}${meeting.attendees.length > 3 ? ` +${meeting.attendees.length - 3}` : ''}`
                              : ''}
                          </p>
                        </div>
                        <StatusBadge status={meeting.status} />
                      </div>
                    )
                    return meeting.project_id ? (
                      <Link key={meeting.id} href={`/projects/${meeting.project_id}/meetings`}>
                        {row}
                      </Link>
                    ) : (
                      <div key={meeting.id}>{row}</div>
                    )
                  })}
              </div>
            )
          )}

          {/* ─── Issues ─── */}
          {tab === 'issues' && (
            loading ? (
              <TabSkeleton />
            ) : issuesError ? (
              <ErrorState
                title="Could not load site issues"
                description="Open snags are still logged against their projects — this view could not read them."
                error={issuesError}
                onRetry={() => load()}
              />
            ) : visibleIssues.length === 0 ? (
              <TabEmpty
                icon={filterText ? 'search_off' : 'warning_amber'}
                title={filterText ? `No issues match “${search}”` : 'No site issues logged'}
                sub={
                  filterText
                    ? 'Search covers the issue title and project. Clear it to see every open issue.'
                    : 'Snags and defects raised on a site visit collect here by severity, so nothing gets lost between visits.'
                }
              />
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
                    {visibleIssues.map((issue, idx) => (
                      <tr
                        key={issue.id}
                        className="transition-colors cursor-pointer"
                        style={idx > 0 ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' } : {}}
                        onClick={() => setSelectedIssue(issue)}
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

          {/* ── Gmail Tab ── */}
          {tab === 'gmail' && (
            <div style={{ minHeight: 500 }}>
              <GmailPanel className="h-[600px]" />
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ── RFI Detail Slide-over ── */}
      <AnimatePresence>
        {selectedRfi && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRfi(null)}
            />
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[420px] overflow-y-auto"
              style={{ background: 'var(--surface-container-low)', boxShadow: '-8px 0 40px rgba(0,0,0,0.4)' }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-mono mb-1" style={{ color: 'var(--stone)' }}>{selectedRfi.number}</p>
                    <h2 className="text-[17px] font-semibold leading-snug" style={{ color: 'var(--on-surface)' }}>{selectedRfi.title}</h2>
                  </div>
                  <button onClick={() => setSelectedRfi(null)} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--stone)' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <span className="material-icons-outlined text-[18px]">close</span>
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <StatusBadge status={selectedRfi.status} />
                  <StatusBadge status={selectedRfi.priority} />
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Project',    value: selectedRfi.project },
                    { label: 'Raised by',  value: selectedRfi.raised_by },
                    { label: 'Due date',   value: selectedRfi.due_date || 'Not set' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between text-[13px]">
                      <span style={{ color: 'var(--stone)' }}>{row.label}</span>
                      <span className="font-medium" style={{ color: 'var(--on-surface)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--stone)' }}>Description</p>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                    {selectedRfi.description || 'No description was given when this RFI was raised.'}
                  </p>
                </div>

                {selectedRfi.status === 'answered' || selectedRfi.status === 'closed' ? (
                  <p className="text-[12px]" style={{ color: 'var(--stone)' }}>
                    This RFI has already been answered. Open the project to review or revise the response.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold" style={{ color: 'var(--stone)' }} htmlFor="rfi-response">
                      Your response
                    </label>
                    <textarea
                      id="rfi-response"
                      rows={5}
                      value={rfiResponse}
                      onChange={(e) => setRfiResponse(e.target.value)}
                      placeholder="Answer the question, and reference the drawing or spec you are relying on…"
                      className="input-5bloc text-[13px] resize-none"
                    />
                    <p className="text-[11px]" style={{ color: 'var(--stone)' }}>
                      Sending marks the RFI answered and notifies whoever raised it.
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {selectedRfi.status !== 'answered' && selectedRfi.status !== 'closed' && (
                    <button
                      className="btn-primary flex-1 text-[13px]"
                      onClick={respondToRfi}
                      disabled={respondingRfi || !rfiResponse.trim()}
                    >
                      <span className="material-icons-outlined text-[15px]">reply</span>
                      {respondingRfi ? 'Sending…' : 'Send response'}
                    </button>
                  )}
                  {selectedRfi.project_id && (
                    <Link href={`/projects/${selectedRfi.project_id}/rfis`} className="btn-ghost text-[13px]" onClick={() => setSelectedRfi(null)}>
                      View project
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Issue Detail Slide-over ── */}
      <AnimatePresence>
        {selectedIssue && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedIssue(null)}
            />
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[420px] overflow-y-auto"
              style={{ background: 'var(--surface-container-low)', boxShadow: '-8px 0 40px rgba(0,0,0,0.4)' }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--stone)' }}>Site Issue</p>
                    <h2 className="text-[17px] font-semibold leading-snug" style={{ color: 'var(--on-surface)' }}>{selectedIssue.title}</h2>
                  </div>
                  <button onClick={() => setSelectedIssue(null)} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--stone)' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <span className="material-icons-outlined text-[18px]">close</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <StatusBadge status={selectedIssue.severity} />
                  <StatusBadge status={selectedIssue.status} />
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Project',     value: selectedIssue.project },
                    { label: 'Assigned to', value: selectedIssue.assigned_to },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between text-[13px]">
                      <span style={{ color: 'var(--stone)' }}>{row.label}</span>
                      <span className="font-medium" style={{ color: 'var(--on-surface)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {selectedIssue.description && (
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--stone)' }}>Description</p>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>{selectedIssue.description}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {selectedIssue.status !== 'resolved' && (
                    <button className="btn-primary flex-1 text-[13px]" onClick={resolveIssue} disabled={resolvingIssue}>
                      <span className="material-icons-outlined text-[15px]">check_circle</span>
                      {resolvingIssue ? 'Saving…' : 'Mark resolved'}
                    </button>
                  )}
                  {selectedIssue.project_id && (
                    <Link href={`/projects/${selectedIssue.project_id}/issues`} className="btn-ghost text-[13px]" onClick={() => setSelectedIssue(null)}>
                      View project
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
