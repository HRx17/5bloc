import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_TRANSMITTALS } from '@/lib/data/mock-store'

type Ctx = { params: Promise<{ id: string }> }

function normalize(row: any) {
  if (!row) return row
  return {
    ...row,
    date: row.sent_date || row.date,
  }
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (shouldServeMockData(auth)) {
    return NextResponse.json({
      transmittals: MOCK_TRANSMITTALS.filter((t) => t.project_id === id).map(normalize),
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('transmittals')
    .select('*')
    .eq('project_id', id)
    .order('sent_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ transmittals: (data || []).map(normalize) })
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.recipient_name) {
    return NextResponse.json({ error: 'recipient_name required' }, { status: 400 })
  }

  if (shouldServeMockData(auth)) {
    const next = MOCK_TRANSMITTALS.filter((t) => t.project_id === id).length + 1
    const tr = {
      id: `tr-${Date.now()}`,
      project_id: id,
      org_id: auth.orgId || 'mock-org-id',
      transmittal_no: `TR-${String(next).padStart(3, '0')}`,
      sent_date: body.date || new Date().toISOString().slice(0, 10),
      recipient_name: body.recipient_name,
      recipient_company: body.recipient_company || '',
      via: body.via || 'Email',
      documents: body.documents || '',
      purpose: body.purpose || 'For Information',
      status: 'sent',
    }
    MOCK_TRANSMITTALS.unshift(tr as any)
    return NextResponse.json({ transmittal: normalize(tr) }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data: project } = await auth.supabase.from('projects').select('org_id').eq('id', id).single()
  const { count } = await auth.supabase
    .from('transmittals')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)

  const base = {
    project_id: id,
    org_id: project?.org_id || auth.orgId,
    transmittal_no: `TR-${String((count || 0) + 1).padStart(3, '0')}`,
    sent_date: body.date || new Date().toISOString().slice(0, 10),
    recipient_name: body.recipient_name,
    recipient_company: body.recipient_company || null,
    via: body.via || 'Email',
    documents: body.documents || null,
    purpose: body.purpose || 'For Information',
    status: 'sent',
    created_by: auth.profile.id,
  }

  let { data, error } = await auth.supabase
    .from('transmittals')
    .insert({ ...base, attachment_url: body.attachment_url || null })
    .select()
    .single()

  // attachment_url arrives with 20260821120000_transmittal_attachments.sql
  if (error && /attachment_url|column|schema cache/i.test(error.message)) {
    const retry = await auth.supabase.from('transmittals').insert(base).select().single()
    data = retry.data
    error = retry.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ transmittal: normalize(data) }, { status: 201 })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  if (!body.transmittal_id) {
    return NextResponse.json({ error: 'transmittal_id required' }, { status: 400 })
  }

  if (shouldServeMockData(auth)) {
    const idx = MOCK_TRANSMITTALS.findIndex((t) => t.id === body.transmittal_id && t.project_id === id)
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (body.status) MOCK_TRANSMITTALS[idx].status = body.status
    return NextResponse.json({ transmittal: normalize(MOCK_TRANSMITTALS[idx]) })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('transmittals')
    .update({ status: body.status })
    .eq('id', body.transmittal_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ transmittal: normalize(data) })
}
