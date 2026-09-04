import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

/** Detail view of a single posted project so contractors can evaluate before bidding. */
const handleGET = async ({ request, params }: any) => {
  const { id } = (params as any)
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })


  const { data, error } = await auth.supabase
    .from('tenders')
    .select('*, projects(name, city, type, total_sqft, floors, spec_level, start_date, estimated_end)')
    .eq('id', id)
    .maybeSingle()
  if (error) return json({ error: error.message }, { status: 500 })
  if (!data) return json({ error: 'Not found' }, { status: 404 })

  const isContractor = auth.profile.role === 'contractor'
  // Contractors may only open publicly listed projects
  if (isContractor && data.visibility !== 'public') {
    return json({ error: 'Not found' }, { status: 404 })
  }

  const project: any = Array.isArray(data.projects) ? data.projects[0] : data.projects
  const tender = {
    ...data,
    project_name: data.project_name || project?.name || data.title,
    city: data.city || project?.city || '',
    services: Array.isArray(data.services) && data.services.length
      ? data.services
      : data.trade_type
        ? [data.trade_type]
        : [],
    project_type: project?.type || null,
    total_sqft: project?.total_sqft ?? null,
    floors: project?.floors ?? null,
    spec_level: project?.spec_level || null,
    start_date: project?.start_date || null,
    estimated_end: project?.estimated_end || null,
    projects: undefined,
  }

  let myBid: any = null
  if (isContractor) {
    const { data: contractor } = await auth.supabase
      .from('contractors')
      .select('id')
      .eq('user_id', auth.profile.id)
      .maybeSingle()
    if (contractor) {
      const { data: bid } = await auth.supabase
        .from('bids')
        .select('id, amount, status, timeline_weeks, methodology, created_at')
        .eq('tender_id', id)
        .eq('contractor_id', contractor.id)
        .maybeSingle()
      myBid = bid || null
    }
  }

  const { count } = await auth.supabase
    .from('bids')
    .select('id', { count: 'exact', head: true })
    .eq('tender_id', id)

  return json({ tender, my_bid: myBid, bid_count: count ?? 0 })
}

export const Route = createFileRoute('/api/tenders/$id')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})
