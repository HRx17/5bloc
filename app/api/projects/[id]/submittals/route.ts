import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_SUBMITTALS } from '@/lib/data/mock-store'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({
      submittals: MOCK_SUBMITTALS.filter((s) => s.project_id === id),
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('submittals')
    .select('*')
    .eq('project_id', id)
    .order('submittal_number', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ submittals: data || [] })
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = auth.profile.role
  if (!['architect', 'contractor', 'builder', 'consultant'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  if (shouldServeMockData(auth)) {
    const nextNum =
      Math.max(0, ...MOCK_SUBMITTALS.filter((s) => s.project_id === id).map((s) => s.submittal_number)) +
      1
    const sub = {
      id: `sub-${Date.now()}`,
      project_id: id,
      org_id: auth.orgId || 'mock-org-id',
      submittal_number: nextNum,
      title: body.title,
      spec_section: body.spec_section || '',
      contractor: body.contractor || auth.profile.full_name || 'Contractor',
      status: 'pending',
      due_date: body.due_date || null,
      revision: 0,
      description: body.description || '',
      file_name: body.file_name || null,
      review_note: null,
      created_at: new Date().toISOString(),
    }
    MOCK_SUBMITTALS.unshift(sub as any)
    return NextResponse.json({ submittal: sub }, { status: 201 })
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
    .from('submittals')
    .select('submittal_number')
    .eq('project_id', id)
    .order('submittal_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await auth.supabase
    .from('submittals')
    .insert({
      project_id: id,
      org_id: project?.org_id || auth.orgId,
      submittal_number: (last?.submittal_number || 0) + 1,
      title: body.title,
      spec_section: body.spec_section || null,
      contractor: body.contractor || auth.profile.full_name || null,
      description: body.description || null,
      due_date: body.due_date || null,
      file_name: body.file_name || null,
      status: 'pending',
      revision: 0,
      submitted_by: auth.profile.id,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await auth.supabase.from('activity_log').insert({
    project_id: id,
    org_id: project?.org_id || auth.orgId,
    user_id: auth.profile.id,
    action: 'submittal.created',
    entity_type: 'submittal',
    entity_id: data.id,
    entity_name: data.title,
  })

  return NextResponse.json({ submittal: data }, { status: 201 })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.submittal_id) {
    return NextResponse.json({ error: 'submittal_id required' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  for (const key of ['status', 'review_note', 'file_name', 'description', 'due_date', 'revision']) {
    if (key in body) updates[key] = body[key]
  }

  const reviewing = ['approved', 'rejected', 'revise_resubmit', 'under_review'].includes(
    String(body.status || '')
  )
  if (reviewing) {
    if (!['architect', 'builder', 'consultant'].includes(auth.profile.role)) {
      return NextResponse.json({ error: 'Only reviewers can change status' }, { status: 403 })
    }
    updates.reviewed_by = auth.profile.id
    updates.reviewed_at = new Date().toISOString()
  }

  if (shouldServeMockData(auth)) {
    const idx = MOCK_SUBMITTALS.findIndex((s) => s.id === body.submittal_id && s.project_id === id)
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    Object.assign(MOCK_SUBMITTALS[idx], updates)
    return NextResponse.json({ submittal: MOCK_SUBMITTALS[idx] })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('submittals')
    .update(updates)
    .eq('id', body.submittal_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await auth.supabase.from('activity_log').insert({
    project_id: id,
    org_id: auth.orgId,
    user_id: auth.profile.id,
    action: 'submittal.reviewed',
    entity_type: 'submittal',
    entity_id: data.id,
    entity_name: data.title,
    metadata: { status: data.status },
  })

  return NextResponse.json({ submittal: data })
}
