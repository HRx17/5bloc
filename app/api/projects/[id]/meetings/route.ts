import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_MEETINGS } from '@/lib/data/mock-store'

type Ctx = { params: Promise<{ id: string }> }

function asArray(value: unknown): any[] {
  if (Array.isArray(value)) return value
  if (value == null || value === '') return []
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // fall through — treat as comma/newline list
    }
    return value
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function normalizeMeeting(row: any) {
  if (!row) return row
  const attendees = asArray(row.attendees)
  const decisions = asArray(row.decisions)
  const actionItems = asArray(row.action_items ?? row.actionItems)
  return {
    ...row,
    date: row.meeting_date || row.date,
    notes: row.notes ?? row.agenda ?? '',
    status: row.status || 'recorded',
    attendees,
    decisions,
    actionItems,
    action_items: actionItems,
  }
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


  const { data, error } = await auth.supabase
    .from('meetings')
    .select('*')
    .eq('project_id', id)
    .order('meeting_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ meetings: (data || []).map(normalizeMeeting) })
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const attendees = asArray(body.attendees)
  const decisions = asArray(body.decisions)
  const actionItems = asArray(body.action_items || body.actionItems)
  const notes = body.notes ?? body.agenda ?? ''

  if (shouldServeMockData(auth)) {
    const meeting = {
      id: `meet-${Date.now()}`,
      project_id: id,
      org_id: auth.orgId || 'mock-org-id',
      title: body.title,
      meeting_date: body.date || body.meeting_date || new Date().toISOString().slice(0, 10),
      attendees,
      agenda: notes,
      notes,
      status: body.status || 'recorded',
      decisions,
      action_items: actionItems,
    }
    MOCK_MEETINGS.unshift(meeting as any)
    return NextResponse.json({ meeting: normalizeMeeting(meeting) }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data: project } = await auth.supabase.from('projects').select('org_id').eq('id', id).single()
  const { data, error } = await auth.supabase
    .from('meetings')
    .insert({
      project_id: id,
      org_id: project?.org_id || auth.orgId,
      title: body.title,
      meeting_date: body.date || body.meeting_date || new Date().toISOString().slice(0, 10),
      attendees,
      agenda: notes || null,
      decisions,
      action_items: actionItems,
      created_by: auth.profile.id,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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
  if ('decisions' in body) updates.decisions = asArray(body.decisions)
  if ('actionItems' in body || 'action_items' in body) {
    updates.action_items = asArray(body.action_items ?? body.actionItems)
  }
  if ('title' in body) updates.title = body.title

  if (shouldServeMockData(auth)) {
    const idx = MOCK_MEETINGS.findIndex((m) => m.id === body.meeting_id && m.project_id === id)
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    Object.assign(MOCK_MEETINGS[idx], updates)
    return NextResponse.json({ meeting: normalizeMeeting(MOCK_MEETINGS[idx]) })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  // Schema may not have notes/status — only push known columns
  const dbUpdates: Record<string, unknown> = { updated_at: updates.updated_at }
  if ('agenda' in updates) dbUpdates.agenda = updates.agenda
  if ('attendees' in updates) dbUpdates.attendees = updates.attendees
  if ('decisions' in updates) dbUpdates.decisions = updates.decisions
  if ('action_items' in updates) dbUpdates.action_items = updates.action_items
  if ('title' in updates) dbUpdates.title = updates.title

  const { data, error } = await auth.supabase
    .from('meetings')
    .update(dbUpdates)
    .eq('id', body.meeting_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const meeting = normalizeMeeting({
    ...data,
    notes: (updates.notes as string) ?? data.agenda,
    status: (updates.status as string) || 'recorded',
  })
  return NextResponse.json({ meeting })
}
