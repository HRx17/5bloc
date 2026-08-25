import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_MEETINGS } from '@/lib/data/mock-store'
import { notifyMeetingAttendees } from '@/lib/meetings/notify'
import {
  asArray,
  defaultEndsAt,
  emailsFrom,
  meetingDateFromStart,
  normalizeMeeting,
  reminderAlreadyDue,
} from '@/lib/meetings/normalize'

type Ctx = { params: Promise<{ id: string }> }

function parseReminderMinutes(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return 60
  return Math.min(Math.round(n), 10080)
}

function buildInsertPayload(id: string, orgId: string | null | undefined, createdBy: string, body: any) {
  const attendees = asArray(body.attendees)
  const decisions = asArray(body.decisions)
  const actionItems = asArray(body.action_items || body.actionItems)
  const notes = body.notes ?? body.agenda ?? ''
  const startsAt = body.starts_at || null
  const meetingDate = meetingDateFromStart(startsAt, body.date || body.meeting_date)
  const reminderMinutes = parseReminderMinutes(body.reminder_minutes)
  const status = body.status || (startsAt ? 'scheduled' : 'recorded')
  const attendeeEmails = emailsFrom(body.attendee_emails)

  const base = {
    project_id: id,
    org_id: orgId,
    title: body.title,
    meeting_date: meetingDate,
    attendees,
    agenda: notes || null,
    decisions,
    action_items: actionItems,
    created_by: createdBy,
  }

  const scheduled = {
    ...base,
    starts_at: startsAt,
    ends_at: body.ends_at || (startsAt ? defaultEndsAt(startsAt) : null),
    location: body.location || null,
    meeting_url: body.meeting_url || null,
    reminder_minutes: reminderMinutes,
    reminder_sent_at:
      startsAt && reminderAlreadyDue(startsAt, reminderMinutes) ? new Date().toISOString() : null,
    invite_sent_at: status === 'scheduled' ? new Date().toISOString() : null,
    status,
    attendee_emails: attendeeEmails,
    notes: notes || null,
  }

  return { base, scheduled, attendees, decisions, actionItems, notes, startsAt, meetingDate, reminderMinutes, status, attendeeEmails }
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({
      meetings: MOCK_MEETINGS.filter((m) => m.project_id === id).map(normalizeMeeting),
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  let query = auth.supabase.from('meetings').select('*').eq('project_id', id)
  let { data, error } = await query.order('starts_at', { ascending: false, nullsFirst: false })
  if (error) {
    const fallback = await auth.supabase
      .from('meetings')
      .select('*')
      .eq('project_id', id)
      .order('meeting_date', { ascending: false })
    data = fallback.data
    error = fallback.error
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ meetings: (data || []).map(normalizeMeeting) })
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const payload = buildInsertPayload(id, auth.orgId, auth.profile.id, body)

  if (shouldServeMockData(auth)) {
    const meeting = {
      id: `meet-${Date.now()}`,
      ...payload.scheduled,
      org_id: auth.orgId || 'mock-org-id',
    }
    MOCK_MEETINGS.unshift(meeting as any)
    if (payload.status === 'scheduled') {
      await notifyMeetingAttendees({
        supabase: auth.supabase,
        meeting: meeting as any,
        projectName: 'Project',
        kind: 'invite',
        excludeUserId: auth.profile.id,
        mock: true,
      })
    }
    return NextResponse.json({ meeting: normalizeMeeting(meeting) }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const { data: project } = await auth.supabase.from('projects').select('org_id, name').eq('id', id).single()
  const orgId = project?.org_id || auth.orgId
  const insertScheduled = { ...payload.scheduled, org_id: orgId }
  const insertBase = { ...payload.base, org_id: orgId }

  let { data, error } = await auth.supabase.from('meetings').insert(insertScheduled).select().single()
  if (error && /column|schema cache|starts_at|meeting_url|attendee_emails/i.test(error.message)) {
    const fallback = await auth.supabase.from('meetings').insert(insertBase).select().single()
    data = fallback.data
    error = fallback.error
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    await auth.supabase.from('activity_log').insert({
      project_id: id,
      org_id: orgId,
      user_id: auth.profile.id,
      action: payload.status === 'scheduled' ? 'meeting.scheduled' : 'meeting.recorded',
      entity_type: 'meeting',
      entity_id: data.id,
      entity_name: data.title,
    })
  } catch {
    // activity is best-effort
  }

  if (payload.status === 'scheduled') {
    await notifyMeetingAttendees({
      supabase: auth.supabase,
      meeting: data,
      projectName: project?.name || 'Project',
      kind: 'invite',
      excludeUserId: auth.profile.id,
    })
  }

  return NextResponse.json({ meeting: normalizeMeeting(data) }, { status: 201 })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.meeting_id) return NextResponse.json({ error: 'meeting_id required' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if ('notes' in body) {
    updates.notes = body.notes
    updates.agenda = body.notes
  }
  if ('agenda' in body && !('notes' in body)) {
    updates.agenda = body.agenda
    updates.notes = body.agenda
  }
  if ('status' in body) updates.status = body.status
  if ('attendees' in body) updates.attendees = asArray(body.attendees)
  if ('attendee_emails' in body) updates.attendee_emails = emailsFrom(body.attendee_emails)
  if ('decisions' in body) updates.decisions = asArray(body.decisions)
  if ('actionItems' in body || 'action_items' in body) {
    updates.action_items = asArray(body.action_items ?? body.actionItems)
  }
  if ('title' in body) updates.title = body.title
  if ('starts_at' in body) updates.starts_at = body.starts_at
  if ('ends_at' in body) updates.ends_at = body.ends_at
  if ('location' in body) updates.location = body.location
  if ('meeting_url' in body) updates.meeting_url = body.meeting_url
  if ('reminder_minutes' in body) updates.reminder_minutes = parseReminderMinutes(body.reminder_minutes)
  if ('date' in body || 'meeting_date' in body) {
    updates.meeting_date = meetingDateFromStart(
      (updates.starts_at as string) || body.starts_at,
      body.date || body.meeting_date
    )
  }
  if ('starts_at' in body || 'reminder_minutes' in body) {
    updates.reminder_sent_at = null
  }

  if (shouldServeMockData(auth)) {
    const idx = MOCK_MEETINGS.findIndex((m) => m.id === body.meeting_id && m.project_id === id)
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    Object.assign(MOCK_MEETINGS[idx], updates)
    return NextResponse.json({ meeting: normalizeMeeting(MOCK_MEETINGS[idx]) })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const dbUpdates = { ...updates }
  let { data, error } = await auth.supabase
    .from('meetings')
    .update(dbUpdates)
    .eq('id', body.meeting_id)
    .eq('project_id', id)
    .select()
    .single()

  if (error && /column|schema cache|starts_at|notes|status/i.test(error.message)) {
    const legacy: Record<string, unknown> = { updated_at: updates.updated_at }
    if ('agenda' in updates) legacy.agenda = updates.agenda
    if ('attendees' in updates) legacy.attendees = updates.attendees
    if ('decisions' in updates) legacy.decisions = updates.decisions
    if ('action_items' in updates) legacy.action_items = updates.action_items
    if ('title' in updates) legacy.title = updates.title
    if ('meeting_date' in updates) legacy.meeting_date = updates.meeting_date
    const fallback = await auth.supabase
      .from('meetings')
      .update(legacy)
      .eq('id', body.meeting_id)
      .eq('project_id', id)
      .select()
      .single()
    data = fallback.data
    error = fallback.error
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    meeting: normalizeMeeting({
      ...data,
      notes: (updates.notes as string) ?? data.notes ?? data.agenda,
      status: (updates.status as string) || data.status,
    }),
  })
}
