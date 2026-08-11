import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_TENDERS } from '@/lib/data/mock-store'

function mapTender(row: any) {
  if (!row) return row
  const project = row.projects
  return {
    ...row,
    project_name: row.project_name || project?.name || 'Project',
    city: row.city || project?.city || '',
    services: Array.isArray(row.services) ? row.services : row.trade_type ? [row.trade_type] : [],
    projects: undefined,
  }
}

export async function GET(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const status = url.searchParams.get('status') || 'open'
  const marketplaceOnly = url.searchParams.get('marketplace') === '1'
  const role = auth.profile.role

  if (shouldServeMockData(auth)) {
    let tenders = MOCK_TENDERS as any[]
    if (status !== 'all') tenders = tenders.filter((t) => t.status === status)
    if (marketplaceOnly || role === 'contractor') {
      tenders = tenders.filter((t) => (t.visibility || 'public') === 'public' && t.status === 'open')
    }
    return NextResponse.json({ tenders: tenders.map(mapTender) })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  // Contractors/vendors: only public open project cards for bidding
  const forMarketplace = marketplaceOnly || role === 'contractor'

  let query = auth.supabase
    .from('tenders')
    .select('*, projects(name, city)')
    .order('created_at', { ascending: false })

  if (forMarketplace) {
    query = query.eq('visibility', 'public').eq('status', 'open')
  } else if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tenders: (data || []).map(mapTender) })
}

export async function POST(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Only architects can post tenders' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.title || !body.project_id) {
    return NextResponse.json({ error: 'title and project_id required' }, { status: 400 })
  }

  const services: string[] = Array.isArray(body.services)
    ? body.services.map((s: string) => String(s).trim()).filter(Boolean)
    : body.trade_type
      ? [String(body.trade_type)]
      : []

  if (shouldServeMockData(auth)) {
    const tender = {
      id: `tender-${Date.now()}`,
      org_id: auth.orgId || 'mock-org-id',
      project_id: body.project_id,
      title: body.title,
      scope: body.scope || '',
      trade_type: services[0] || body.trade_type || 'Civil',
      services,
      budget_min: body.budget_min,
      budget_max: body.budget_max,
      timeline_weeks: body.timeline_weeks,
      deadline: body.deadline,
      visibility: body.visibility || 'public',
      status: 'open',
      awarded_bid_id: null,
      project_name: body.project_name || 'Project',
      city: body.city || '',
    }
    MOCK_TENDERS.unshift(tender as any)
    return NextResponse.json({ tender: mapTender(tender) }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const { data: project } = await auth.supabase
    .from('projects')
    .select('name, city')
    .eq('id', body.project_id)
    .maybeSingle()

  const { data, error } = await auth.supabase
    .from('tenders')
    .insert({
      org_id: auth.orgId,
      project_id: body.project_id,
      title: body.title,
      scope: body.scope,
      trade_type: services[0] || body.trade_type || 'Civil',
      services,
      project_name: body.project_name || project?.name || body.title,
      city: body.city || project?.city || null,
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
  return NextResponse.json({ tender: mapTender(data) }, { status: 201 })
}
