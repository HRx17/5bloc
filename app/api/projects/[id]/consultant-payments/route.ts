import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
type Ctx = { params: Promise<{ id: string }> }

const MOCK: Record<string, any[]> = {}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({ payments: MOCK[id] || [] })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('consultant_payments')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ payments: data || [] })
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.consultant_name || body.amount == null) {
    return NextResponse.json({ error: 'consultant_name and amount required' }, { status: 400 })
  }

  if (shouldServeMockData(auth)) {
    const row = {
      id: `cp-${Date.now()}`,
      project_id: id,
      consultant_name: body.consultant_name,
      discipline: body.discipline || 'Structural',
      milestone_phase: body.milestone_phase || '',
      amount: Number(body.amount),
      status: body.status || 'pending',
      due_date: body.due_date || null,
      paid_date: null,
    }
    MOCK[id] = [row, ...(MOCK[id] || [])]
    return NextResponse.json({ payment: row }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data: project } = await auth.supabase.from('projects').select('org_id').eq('id', id).single()
  const { data, error } = await auth.supabase
    .from('consultant_payments')
    .insert({
      project_id: id,
      org_id: project?.org_id || auth.orgId,
      consultant_name: body.consultant_name,
      discipline: body.discipline || 'Structural',
      milestone_phase: body.milestone_phase || null,
      amount: Number(body.amount),
      status: body.status || 'pending',
      due_date: body.due_date || null,
      created_by: auth.profile.id,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ payment: data }, { status: 201 })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.payment_id) return NextResponse.json({ error: 'payment_id required' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.status) {
    updates.status = body.status
    if (body.status === 'paid') {
      updates.paid_date = body.paid_date || new Date().toISOString().slice(0, 10)
    }
  }
  for (const key of ['consultant_name', 'discipline', 'milestone_phase', 'amount', 'due_date', 'paid_date']) {
    if (key in body) updates[key] = body[key]
  }

  if (shouldServeMockData(auth)) {
    const list = MOCK[id] || []
    const idx = list.findIndex((p) => p.id === body.payment_id)
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    Object.assign(list[idx], updates)
    return NextResponse.json({ payment: list[idx] })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('consultant_payments')
    .update(updates)
    .eq('id', body.payment_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ payment: data })
}
