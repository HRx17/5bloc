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
    <div className="page-m">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="page-m-title">Calendar</h1>
          <p className="page-m-sub">
            Schedule project meetings, send invites, and get reminders before they start.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container-low rounded-lg p-0.5 border border-hairline">
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
                className={`px-3 py-1.5 text-[11px] font-bold uppercase flex items-center gap-1.5 rounded-md transition-all ${
                  view === key 
                    ? 'bg-surface-elevated text-amber shadow-sm border border-hairline-strong' 
                    : 'text-stone hover:text-on-surface'
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
        <div className="card-m p-6">
          <ProjectTimeline projects={timeline} loading={timelineLoading} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 card-m overflow-hidden">
            <div className="card-m-head">
              <div className="flex items-center gap-4">
                <h2 className="card-m-title">{monthLabel(year, month)}</h2>
                <div className="flex items-center gap-1">
                   <button type="button" className="btn-icon btn-icon-sm" onClick={() => shiftMonth(-1)}>
                    <span className="material-icons-outlined">chevron_left</span>
                  </button>
                  <button type="button" className="btn-icon btn-icon-sm" onClick={() => shiftMonth(1)}>
                    <span className="material-icons-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
              <button 
                type="button" 
                className="btn-secondary btn-xs"
                onClick={() => {
                  setYear(now.getFullYear());
                  setMonth(now.getMonth());
                  setSelected(todayKey);
                }}
              >
                Today
              </button>
            </div>

            <div className="p-4">
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="grid grid-cols-7 gap-px bg-hairline rounded-lg overflow-hidden border border-hairline">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="bg-surface-container-low text-center text-[10px] font-bold uppercase text-stone py-2 border-b border-hairline">
                      {d}
                    </div>
                  ))}
                  {cells.map((day, idx) => {
                    if (!day) return <div key={`b-${idx}`} className="bg-surface-container-lowest min-h-[80px]" />
                    const key = ymd(year, month, day)
                    const items = byDay.get(key) || []
                    const isSelected = key === selected
                    const isToday = key === todayKey
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelected(key)}
                        className={`min-h-[80px] p-2 text-left transition-all relative ${
                          isSelected ? 'bg-surface-bright z-10' : 'bg-surface-container-lowest hover:bg-surface-container-low'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-[11px] font-bold ${isToday ? 'bg-amber text-ink-black w-5 h-5 flex items-center justify-center rounded-full' : 'text-on-surface'}`}>
                            {day}
                          </span>
                          {isSelected && <div className="absolute inset-0 border-2 border-amber/30 pointer-events-none" />}
                        </div>
                        <div className="mt-2 space-y-1">
                          {items.slice(0, 3).map((m) => (
                            <div key={m.id} className="chip-m chip-m-amber !text-[9px] !py-0 !px-1.5 w-full truncate">
                              {formatTime(m.starts_at) || 'All day'} {m.title}
                            </div>
                          ))}
                          {items.length > 3 && (
                            <p className="text-[9px] text-stone pl-1">+{items.length - 3} more</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-m overflow-hidden">
              <div className="card-m-head">
                <h3 className="card-m-title uppercase text-[11px] tracking-wider text-stone">
                  {new Date(selected + 'T12:00:00').toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </h3>
                <button type="button" className="btn-secondary btn-xs" onClick={() => setShowSchedule(true)}>
                  <span className="material-icons-outlined !text-[14px]">add</span>
                  Add
                </button>
              </div>
              <div className="p-4">
                {selectedMeetings.length === 0 ? (
                  <div className="py-8 text-center">
                    <span className="material-icons-outlined text-stone/40 text-3xl mb-2">event_busy</span>
                    <p className="text-[12px] text-stone">Nothing scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedMeetings.map((m) => (
                      <Link
                        key={m.id}
                        href={`/projects/${m.project_id}/meetings`}
                        className="block p-3 rounded-xl border border-hairline hover:border-amber/40 hover:bg-surface-container-low transition-all group"
                      >
                        <p className="text-sm font-semibold group-hover:text-amber transition-colors">{m.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="chip-m !text-[10px]">
                            {formatTime(m.starts_at) || 'All day'}
                          </span>
                          {m.project_name && <span className="text-[11px] text-stone truncate">{m.project_name}</span>}
                        </div>
                        {m.location && (
                          <div className="flex items-center gap-1 mt-2 text-stone">
                            <span className="material-icons-outlined !text-[12px]">location_on</span>
                            <span className="text-[11px] truncate">{m.location}</span>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card-m overflow-hidden">
              <div className="card-m-head">
                <h3 className="card-m-title uppercase text-[11px] tracking-wider text-stone">Upcoming</h3>
              </div>
              <div className="p-4 space-y-4">
                {upcoming.length === 0 ? (
                  <p className="text-[12px] text-stone">No upcoming meetings.</p>
                ) : (
                  upcoming.map((m) => (
                    <Link key={m.id} href={`/projects/${m.project_id}/meetings`} className="flex flex-col gap-1 group">
                      <p className="text-[13px] font-medium group-hover:text-amber transition-colors">{m.title}</p>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-stone uppercase tracking-tighter">
                          {m.starts_at
                            ? new Date(m.starts_at).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            : m.meeting_date}
                        </span>
                        {m.project_name && <span className="w-1 h-1 rounded-full bg-hairline-strong" />}
                        {m.project_name && <span className="text-[10px] text-stone truncate">{m.project_name}</span>}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {googleEvents.length > 0 && (
              <div className="card-m overflow-hidden border-l-4 border-l-blue">
                <div className="card-m-head">
                  <h3 className="card-m-title uppercase text-[11px] tracking-wider text-blue">Google Calendar</h3>
                </div>
                <div className="p-4 space-y-4">
                  {googleEvents.slice(0, 5).map((e) => (
                    <a key={e.id} href={e.htmlLink} target="_blank" rel="noreferrer" className="flex flex-col gap-1 group">
                      <p className="text-[13px] font-medium group-hover:text-blue transition-colors">{e.summary}</p>
                      <p className="text-[10px] font-bold text-stone uppercase">
                        {e.start ? new Date(e.start).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''}
                      </p>
                    </a>
                  ))}
                </div>
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
