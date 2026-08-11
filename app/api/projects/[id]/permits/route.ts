import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_PERMITS } from '@/lib/data/mock-store'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({ permits: MOCK_PERMITS.filter((p) => p.project_id === id) })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('permits')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ permits: data || [] })
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['architect', 'builder'].includes(auth.profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.approval_name) {
    return NextResponse.json({ error: 'approval_name required' }, { status: 400 })
  }

  if (shouldServeMockData(auth)) {
    const permit = {
      id: `p-${Date.now()}`,
      project_id: id,
      org_id: auth.orgId || 'mock-org-id',
      approval_name: body.approval_name,
      authority: body.authority || '',
      status: body.status || 'not_started',
      submission_date: body.submission_date || null,
      expiry_date: body.expiry_date || null,
      notes: body.notes || '',
    }
    MOCK_PERMITS.push(permit as any)
    return NextResponse.json({ permit }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data: project } = await auth.supabase.from('projects').select('org_id').eq('id', id).single()
  const { data, error } = await auth.supabase
    .from('permits')
    .insert({
      project_id: id,
      org_id: project?.org_id || auth.orgId,
      approval_name: body.approval_name,
      authority: body.authority || null,
      status: body.status || 'not_started',
      submission_date: body.submission_date || null,
      expiry_date: body.expiry_date || null,
      notes: body.notes || null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ permit: data }, { status: 201 })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.permit_id) return NextResponse.json({ error: 'permit_id required' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ['status', 'notes', 'submission_date', 'expiry_date', 'authority', 'approval_name']) {
    if (key in body) updates[key] = body[key]
  }

  if (shouldServeMockData(auth)) {
    const idx = MOCK_PERMITS.findIndex((p) => p.id === body.permit_id && p.project_id === id)
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    Object.assign(MOCK_PERMITS[idx], updates)
    return NextResponse.json({ permit: MOCK_PERMITS[idx] })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('permits')
    .update(updates)
    .eq('id', body.permit_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ permit: data })
}
