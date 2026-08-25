import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_RFIS } from '@/lib/data/mock-store'
import { notifyUser } from '@/lib/notifications/notify'
import { send } from '@/lib/email/resend'
import { RFICreatedEmail } from '@/lib/email/templates'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({ rfis: MOCK_RFIS.filter((r) => r.project_id === id) })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('rfis')
    .select('*')
    .eq('project_id', id)
    .order('rfi_number', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rfis: data || [] })
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  if (shouldServeMockData(auth)) {
    const nextNum =
      Math.max(0, ...MOCK_RFIS.filter((r) => r.project_id === id).map((r) => r.rfi_number)) + 1
    const rfi = {
      id: `rfi-${Date.now()}`,
      project_id: id,
      rfi_number: nextNum,
      title: body.title,
      description: body.description || '',
      drawing_ref: body.drawing_ref || null,
      attachment_url: body.attachment_url || null,
      status: 'open',
      due_date: body.due_date || null,
      assigned_to: body.assigned_to || null,
      created_at: new Date().toISOString(),
    }
    MOCK_RFIS.unshift(rfi as any)
    return NextResponse.json({ rfi }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data: project } = await auth.supabase
    .from('projects')
    .select('org_id')
    .eq('id', id)
    .single()

  const { data: last } = await auth.supabase
    .from('rfis')
    .select('rfi_number')
    .eq('project_id', id)
    .order('rfi_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await auth.supabase
    .from('rfis')
    .insert({
      project_id: id,
      org_id: project?.org_id || auth.orgId,
      rfi_number: (last?.rfi_number || 0) + 1,
      title: body.title,
      description: body.description,
      drawing_ref: body.drawing_ref,
      attachment_url: body.attachment_url || null,
      due_date: body.due_date,
      raised_by: auth.profile.full_name || auth.profile.id,
      assigned_to: body.assigned_to || null,
      status: 'open',
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await auth.supabase.from('activity_log').insert({
    project_id: id,
    org_id: project?.org_id || auth.orgId,
    user_id: auth.profile.id,
    action: 'rfi.created',
    entity_type: 'rfi',
    entity_id: data.id,
    entity_name: data.title,
  })

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.5bloc.com').replace(/\/$/, '')
  const viewUrl = `${appUrl}/projects/${id}/rfis`
  const dueLabel = data.due_date || 'Not set'
  const rfiHtml = RFICreatedEmail(
    data.rfi_number,
    data.title,
    data.description || '',
    dueLabel,
    viewUrl
  )

  // assigned_to may be email, uuid, or a display name
  if (data.assigned_to && String(data.assigned_to).includes('@')) {
    try {
      await send(
        String(data.assigned_to),
        `New RFI #${data.rfi_number}: ${data.title}`,
        rfiHtml
      )
    } catch (e) {
      console.warn('RFI email (assigned_to) failed:', e)
    }
  }

  // Notify + email when assigned_to looks like a profile uuid
  if (data.assigned_to && /^[0-9a-f-]{36}$/i.test(String(data.assigned_to))) {
    await notifyUser(auth.supabase, {
      userId: data.assigned_to,
      title: 'New RFI assigned',
      body: data.title,
      type: 'rfi',
      href: `/projects/${id}/rfis`,
    })
    try {
      const { data: assignee } = await auth.supabase
        .from('profiles')
        .select('email')
        .eq('id', data.assigned_to)
        .maybeSingle()
      if (assignee?.email) {
        await send(
          assignee.email,
          `New RFI #${data.rfi_number}: ${data.title}`,
          rfiHtml
        )
      }
    } catch (e) {
      console.warn('RFI email (profile) failed:', e)
    }
  }

  return NextResponse.json({ rfi: data }, { status: 201 })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.rfi_id) return NextResponse.json({ error: 'rfi_id required' }, { status: 400 })

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  for (const key of [
    'title',
    'description',
    'status',
    'response',
    'due_date',
    'assigned_to',
    'drawing_ref',
    'attachment_url',
    'is_scope_change',
    'scope_change_amount',
    'ai_draft_response',
  ]) {
    if (key in body) updates[key] = body[key]
  }

  if (body.response != null) {
    updates.responded_by = auth.profile.id
    updates.responded_at = new Date().toISOString()
    if (!body.status) updates.status = 'answered'
  }

  if (shouldServeMockData(auth)) {
    const rfi = MOCK_RFIS.find((r) => r.id === body.rfi_id && r.project_id === id)
    if (!rfi) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    Object.assign(rfi, updates)
    return NextResponse.json({ rfi })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('rfis')
    .update(updates)
    .eq('id', body.rfi_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.response != null) {
    await auth.supabase.from('activity_log').insert({
      project_id: id,
      org_id: auth.orgId,
      user_id: auth.profile.id,
      action: 'rfi.answered',
      entity_type: 'rfi',
      entity_id: data.id,
      entity_name: data.title,
    })
    if (data.raised_by && data.raised_by !== auth.profile.id) {
      await notifyUser(auth.supabase, {
        userId: data.raised_by,
        title: 'RFI answered',
        body: data.title,
        type: 'rfi',
        href: `/projects/${id}/rfis`,
      })
    }
  }

  return NextResponse.json({ rfi: data })
}
