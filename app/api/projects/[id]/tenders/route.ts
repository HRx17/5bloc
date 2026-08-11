import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_TENDERS } from '@/lib/data/mock-store'

/** Create a tender scoped to a project (architect). */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const services: string[] = Array.isArray(body.services)
    ? body.services.map((s: string) => String(s).trim()).filter(Boolean)
    : body.trade_type
      ? [String(body.trade_type)]
      : ['Civil']

  if (shouldServeMockData(auth)) {
    const tender = {
      id: `tender-${Date.now()}`,
      project_id: projectId,
      org_id: auth.orgId || 'mock-org-id',
      title: body.title,
      scope: body.scope || '',
      trade_type: services[0] || 'Civil',
      services,
      budget_min: body.budget_min,
      budget_max: body.budget_max,
      timeline_weeks: body.timeline_weeks,
      deadline: body.deadline,
      visibility: 'public',
      status: 'open',
      awarded_bid_id: null,
      project_name: body.project_name || 'Project',
      city: body.city || '',
    }
    MOCK_TENDERS.unshift(tender as any)
    return NextResponse.json({ tender }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data: project } = await auth.supabase
    .from('projects')
    .select('id, name, city, org_id')
    .eq('id', projectId)
    .single()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const { data, error } = await auth.supabase
    .from('tenders')
    .insert({
      project_id: projectId,
      org_id: project.org_id,
      title: body.title,
      scope: body.scope,
      trade_type: services[0] || body.trade_type || 'Civil',
      services,
      project_name: body.project_name || project.name,
      city: body.city || project.city || null,
      budget_min: body.budget_min,
      budget_max: body.budget_max,
      timeline_weeks: body.timeline_weeks,
      deadline: body.deadline,
      visibility: body.visibility || 'public',
      status: 'open',
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await auth.supabase.from('activity_log').insert({
    project_id: projectId,
    org_id: project.org_id,
    user_id: auth.profile.id,
    action: 'tender.created',
    entity_type: 'tender',
    entity_id: data.id,
    entity_name: data.title,
  })

  return NextResponse.json({ tender: data }, { status: 201 })
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({
      tenders: MOCK_TENDERS.filter((t) => t.project_id === projectId),
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('tenders')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tenders: data || [] })
}
