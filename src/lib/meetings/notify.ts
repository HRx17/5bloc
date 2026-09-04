import type { SupabaseClient } from '@supabase/supabase-js'
import { notifyUser } from '@/lib/notifications/notify'
import { send } from '@/lib/email/resend'
import { MeetingInviteEmail, MeetingReminderEmail } from '@/lib/email/templates'
import { emailsFrom } from '@/lib/meetings/normalize'

type MeetingRow = {
  id: string
  title: string
  project_id: string
  starts_at?: string | null
  ends_at?: string | null
  meeting_date?: string | null
  location?: string | null
  meeting_url?: string | null
  agenda?: string | null
  attendees?: string[] | null
  attendee_emails?: string[] | null
  created_by?: string | null
}

type MemberRow = {
  profile_id: string | null
  invite_email: string | null
  profiles?: { full_name?: string | null; email?: string | null; notify_meetings?: boolean | null } | null
}

export type MeetingNotifyKind = 'invite' | 'reminder'

function appUrl() {
  return (process.env['VITE_APP_URL'] || 'https://app.5bloc.com').replace(/\/$/, '')
}

export function formatMeetingWhen(startsAt?: string | null, meetingDate?: string | null): string {
  if (startsAt) {
    const d = new Date(startsAt)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    }
  }
  if (meetingDate) {
    const d = new Date(`${meetingDate}T00:00:00`)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    }
  }
  return 'Time to be confirmed'
}

async function loadMembers(supabase: SupabaseClient, projectId: string): Promise<MemberRow[]> {
  const withPrefs = await supabase
    .from('project_members')
    .select('profile_id, invite_email, profiles(full_name, email, notify_meetings)')
    .eq('project_id', projectId)
  if (!withPrefs.error) return (withPrefs.data || []) as MemberRow[]

  const fallback = await supabase
    .from('project_members')
    .select('profile_id, invite_email, profiles(full_name, email)')
    .eq('project_id', projectId)
  if (fallback.error) {
    console.warn('meeting notify: members load failed', fallback.error.message)
    return []
  }
  return (fallback.data || []) as MemberRow[]
}

function resolveRecipients(meeting: MeetingRow, members: MemberRow[]) {
  const named = new Set((meeting.attendees || []).map((n) => String(n).trim().toLowerCase()).filter(Boolean))
  const wantedEmails = new Set(emailsFrom(meeting.attendee_emails))

  const recipients: { userId?: string; email: string; name: string; notifyMeetings: boolean }[] = []
  const usedEmails = new Set<string>()

  for (const member of members) {
    const email = (member.profiles?.email || member.invite_email || '').trim().toLowerCase()
    const name = (member.profiles?.full_name || email || 'Team member').trim()
    const matched =
      (email && wantedEmails.has(email)) || (name && named.has(name.toLowerCase()))
    if (!matched) continue
    if (email) usedEmails.add(email)
    recipients.push({
      userId: member.profile_id || undefined,
      email,
      name,
      notifyMeetings: member.profiles?.notify_meetings !== false,
    })
  }

  for (const email of wantedEmails) {
    if (usedEmails.has(email)) continue
    recipients.push({ email, name: email, notifyMeetings: true })
  }

  return recipients.filter((r) => r.email || r.userId)
}

export async function notifyMeetingAttendees(opts: {
  supabase: SupabaseClient | null | undefined
  meeting: MeetingRow
  projectName: string
  kind: MeetingNotifyKind
  excludeUserId?: string | null
  mock?: boolean
}) {
  if (!opts.supabase) return { notified: 0, emailed: 0 }
  const members = await loadMembers(opts.supabase, opts.meeting.project_id)
  const recipients = resolveRecipients(opts.meeting, members).filter(
    (r) => r.userId !== opts.excludeUserId
  )

  const when = formatMeetingWhen(opts.meeting.starts_at, opts.meeting.meeting_date)
  const href = `/projects/${opts.meeting.project_id}/meetings`
  const viewUrl = `${appUrl()}${href}`
  const html =
    opts.kind === 'invite'
      ? MeetingInviteEmail({
          title: opts.meeting.title,
          projectName: opts.projectName,
          when,
          location: opts.meeting.location,
          meetingUrl: opts.meeting.meeting_url,
          agenda: opts.meeting.agenda,
          viewUrl,
        })
      : MeetingReminderEmail({
          title: opts.meeting.title,
          projectName: opts.projectName,
          when,
          location: opts.meeting.location,
          meetingUrl: opts.meeting.meeting_url,
          viewUrl,
        })

  const subject =
    opts.kind === 'invite'
      ? `Meeting scheduled: ${opts.meeting.title}`
      : `Reminder: ${opts.meeting.title} · ${when}`

  let notified = 0
  let emailed = 0

  for (const recipient of recipients) {
    if (recipient.userId) {
      await notifyUser(
        opts.supabase,
        {
          userId: recipient.userId,
          title: opts.kind === 'invite' ? 'Meeting scheduled' : 'Meeting reminder',
          body: `${opts.meeting.title} · ${when}`,
          type: 'meeting',
          href,
        },
        { mock: opts.mock }
      )
      notified += 1
    }
    if (recipient.email && recipient.notifyMeetings) {
      try {
        const result = await send(recipient.email, subject, html)
        if (!result.error) emailed += 1
      } catch (e) {
        console.warn('meeting email failed', recipient.email, e)
      }
    }
  }

  return { notified, emailed }
}
