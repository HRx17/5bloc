import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

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

const handleGET = async ({ request, params }: any) => {
  const { id } = params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }



  const { data: client, error } = await auth.supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('org_id', auth.orgId)
    .single()
  if (error || !client) return json({ error: 'Not found' }, { status: 404 })

  const notes_log = normalizeNotesLog((client as any).notes_log)

  const { data: projects } = await auth.supabase
    .from('projects')
    .select('id, name, phase, phase_key, status, portal_token, portal_enabled')
    .eq('client_id', id)

  return json({
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

const handlePATCH = async ({ request, params }: any) => {
  const { id } = params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
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

  if (error) return json({ error: error.message }, { status: 500 })
  const notes_log = normalizeNotesLog((data as any).notes_log || updates.notes_log)
  return json({
    client: { ...data, full_name: data.full_name || data.name, notes_log },
    notes_log,
  })
}

export const Route = createFileRoute('/api/clients/$id')({
  server: {
    handlers: {
        GET: handleGET,
        PATCH: handlePATCH,
    },
  },
})
