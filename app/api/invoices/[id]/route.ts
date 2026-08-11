import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_INVOICES } from '@/lib/data/mock-store'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  for (const key of ['status', 'notes', 'due_date', 'paid_at']) {
    if (key in body) updates[key] = body[key]
  }
  if (body.status === 'paid' && !updates.paid_at) {
    updates.paid_at = new Date().toISOString()
  }

  if (shouldServeMockData(auth)) {
    const idx = MOCK_INVOICES.findIndex((i) => i.id === id)
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    Object.assign(MOCK_INVOICES[idx], updates)
    return NextResponse.json({ invoice: MOCK_INVOICES[idx] })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .eq('org_id', auth.orgId)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoice: data })
}
