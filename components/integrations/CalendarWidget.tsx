'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface CalEvent {
  id:          string
  summary:     string
  start:       string
  end:         string
  location:    string | null
  description: string | null
  htmlLink:    string
  allDay:      boolean
  attendees:   { email: string; name?: string; self?: boolean }[]
}

function formatEventTime(start: string, end: string, allDay: boolean) {
  if (allDay) return 'All day'
  const s = new Date(start)
  const e = new Date(end)
  const fmt = (d: Date) => d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${fmt(s)} – ${fmt(e)}`
}

function eventDay(start: string, allDay: boolean) {
  const d = new Date(start)
  const today   = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const eventD  = new Date(start); eventD.setHours(0, 0, 0, 0)

  if (eventD.getTime() === today.getTime())    return 'Today'
  if (eventD.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
}

function groupByDay(events: CalEvent[]) {
  const groups: Record<string, CalEvent[]> = {}
  for (const e of events) {
    const key = eventDay(e.start, e.allDay)
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  }
  return groups
}

const EVENT_COLORS = [
  'var(--amber)', 'var(--blue)', 'var(--success)', 'var(--purple)',
  '#FF9800', '#00BCD4', '#E91E63', '#795548',
]

export function CalendarWidget({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const [events, setEvents]             = useState<CalEvent[]>([])
  const [loading, setLoading]           = useState(true)
  const [notConnected, setNotConnected] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)

  useEffect(() => {
    fetch('/api/integrations/google/calendar')
      .then(r => r.json())
      .then(data => {
        if (data.notConnected) { setNotConnected(true); return }
        setEvents(data.events ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (notConnected) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
        <span className="material-icons-outlined text-[28px] mb-2" style={{ color: 'var(--stone)' }}>calendar_today</span>
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>Calendar not connected</p>
        <Link href="/integrations" className="text-[11px] underline" style={{ color: 'var(--amber)' }}>Connect Google</Link>
      </div>
    )
  }

  const groups = groupByDay(events)

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--stone)' }}>Upcoming Events</h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--amber)' }}>
            {events.length} events
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4" style={{ scrollbarWidth: 'none' }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))
        ) : events.length === 0 ? (
          <div className="text-center py-6 text-xs" style={{ color: 'var(--stone)' }}>No upcoming events</div>
        ) : Object.entries(groups).map(([day, dayEvents]) => (
          <div key={day}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--stone)' }}>{day}</p>
            <div className="space-y-1.5">
              {dayEvents.map((ev, idx) => {
                const color = EVENT_COLORS[idx % EVENT_COLORS.length]
                return (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5"
                    style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--on-surface)' }}>{ev.summary}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--stone)' }}>
                        {formatEventTime(ev.start, ev.end, ev.allDay)}
                        {ev.location && ` · ${ev.location}`}
                      </p>
                    </div>
                    {ev.attendees.length > 1 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--stone)' }}>
                        {ev.attendees.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Event detail popover */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute inset-x-4 bottom-4 rounded-2xl p-4 z-50 shadow-2xl"
            style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{selectedEvent.summary}</p>
              <button onClick={() => setSelectedEvent(null)} style={{ color: 'var(--stone)' }}>
                <span className="material-icons-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="text-xs mb-1" style={{ color: 'var(--stone)' }}>
              <span className="material-icons-outlined text-[13px] mr-1" style={{ verticalAlign: 'middle' }}>schedule</span>
              {formatEventTime(selectedEvent.start, selectedEvent.end, selectedEvent.allDay)}
            </p>
            {selectedEvent.location && (
              <p className="text-xs mb-1" style={{ color: 'var(--stone)' }}>
                <span className="material-icons-outlined text-[13px] mr-1" style={{ verticalAlign: 'middle' }}>location_on</span>
                {selectedEvent.location}
              </p>
            )}
            {selectedEvent.attendees.length > 1 && (
              <p className="text-xs mb-1" style={{ color: 'var(--stone)' }}>
                <span className="material-icons-outlined text-[13px] mr-1" style={{ verticalAlign: 'middle' }}>group</span>
                {selectedEvent.attendees.map(a => a.name || a.email).join(', ')}
              </p>
            )}
            {selectedEvent.description && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                {selectedEvent.description.slice(0, 200)}
              </p>
            )}
            <a href={selectedEvent.htmlLink} target="_blank" rel="noreferrer"
              className="mt-3 btn-primary py-1.5 px-3 text-[11px] rounded-lg inline-flex items-center gap-1">
              Open in Calendar
              <span className="material-icons-outlined text-[12px]">open_in_new</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
