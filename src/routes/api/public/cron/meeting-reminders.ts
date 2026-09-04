import { createFileRoute } from '@tanstack/react-router'
import { json } from '@/lib/api/get-user.server'
import { createServiceRoleClient, hasValidServiceRoleKey } from '@/lib/supabase/server'
import { notifyMeetingAttendees } from '@/lib/meetings/notify'
import { reminderIsDue } from '@/lib/meetings/normalize'

export const dynamic = 'force-dynamic'

function isAuthorized(request: Request) {
  const secret = process.env['CRON_SECRET']?.trim()
  const bearer = request.headers.get('authorization')
  if (secret) return bearer === `Bearer ${secret}`
  return false
}

const handleGET = async ({ request }: any) => {
  if (!isAuthorized(request)) {
    return json(
      { error: 'Unauthorized. Set CRON_SECRET and send Authorization: Bearer <secret>.' },
      { status: 401 },
    )
  }
  if (!hasValidServiceRoleKey()) {
    return json({ error: 'Service role is not configured' }, { status: 503 })
  }

  const supabase: any = createServiceRoleClient()
  const { data, error } = await supabase
    .from('meetings')
    .select('*, projects(name)')
    .is('reminder_sent_at', null)
    .not('starts_at', 'is', null)
    .limit(80)

  if (error) return json({ error: error.message }, { status: 500 })

  const due = (data || []).filter((row: any) =>
    reminderIsDue(row.starts_at, Number(row.reminder_minutes) || 0),
  )

  let sent = 0
  const failures: string[] = []

  for (const meeting of due) {
    const stamped = new Date().toISOString()
    const { error: stampError } = await supabase
      .from('meetings')
      .update({ reminder_sent_at: stamped, updated_at: stamped })
      .eq('id', meeting.id)
      .is('reminder_sent_at', null)
    if (stampError) {
      failures.push(meeting.id)
      continue
    }

    try {
      await notifyMeetingAttendees({
        supabase,
        meeting,
        projectName: meeting.projects?.name || 'Project',
        kind: 'reminder',
        excludeUserId: null,
      })
      sent += 1
    } catch (e) {
      failures.push(meeting.id)
      console.warn('meeting reminder failed', meeting.id, e)
    }
  }

  return json({ ok: true, checked: (data || []).length, due: due.length, sent, failures })
}

export const Route = createFileRoute('/api/public/cron/meeting-reminders')({
  server: {
    handlers: {
      GET: handleGET,
      POST: handleGET,
    },
  },
})
