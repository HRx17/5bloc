import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, hasValidServiceRoleKey } from '@/lib/supabase/server'
import { notifyMeetingAttendees } from '@/lib/meetings/notify'
import { reminderIsDue } from '@/lib/meetings/normalize'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  const bearer = req.headers.get('authorization')
  if (secret) return bearer === `Bearer ${secret}`
  if (process.env.NODE_ENV === 'production') return false
  return true
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized. Set CRON_SECRET and send Authorization: Bearer <secret>.' },
      { status: 401 }
    )
  }
  if (!hasValidServiceRoleKey()) {
    return NextResponse.json({ error: 'Service role is not configured' }, { status: 503 })
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('meetings')
    .select('*, projects(name)')
    .is('reminder_sent_at', null)
    .gt('reminder_minutes', 0)
    .in('status', ['scheduled'])
    .not('starts_at', 'is', null)
    .limit(80)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const due = (data || []).filter((row: any) =>
    reminderIsDue(row.starts_at, Number(row.reminder_minutes) || 0)
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

  return NextResponse.json({ ok: true, checked: (data || []).length, due: due.length, sent, failures })
}

export async function POST(req: NextRequest) {
  return GET(req)
}
