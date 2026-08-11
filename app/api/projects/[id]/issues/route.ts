import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_ISSUES } from '@/lib/data/mock-store'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({ issues: MOCK_ISSUES.filter((i) => i.project_id === id) })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('issues')
    .select('*')
    .eq('project_id', id)
    .order('issue_number', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ issues: data || [] })
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  if (shouldServeMockData(auth)) {
    const next =
      Math.max(0, ...MOCK_ISSUES.filter((i) => i.project_id === id).map((i) => i.issue_number)) + 1
    const issue = {
      id: `iss-${Date.now()}`,
      project_id: id,
      org_id: auth.orgId || 'mock-org-id',
      issue_number: next,
      title: body.title,
      description: body.description || '',
      severity: body.severity || 'medium',
      status: 'open',
      assigned_to: body.assigned_to || '',
      reported_by: auth.profile.full_name || 'Reporter',
      date_reported: new Date().toISOString().slice(0, 10),
      photo_attached: body.photo_attached || null,
    }
    MOCK_ISSUES.unshift(issue as any)
    return NextResponse.json({ issue }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data: project } = await auth.supabase.from('projects').select('org_id').eq('id', id).single()
  const { data: last } = await auth.supabase
    .from('issues')
    .select('issue_number')
    .eq('project_id', id)
    .order('issue_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await auth.supabase
    .from('issues')
    .insert({
      project_id: id,
      org_id: project?.org_id || auth.orgId,
      issue_number: (last?.issue_number || 0) + 1,
      title: body.title,
      description: body.description || null,
      severity: body.severity || 'medium',
      status: 'open',
      assigned_to: body.assigned_to || null,
      reported_by: auth.profile.full_name || null,
      date_reported: new Date().toISOString().slice(0, 10),
      photo_attached: body.photo_attached || null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ issue: data }, { status: 201 })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.issue_id) return NextResponse.json({ error: 'issue_id required' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ['status', 'severity', 'assigned_to', 'description', 'title']) {
    if (key in body) updates[key] = body[key]
  }

  if (shouldServeMockData(auth)) {
    const idx = MOCK_ISSUES.findIndex((i) => i.id === body.issue_id && i.project_id === id)
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    Object.assign(MOCK_ISSUES[idx], updates)
    return NextResponse.json({ issue: MOCK_ISSUES[idx] })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('issues')
    .update(updates)
    .eq('id', body.issue_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ issue: data })
}
