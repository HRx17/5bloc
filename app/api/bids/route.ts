import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_BIDS, MOCK_CONTRACTORS, MOCK_TENDERS, MOCK_MEMBERS } from '@/lib/data/mock-store'
import { notifyUser } from '@/lib/notifications/notify'

export async function GET() {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    if (auth.profile.role === 'contractor') {
      const mine = MOCK_CONTRACTORS.find((c) => c.user_id === auth.profile.id)
      const bids = MOCK_BIDS.filter((b) => b.contractor_id === mine?.id)
      return NextResponse.json({ bids })
    }
    return NextResponse.json({ bids: MOCK_BIDS })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  if (auth.profile.role === 'contractor') {
    const { data: contractor } = await auth.supabase
      .from('contractors')
      .select('id')
      .eq('user_id', auth.profile.id)
      .maybeSingle()
    if (!contractor) return NextResponse.json({ bids: [] })
    const { data, error } = await auth.supabase
      .from('bids')
      .select('*, tenders(title, status, deadline)')
      .eq('contractor_id', contractor.id)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ bids: data || [] })
  }

  const { data, error } = await auth.supabase
    .from('bids')
    .select('*, tenders!inner(title, org_id), contractors(company_name)')
    .eq('tenders.org_id', auth.orgId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bids: data || [] })
}

export async function POST(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'contractor') {
    return NextResponse.json({ error: 'Only contractors can bid' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.tender_id || body.amount == null) {
    return NextResponse.json({ error: 'tender_id and amount required' }, { status: 400 })
  }
  if (!Number.isFinite(Number(body.amount)) || Number(body.amount) <= 0) {
    return NextResponse.json({ error: 'Enter a bid amount greater than zero' }, { status: 400 })
  }

  if (shouldServeMockData(auth)) {
    const contractor = MOCK_CONTRACTORS.find((c) => c.user_id === auth.profile.id)
    if (!contractor) {
      return NextResponse.json({ error: 'Complete contractor profile first' }, { status: 400 })
    }
    if (MOCK_BIDS.some((b) => b.tender_id === body.tender_id && b.contractor_id === contractor.id)) {
      return NextResponse.json({ error: 'You have already bid on this project' }, { status: 409 })
    }
    const tender = MOCK_TENDERS.find((t) => t.id === body.tender_id)
    const bid = {
      id: `bid-${Date.now()}`,
      tender_id: body.tender_id,
      contractor_id: contractor.id,
      amount: body.amount,
      timeline_weeks: body.timeline_weeks || null,
      methodology: body.methodology || '',
      status: 'submitted',
      created_at: new Date().toISOString(),
      tender_title: tender?.title || 'Tender',
    }
    MOCK_BIDS.unshift(bid as any)
    return NextResponse.json({ bid }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data: contractor } = await auth.supabase
    .from('contractors')
    .select('id')
    .eq('user_id', auth.profile.id)
    .maybeSingle()
  if (!contractor) {
    return NextResponse.json({ error: 'Complete contractor profile first' }, { status: 400 })
  }

  const { data: tender } = await auth.supabase
    .from('tenders')
    .select('id, status, title, project_name')
    .eq('id', body.tender_id)
    .maybeSingle()
  if (!tender) return NextResponse.json({ error: 'Project is no longer listed' }, { status: 404 })
  if (tender.status !== 'open') {
    return NextResponse.json({ error: 'Bidding has closed for this project' }, { status: 409 })
  }

  const { data: existing } = await auth.supabase
    .from('bids')
    .select('id')
    .eq('tender_id', body.tender_id)
    .eq('contractor_id', contractor.id)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'You have already bid on this project' }, { status: 409 })
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
    return NextResponse.json(
      { error: duplicate ? 'You have already bid on this project' : error.message },
      { status: duplicate ? 409 : 500 }
    )
  }
  return NextResponse.json(
    { bid: data, tender_title: tender.project_name || tender.title },
    { status: 201 }
  )
}

export async function PATCH(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Only architects can award bids' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.bid_id || !body.status) {
    return NextResponse.json({ error: 'bid_id and status required' }, { status: 400 })
  }
  if (!['shortlisted', 'accepted', 'rejected'].includes(body.status)) {
    return NextResponse.json({ error: 'status must be shortlisted, accepted, or rejected' }, { status: 400 })
  }

  if (shouldServeMockData(auth)) {
    const bid = MOCK_BIDS.find((b) => b.id === body.bid_id)
    if (!bid) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    bid.status = body.status
    if (body.status === 'accepted') {
      const tender = MOCK_TENDERS.find((t) => t.id === bid.tender_id)
      if (tender) {
        tender.status = 'awarded'
        ;(tender as any).awarded_bid_id = bid.id
        const contractor = MOCK_CONTRACTORS.find((c) => c.id === bid.contractor_id)
        if (contractor?.user_id && tender.project_id) {
          const exists = MOCK_MEMBERS.some(
            (m) => m.project_id === tender.project_id && m.user_id === contractor.user_id
          )
          if (!exists) {
            MOCK_MEMBERS.push({
              id: `pm-${Date.now()}`,
              project_id: tender.project_id,
              user_id: contractor.user_id,
              role: 'contractor',
              invite_email: 'contractor@5bloc.com',
              accepted_at: new Date().toISOString(),
              can_upload: true,
              can_comment: true,
              can_approve: false,
              full_name: contractor.company_name,
            })
          }
          await notifyUser(
            null,
            {
              userId: contractor.user_id,
              title: 'Bid awarded',
              body: `Your bid on ${tender.title || 'a tender'} was awarded.`,
              type: 'bid',
              href: '/contractor/bids',
            },
            { mock: true }
          )
        }
      }
    } else if (body.status === 'rejected') {
      const tender = MOCK_TENDERS.find((t) => t.id === bid.tender_id)
      const contractor = MOCK_CONTRACTORS.find((c) => c.id === bid.contractor_id)
      if (contractor?.user_id) {
        await notifyUser(
          null,
          {
            userId: contractor.user_id,
            title: 'Bid not selected',
            body: `Your bid on ${tender?.title || 'a tender'} was not selected.`,
            type: 'bid',
            href: '/contractor/bids',
          },
          { mock: true }
        )
      }
    }
    return NextResponse.json({ bid })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data: bid, error } = await auth.supabase
    .from('bids')
    .update({ status: body.status, rejection_note: body.rejection_note || null })
    .eq('id', body.bid_id)
    .select('*, tenders(*)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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

  return NextResponse.json({ bid })
}
