import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

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

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const status = url.searchParams.get('status') || 'open'
  const marketplaceOnly = url.searchParams.get('marketplace') === '1'
  const role = auth.profile.role


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
  if (error) return json({ error: error.message }, { status: 500 })

  const tenders = (data || []).map(mapTender)

  // Contractors need to know which projects they have already bid on
  if (role === 'contractor' && tenders.length > 0) {
    const { data: contractor } = await auth.supabase
      .from('contractors')
      .select('id')
      .eq('user_id', auth.profile.id)
      .maybeSingle()
    if (contractor) {
      const { data: myBids } = await auth.supabase
        .from('bids')
        .select('id, tender_id, amount, status, timeline_weeks, created_at')
        .eq('contractor_id', contractor.id)
        .in(
          'tender_id',
          tenders.map((t: any) => t.id)
        )
      const byTender = new Map((myBids || []).map((b: any) => [b.tender_id, b]))
      tenders.forEach((t: any) => {
        t.my_bid = byTender.get(t.id) || null
      })
    }
  }

  return json({ tenders })
}

const handlePOST = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Only architects can post tenders' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.title || !body.project_id) {
    return json({ error: 'title and project_id required' }, { status: 400 })
  }

  const services: string[] = Array.isArray(body.services)
    ? body.services.map((s: string) => String(s).trim()).filter(Boolean)
    : body.trade_type
      ? [String(body.trade_type)]
      : []


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
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ tender: mapTender(data) }, { status: 201 })
}

export const Route = createFileRoute('/api/tenders')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
    },
  },
})
