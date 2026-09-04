import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from '@/compat/next-link'
import { useToast } from '@/components/ui5/Toast'
import { ErrorState } from '@/components/ui5/ErrorState'
import { Skeleton } from '@/components/ui5/Skeleton'
import { useLiveReload } from '@/lib/live/useLiveReload'
import ScheduleMeetingModal from '@/components/meetings/ScheduleMeetingModal'
import ProjectTimeline, { type TimelineProject } from '@/components/calendar/ProjectTimeline'

type Meeting = {
  id: string
  title: string
  project_id: string
  project_name?: string | null
  meeting_date: string
  starts_at?: string | null
  ends_at?: string | null
  location?: string | null
  meeting_url?: string | null
  status?: string
  attendees?: string[]
}

type GoogleEvent = {
  id: string
  summary: string
  start: string
  htmlLink?: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}

function ymd(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function startOfDayIso(year: number, month: number, day = 1) {
  return new Date(year, month, day).toISOString()
}

function formatTime(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

function meetingDayKey(m: Meeting) {
  if (m.starts_at) {
    const d = new Date(m.starts_at)
    if (!Number.isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
  }
  return (m.meeting_date || '').slice(0, 10)
}

export default function CalendarPage() {
  const { toast } = useToast()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(ymd(now.getFullYear(), now.getMonth(), now.getDate()))
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [view, setView] = useState<'month' | 'timeline'>('month')
  const [timeline, setTimeline] = useState<TimelineProject[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineLoaded, setTimelineLoaded] = useState(false)

  const range = useMemo(() => {
    const from = startOfDayIso(year, month, 1)
    const to = new Date(year, month + 1, 1).toISOString()
    return { from, to }
  }, [year, month])

  const load = useCallback(
    async (opts?: { quiet?: boolean }) => {
      if (!opts?.quiet) {
        setLoading(true)
        setLoadError(null)
      }
      try {
        const [meetRes, projRes] = await Promise.all([
          fetch(`/api/meetings?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`),
          fetch('/api/projects'),
        ])
        const meetData = await meetRes.json()
        if (!meetRes.ok) throw new Error(meetData.error || 'Could not load the calendar')
        setMeetings(meetData.meetings || [])
        const projData = await projRes.json().catch(() => ({ projects: [] }))
        setProjects((projData.projects || []).map((p: any) => ({ id: p.id, name: p.name })))
      } catch (e) {
        if (!opts?.quiet) setLoadError(e)
      } finally {
        if (!opts?.quiet) setLoading(false)
      }
    },
    [range.from, range.to]
  )

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    fetch('/api/integrations/google/calendar')
      .then((r) => r.json())
      .then((d) => {
        if (d?.notConnected) return
        setGoogleEvents(d.events || [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (view !== 'timeline' || timelineLoaded) return
    setTimelineLoading(true)
    fetch('/api/timeline')
      .then((r) => r.json())
      .then((d) => setTimeline(d.projects || []))
      .catch(() => setTimeline([]))
      .finally(() => {
        setTimelineLoading(false)
        setTimelineLoaded(true)
      })
  }, [view, timelineLoaded])

  useLiveReload(load, ['meetings'])

  const byDay = useMemo(() => {
    const map = new Map<string, Meeting[]>()
    for (const m of meetings) {
      if (m.status === 'cancelled') continue
      const key = meetingDayKey(m)
      if (!key) continue
      const list = map.get(key) || []
      list.push(m)
      map.set(key, list)
    }
    return map
  }, [meetings])

  const selectedMeetings = byDay.get(selected) || []
  const upcoming = useMemo(() => {
    const t = Date.now()
    return meetings
      .filter((m) => {
        if (m.status === 'cancelled' || m.status === 'completed') return false
        const start = m.starts_at ? new Date(m.starts_at).getTime() : Date.parse(`${m.meeting_date}T00:00:00`)
        return Number.isFinite(start) && start >= t
      })
      .sort((a, b) => {
        const as = a.starts_at ? new Date(a.starts_at).getTime() : 0
        const bs = b.starts_at ? new Date(b.starts_at).getTime() : 0
        return as - bs
      })
      .slice(0, 6)
  }, [meetings])

  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const blanks = Array.from({ length: firstWeekday }, () => null)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    return [...blanks, ...days]
  }, [year, month])

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  const todayKey = ymd(now.getFullYear(), now.getMonth(), now.getDate())

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[36px]">Calendar</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
            Schedule project meetings, send invites, and get reminders before they start.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border rounded-md overflow-hidden">
            {(
              [
                ['month', 'Month', 'calendar_month'],
                ['timeline', 'Timeline', 'timeline'],
              ] as const
            ).map(([key, label, icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`px-3 py-1.5 text-[11px] font-mono uppercase flex items-center gap-1.5 transition-colors ${
                  view === key ? 'bg-amber text-navy font-bold' : 'text-stone hover:text-white'
                }`}
              >
                <span className="material-icons-outlined text-[14px]">{icon}</span>
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn-primary text-[12px]"
            onClick={() => setShowSchedule(true)}
            disabled={projects.length === 0}
          >
            <span className="material-icons-outlined text-[16px]">event_available</span>
            Schedule meeting
          </button>
        </div>
      </div>

      {loadError ? (
        <ErrorState title="Could not load the calendar" error={loadError} onRetry={load} />
      ) : view === 'timeline' ? (
        <ProjectTimeline projects={timeline} loading={timelineLoading} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 card-5bloc space-y-4">
            <div className="flex items-center justify-between">
              <button type="button" className="btn-secondary py-1 px-2 text-xs" onClick={() => shiftMonth(-1)}>
                <span className="material-icons-outlined text-[16px]">chevron_left</span>
              </button>
              <h2 className="text-sm font-semibold text-white">{monthLabel(year, month)}</h2>
              <button type="button" className="btn-secondary py-1 px-2 text-xs" onClick={() => shiftMonth(1)}>
                <span className="material-icons-outlined text-[16px]">chevron_right</span>
              </button>
            </div>

            {loading ? (
              <Skeleton className="h-[360px] w-full" />
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-mono uppercase text-stone py-1">
                    {d}
                  </div>
                ))}
                {cells.map((day, idx) => {
                  if (!day) return <div key={`b-${idx}`} />
                  const key = ymd(year, month, day)
                  const items = byDay.get(key) || []
                  const isSelected = key === selected
                  const isToday = key === todayKey
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelected(key)}
                      className="min-h-[64px] p-1.5 text-left border transition-colors"
                      style={{
                        background: isSelected ? 'rgba(245,166,35,0.12)' : 'transparent',
                        borderColor: isToday ? 'var(--amber)' : 'rgba(255,255,255,0.06)',
                      }}
                    >
                      <span className="text-[11px] font-mono" style={{ color: isToday ? 'var(--amber)' : 'var(--on-surface)' }}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {items.slice(0, 2).map((m) => (
                          <p key={m.id} className="text-[9px] leading-tight line-clamp-1" style={{ color: 'var(--amber)' }}>
                            {formatTime(m.starts_at) || m.title}
                          </p>
                        ))}
                        {items.length > 2 && (
                          <p className="text-[9px] text-stone">+{items.length - 2}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="card-5bloc space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                  {new Date(selected + 'T12:00:00').toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </h3>
                <button type="button" className="text-[10px] font-mono text-amber" onClick={() => setShowSchedule(true)}>
                  + Add
                </button>
              </div>
              {selectedMeetings.length === 0 ? (
                <p className="text-[11px] text-stone py-4">Nothing scheduled this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedMeetings.map((m) => (
                    <Link
                      key={m.id}
                      href={`/projects/${m.project_id}/meetings`}
                      className="block p-3 border border-navy-lt/40 hover:border-amber/40 transition-colors"
                    >
                      <p className="text-xs font-semibold text-white">{m.title}</p>
                      <p className="text-[11px] text-stone mt-0.5">
                        {formatTime(m.starts_at) || 'All day'}
                        {m.project_name ? ` · ${m.project_name}` : ''}
                      </p>
                      {m.location ? <p className="text-[11px] text-stone">{m.location}</p> : null}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card-5bloc space-y-3">
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Upcoming</h3>
              {upcoming.length === 0 ? (
                <p className="text-[11px] text-stone">No upcoming meetings this month.</p>
              ) : (
                upcoming.map((m) => (
                  <Link key={m.id} href={`/projects/${m.project_id}/meetings`} className="block">
                    <p className="text-xs text-white font-medium">{m.title}</p>
                    <p className="text-[10px] text-stone font-mono">
                      {m.starts_at
                        ? new Date(m.starts_at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : m.meeting_date}
                      {m.project_name ? ` · ${m.project_name}` : ''}
                    </p>
                  </Link>
                ))
              )}
            </div>

            {googleEvents.length > 0 && (
              <div className="card-5bloc space-y-3">
                <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Google Calendar</h3>
                {googleEvents.slice(0, 5).map((e) => (
                  <a key={e.id} href={e.htmlLink} target="_blank" rel="noreferrer" className="block">
                    <p className="text-xs text-white">{e.summary}</p>
                    <p className="text-[10px] text-stone font-mono">
                      {e.start ? new Date(e.start).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ScheduleMeetingModal
        open={showSchedule}
        onClose={() => setShowSchedule(false)}
        projects={projects}
        defaultDate={selected}
        onCreated={(meeting) => setMeetings((prev) => [meeting, ...prev])}
        toast={toast}
      />
    </div>
  )
}
