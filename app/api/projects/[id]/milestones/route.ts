import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_MILESTONES } from '@/lib/data/mock-store'
import { milestoneRead, milestoneWrite } from '@/lib/supabase/schema-map'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({
      milestones: MOCK_MILESTONES.filter((m) => m.project_id === id),
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('phase_milestones')
    .select('*')
    .eq('project_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ milestones: (data || []).map(milestoneRead) })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect' && auth.profile.role !== 'builder') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.phase) return NextResponse.json({ error: 'phase required' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of [
    'milestone_date',
    'completion_pct',
    'fee_amount',
    'fee_paid',
    'notes',
    'rera_certified',
  ]) {
    if (key in body) updates[key] = body[key]
  }
  Object.assign(updates, milestoneWrite(updates))

  if (shouldServeMockData(auth)) {
    const m = MOCK_MILESTONES.find((x) => x.project_id === id && x.phase === body.phase)
    if (!m) {
      const created = {
        id: `ms-${Date.now()}`,
        project_id: id,
        phase: body.phase,
        milestone_date: body.milestone_date || null,
        completion_pct: body.completion_pct ?? 0,
        fee_amount: body.fee_amount ?? 0,
        fee_paid: body.fee_paid ?? false,
        notes: body.notes || '',
        rera_certified: body.rera_certified ?? false,
      }
      MOCK_MILESTONES.push(created as any)
      return NextResponse.json({ milestone: created })
    }
    Object.assign(m, updates)
    return NextResponse.json({ milestone: m })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('phase_milestones')
    .update(updates)
    .eq('project_id', id)
    .eq('phase_key', body.phase)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await auth.supabase.from('activity_log').insert({
    project_id: id,
    org_id: auth.orgId,
    user_id: auth.profile.id,
    action: 'milestone.updated',
    entity_type: 'phase_milestone',
    entity_id: data.id,
    entity_name: body.phase,
    metadata: updates,
  })

  return NextResponse.json({ milestone: milestoneRead(data) })
}
