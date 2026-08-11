import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_CLIENTS, MOCK_PROJECTS } from '@/lib/data/mock-store'

type Ctx = { params: Promise<{ id: string }> }

function normalizeNotesLog(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    } catch {
      return []
    }
  }
  return []
}

function appendNoteEntry(existing: any[], entry: { type?: string; summary: string }) {
  const stamp = new Date().toISOString().slice(0, 10)
  return [
    {
      id: `log-${Date.now()}`,
      type: entry.type || 'note',
      summary: entry.summary,
      date: stamp,
    },
    ...existing,
  ]
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (shouldServeMockData(auth)) {
    const client = MOCK_CLIENTS.find((c) => c.id === id)
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const notes_log = normalizeNotesLog((client as any).notes_log || (client as any).comm_logs)
    const projects = MOCK_PROJECTS.filter((p) => p.client_id === id).map((p) => ({
      id: p.id,
      name: p.name,
      phase: p.phase,
      status: p.status,
      portal_token: (p as any).portal_token || null,
      portal_enabled: (p as any).portal_enabled || false,
    }))
    return NextResponse.json({
      client: {
        ...client,
        notes: (client as any).notes || '',
        notes_log,
      },
      projects,
      notes_log,
      commLogs: notes_log,
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data: client, error } = await auth.supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('org_id', auth.orgId)
    .single()
  if (error || !client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const notes_log = normalizeNotesLog((client as any).notes_log)

  const { data: projects } = await auth.supabase
    .from('projects')
    .select('id, name, phase, phase_key, status, portal_token, portal_enabled')
    .eq('client_id', id)

  return NextResponse.json({
    client: {
      ...client,
      full_name: client.full_name || client.name,
      notes_log,
    },
    projects: (projects || []).map((p: any) => ({
      ...p,
      phase: p.phase_key || p.phase,
    })),
    notes_log,
    commLogs: notes_log,
  })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const allowed = [
    'full_name',
    'name',
    'email',
    'phone',
    'company',
    'city',
    'state',
    'notes',
    'pipeline_stage',
    'total_value',
    'last_contact',
  ]

  if (shouldServeMockData(auth)) {
    const idx = MOCK_CLIENTS.findIndex((c) => c.id === id)
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    for (const key of allowed) {
      if (key in body) (MOCK_CLIENTS[idx] as any)[key] = body[key]
    }
    if ('full_name' in body) (MOCK_CLIENTS[idx] as any).full_name = body.full_name
    if ('name' in body && !('full_name' in body)) {
      ;(MOCK_CLIENTS[idx] as any).full_name = body.name
    }

    const existingLog = normalizeNotesLog(
      (MOCK_CLIENTS[idx] as any).notes_log || (MOCK_CLIENTS[idx] as any).comm_logs
    )
    if (body.comm_log || body.notes_log_entry) {
      const entry = body.comm_log || body.notes_log_entry
      const next = appendNoteEntry(existingLog, entry)
      ;(MOCK_CLIENTS[idx] as any).notes_log = next
      ;(MOCK_CLIENTS[idx] as any).comm_logs = next
      ;(MOCK_CLIENTS[idx] as any).last_contact = next[0].date
    }

    const notes_log = normalizeNotesLog(
      (MOCK_CLIENTS[idx] as any).notes_log || (MOCK_CLIENTS[idx] as any).comm_logs
    )
    return NextResponse.json({
      client: { ...MOCK_CLIENTS[idx], notes_log },
      notes_log,
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  if ('full_name' in updates) updates.name = updates.full_name
  if ('name' in updates && !('full_name' in updates)) updates.full_name = updates.name

  if (body.comm_log || body.notes_log_entry) {
    const entry = body.comm_log || body.notes_log_entry
    const { data: existing } = await auth.supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    const existingLog = normalizeNotesLog((existing as any)?.notes_log)
    const next = appendNoteEntry(existingLog, entry)
    updates.notes_log = next
    updates.last_contact = next[0].date
    // Keep plain notes in sync for schemas without notes_log column fallback
    const line = `[${next[0].date}] ${entry.type || 'note'}: ${entry.summary}`
    if (!('notes' in body)) {
      updates.notes = existing?.notes ? `${existing.notes}\n${line}` : line
    }
  } else if ('pipeline_stage' in updates && !('last_contact' in updates)) {
    updates.last_contact = new Date().toISOString().slice(0, 10)
  }

  let { data, error } = await auth.supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .eq('org_id', auth.orgId)
    .select()
    .single()

  // If notes_log column is missing, retry without it
  if (error && 'notes_log' in updates && /notes_log/i.test(error.message)) {
    const { notes_log: _drop, ...withoutLog } = updates as any
    const retry = await auth.supabase
      .from('clients')
      .update(withoutLog)
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .select()
      .single()
    data = retry.data
    error = retry.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const notes_log = normalizeNotesLog((data as any).notes_log || updates.notes_log)
  return NextResponse.json({
    client: { ...data, full_name: data.full_name || data.name, notes_log },
    notes_log,
  })
}
