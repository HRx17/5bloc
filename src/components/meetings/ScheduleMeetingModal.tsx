import React, { useEffect, useMemo, useState } from 'react'

export type ScheduleMember = {
  profile_id?: string | null
  full_name?: string | null
  email?: string | null
}

type ProjectOption = { id: string; name: string }

type Props = {
  open: boolean
  onClose: () => void
  projects?: ProjectOption[]
  defaultProjectId?: string
  defaultDate?: string
  onCreated: (meeting: any) => void
  toast: (message: string, kind?: 'success' | 'error' | 'info' | 'warning') => void
}

const REMINDERS = [
  { value: 0, label: 'No reminder' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
]

function todayLocal() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function nextHourLocal() {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  return `${String(d.getHours()).padStart(2, '0')}:00`
}

function plusHour(time: string) {
  const [h, m] = time.split(':').map(Number)
  const next = (h + 1) % 24
  return `${String(next).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`
}

function localToIso(date: string, time: string) {
  const d = new Date(`${date}T${time}:00`)
  return d.toISOString()
}

export default function ScheduleMeetingModal({
  open,
  onClose,
  projects = [],
  defaultProjectId,
  defaultDate,
  onCreated,
  toast,
}: Props) {
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(defaultProjectId || '')
  const [date, setDate] = useState(defaultDate || todayLocal())
  const [startTime, setStartTime] = useState(nextHourLocal())
  const [endTime, setEndTime] = useState(plusHour(nextHourLocal()))
  const [location, setLocation] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [agenda, setAgenda] = useState('')
  const [reminder, setReminder] = useState(60)
  const [extraEmails, setExtraEmails] = useState('')
  const [members, setMembers] = useState<ScheduleMember[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const resolvedProjectId = defaultProjectId || projectId

  useEffect(() => {
    if (!open) return
    setTitle('')
    setProjectId(defaultProjectId || projects[0]?.id || '')
    setDate(defaultDate || todayLocal())
    const start = nextHourLocal()
    setStartTime(start)
    setEndTime(plusHour(start))
    setLocation('')
    setMeetingUrl('')
    setAgenda('')
    setReminder(60)
    setExtraEmails('')
  }, [open, defaultProjectId, defaultDate, projects])

  useEffect(() => {
    if (!open || !resolvedProjectId) {
      setMembers([])
      setSelectedEmails([])
      return
    }
    let cancelled = false
    fetch(`/api/projects/${resolvedProjectId}/members`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        const list: ScheduleMember[] = d.members || []
        setMembers(list)
        setSelectedEmails(
          list.map((m) => (m.email || '').trim().toLowerCase()).filter((e) => e.includes('@'))
        )
      })
      .catch(() => {
        if (!cancelled) {
          setMembers([])
          setSelectedEmails([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [open, resolvedProjectId])

  const memberEmails = useMemo(
    () => members.map((m) => (m.email || '').trim().toLowerCase()).filter((e) => e.includes('@')),
    [members]
  )

  if (!open) return null

  const toggleEmail = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    if (!resolvedProjectId) {
      toast('Pick a project for this meeting', 'error')
      return
    }
    const extra = extraEmails
      .split(/[\n,;]/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.includes('@'))
    const attendeeEmails = Array.from(new Set([...selectedEmails, ...extra]))
    const attendees = [
      ...members
        .filter((m) => selectedEmails.includes((m.email || '').trim().toLowerCase()))
        .map((m) => m.full_name || m.email || '')
        .filter(Boolean),
      ...extra,
    ]
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${resolvedProjectId}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date,
          starts_at: localToIso(date, startTime),
          ends_at: localToIso(date, endTime),
          location,
          meeting_url: meetingUrl,
          reminder_minutes: reminder,
          agenda,
          notes: agenda,
          attendees,
          attendee_emails: attendeeEmails,
          status: 'scheduled',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || 'Could not schedule the meeting', 'error')
        return
      }
      onCreated(data.meeting)
      onClose()
      toast('Meeting scheduled. Invites and a reminder are on the way.', 'success')
    } catch (err: any) {
      toast(err?.message || 'Could not schedule the meeting', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-navy-mid border p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="border-b pb-3 flex justify-between items-center">
          <h3 className="text-xs font-bold font-mono text-amber uppercase tracking-wider">
            Schedule meeting
          </h3>
          <button onClick={onClose} className="text-stone hover:text-white transition" type="button">
            <span className="material-icons-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!defaultProjectId && (
            <div>
              <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">
                Project *
              </label>
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="input-5bloc py-1.5 text-xs"
              >
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Weekly site coordination"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-5bloc py-1.5 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-5bloc py-1.5 text-xs font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 col-span-2 sm:col-span-1">
              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">
                  Start
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value)
                    setEndTime(plusHour(e.target.value))
                  }}
                  className="input-5bloc py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">
                  End
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-5bloc py-1.5 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">
                Location
              </label>
              <input
                type="text"
                placeholder="Site office / Google Meet"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-5bloc py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">
                Join link
              </label>
              <input
                type="url"
                placeholder="https://"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className="input-5bloc py-1.5 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">
              Reminder
            </label>
            <select
              value={reminder}
              onChange={(e) => setReminder(Number(e.target.value))}
              className="input-5bloc py-1.5 text-xs"
            >
              {REMINDERS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
              Agenda
            </label>
            <textarea
              rows={2}
              placeholder="Topics to cover…"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              className="input-5bloc text-xs resize-none"
            />
          </div>

          {members.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-stone text-[10px] font-bold uppercase tracking-wider font-mono">
                  Attendees
                </label>
                <button
                  type="button"
                  className="text-[10px] font-mono text-amber"
                  onClick={() =>
                    setSelectedEmails(
                      selectedEmails.length === memberEmails.length ? [] : memberEmails
                    )
                  }
                >
                  {selectedEmails.length === memberEmails.length ? 'Clear' : 'Select all'}
                </button>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto border border-navy-lt/40 p-2">
                {members.map((m, i) => {
                  const email = (m.email || '').trim().toLowerCase()
                  const label = m.full_name || email || 'Member'
                  if (!email) {
                    return (
                      <p key={`${label}-${i}`} className="text-[11px] text-stone">
                        {label} <span className="opacity-60">(no email)</span>
                      </p>
                    )
                  }
                  return (
                    <label key={email} className="flex items-center gap-2 text-[11px] text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEmails.includes(email)}
                        onChange={() => toggleEmail(email)}
                      />
                      <span>
                        {label}
                        {m.full_name && email ? (
                          <span className="text-stone"> · {email}</span>
                        ) : null}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">
              Extra emails
            </label>
            <input
              type="text"
              placeholder="client@firm.com, consultant@…"
              value={extraEmails}
              onChange={(e) => setExtraEmails(e.target.value)}
              className="input-5bloc py-1.5 text-xs"
            />
          </div>

          <div className="pt-2 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={saving} className="btn-secondary py-1.5 px-4 text-xs">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary py-1.5 px-6 text-xs font-bold">
              {saving ? 'Scheduling…' : 'Schedule & notify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
