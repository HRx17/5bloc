export function asArray(value: unknown): any[] {
  if (Array.isArray(value)) return value
  if (value == null || value === '') return []
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // comma / newline list
    }
    return value
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

export function emailsFrom(value: unknown): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of asArray(value)) {
    const email = String(raw || '')
      .trim()
      .toLowerCase()
    if (!email.includes('@') || seen.has(email)) continue
    seen.add(email)
    out.push(email)
  }
  return out
}

export function meetingDateFromStart(iso: string | null | undefined, fallback?: string | null): string {
  if (fallback && /^\d{4}-\d{2}-\d{2}/.test(fallback)) return fallback.slice(0, 10)
  if (!iso) return new Date().toISOString().slice(0, 10)
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function defaultEndsAt(startsAtIso: string): string {
  const start = new Date(startsAtIso)
  if (Number.isNaN(start.getTime())) return startsAtIso
  return new Date(start.getTime() + 60 * 60 * 1000).toISOString()
}

export function inferMeetingStatus(row: {
  status?: string | null
  starts_at?: string | null
  meeting_date?: string | null
}): string {
  if (row.status) return row.status
  const when = row.starts_at || (row.meeting_date ? `${row.meeting_date}T00:00:00.000Z` : null)
  if (when && new Date(when).getTime() > Date.now()) return 'scheduled'
  return 'recorded'
}

export function normalizeMeeting(row: any) {
  if (!row) return row
  const attendees = asArray(row.attendees)
  const decisions = asArray(row.decisions)
  const actionItems = asArray(row.action_items ?? row.actionItems)
  const attendeeEmails = emailsFrom(row.attendee_emails)
  const startsAt = row.starts_at || null
  const meetingDate = row.meeting_date || row.date || meetingDateFromStart(startsAt)
  return {
    ...row,
    date: meetingDate,
    meeting_date: meetingDate,
    starts_at: startsAt,
    ends_at: row.ends_at || null,
    location: row.location || null,
    meeting_url: row.meeting_url || null,
    reminder_minutes: Number.isFinite(Number(row.reminder_minutes)) ? Number(row.reminder_minutes) : 60,
    reminder_sent_at: row.reminder_sent_at || null,
    invite_sent_at: row.invite_sent_at || null,
    notes: row.notes ?? row.agenda ?? '',
    status: inferMeetingStatus(row),
    attendees,
    attendee_emails: attendeeEmails,
    decisions,
    actionItems,
    action_items: actionItems,
    project_name: row.projects?.name || row.project_name || null,
  }
}

export function reminderAlreadyDue(startsAtIso: string, reminderMinutes: number, now = Date.now()): boolean {
  if (!reminderMinutes || reminderMinutes <= 0) return false
  const start = new Date(startsAtIso).getTime()
  if (Number.isNaN(start)) return false
  return now >= start - reminderMinutes * 60 * 1000
}

export function reminderIsDue(
  startsAtIso: string,
  reminderMinutes: number,
  now = Date.now(),
  graceAfterStartMs = 15 * 60 * 1000
): boolean {
  if (!reminderMinutes || reminderMinutes <= 0) return false
  const start = new Date(startsAtIso).getTime()
  if (Number.isNaN(start)) return false
  const remindAt = start - reminderMinutes * 60 * 1000
  return now >= remindAt && now < start + graceAfterStartMs
}
