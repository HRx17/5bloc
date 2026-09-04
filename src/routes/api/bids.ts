import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { notifyUser } from '@/lib/notifications/notify'

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })



  if (auth.profile.role === 'contractor') {
    const { data: contractor } = await auth.supabase
      .from('contractors')
      .select('id')
      .eq('user_id', auth.profile.id)
      .maybeSingle()
    if (!contractor) return json({ bids: [] })
    const { data, error } = await auth.supabase
      .from('bids')
      .select('*, tenders(title, status, deadline)')
      .eq('contractor_id', contractor.id)
      .order('created_at', { ascending: false })
    if (error) return json({ error: error.message }, { status: 500 })
    return json({ bids: data || [] })
  }

  const { data, error } = await auth.supabase
    .from('bids')
    .select('*, tenders!inner(title, org_id), contractors(company_name)')
    .eq('tenders.org_id', auth.orgId)
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ bids: data || [] })
}

const handlePOST = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'contractor') {
    return json({ error: 'Only contractors can bid' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.tender_id || body.amount == null) {
    return json({ error: 'tender_id and amount required' }, { status: 400 })
  }
  if (!Number.isFinite(Number(body.amount)) || Number(body.amount) <= 0) {
    return json({ error: 'Enter a bid amount greater than zero' }, { status: 400 })
  }



  const { data: contractor } = await auth.supabase
    .from('contractors')
    .select('id')
    .eq('user_id', auth.profile.id)
    .maybeSingle()
  if (!contractor) {
    return json({ error: 'Complete contractor profile first' }, { status: 400 })
  }

  const { data: tender } = await auth.supabase
    .from('tenders')
    .select('id, status, title, project_name')
    .eq('id', body.tender_id)
    .maybeSingle()
  if (!tender) return json({ error: 'Project is no longer listed' }, { status: 404 })
  if (tender.status !== 'open') {
    return json({ error: 'Bidding has closed for this project' }, { status: 409 })
  }

  const { data: existing } = await auth.supabase
    .from('bids')
    .select('id')
    .eq('tender_id', body.tender_id)
    .eq('contractor_id', contractor.id)
    .maybeSingle()
  if (existing) {
    return json({ error: 'You have already bid on this project' }, { status: 409 })
  }

  const { data, error } = await auth.supabase
    .from('bids')
    .insert({
      tender_id: body.tender_id,
      contractor_id: contractor.id,
      amount: body.amount,
      timeline_weeks: body.timeline_weeks,
      methodology: body.methodology,
      boq_url: body.boq_url,
    })
    .select()
    .single()
  if (error) {
    const duplicate = error.code === '23505'
    return json(
      { error: duplicate ? 'You have already bid on this project' : error.message },
      { status: duplicate ? 409 : 500 }
    )
  }
  return json(
    { bid: data, tender_title: tender.project_name || tender.title },
    { status: 201 }
  )
}

const handlePATCH = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Only architects can award bids' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.bid_id || !body.status) {
    return json({ error: 'bid_id and status required' }, { status: 400 })
  }
  if (!['shortlisted', 'accepted', 'rejected'].includes(body.status)) {
    return json({ error: 'status must be shortlisted, accepted, or rejected' }, { status: 400 })
  }



  const { data: bid, error } = await auth.supabase
    .from('bids')
    .update({ status: body.status, rejection_note: body.rejection_note || null })
    .eq('id', body.bid_id)
    .select('*, tenders(*)')
    .single()
  if (error) return json({ error: error.message }, { status: 500 })

  if (body.status === 'accepted' && bid.tenders) {
    await auth.supabase
      .from('tenders')
      .update({ status: 'awarded', awarded_bid_id: bid.id })
      .eq('id', bid.tender_id)

    const { data: contractor } = await auth.supabase
      .from('contractors')
      .select('user_id')
      .eq('id', bid.contractor_id)
      .single()

    if (contractor?.user_id) {
      await auth.supabase.from('project_members').upsert(
        {
          project_id: bid.tenders.project_id,
          profile_id: contractor.user_id,
          role: 'contractor',
          accepted_at: new Date().toISOString(),
          can_upload: true,
          can_comment: true,
          can_approve: false,
          invited_by: auth.profile.id,
        },
        { onConflict: 'project_id,profile_id' }
      )
      await notifyUser(auth.supabase, {
        userId: contractor.user_id,
        title: 'Bid awarded',
        body: `Your bid on ${bid.tenders.title || 'a tender'} was awarded.`,
        type: 'bid',
        href: `/projects/${bid.tenders.project_id}`,
      })
    }
  } else if (body.status === 'rejected' || body.status === 'shortlisted') {
    const { data: contractor } = await auth.supabase
      .from('contractors')
      .select('user_id')
      .eq('id', bid.contractor_id)
      .single()
    if (contractor?.user_id) {
      const shortlisted = body.status === 'shortlisted'
      await notifyUser(auth.supabase, {
        userId: contractor.user_id,
        title: shortlisted ? 'Bid shortlisted' : 'Bid not selected',
        body: shortlisted
          ? `Your bid on ${bid.tenders?.title || 'a project'} was shortlisted.`
          : `Your bid on ${bid.tenders?.title || 'a tender'} was not selected.`,
        type: 'bid',
        href: '/contractor/bids',
      })
    }
  }

  return json({ bid })
}

export const Route = createFileRoute('/api/bids')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
        PATCH: handlePATCH,
    },
  },
})
