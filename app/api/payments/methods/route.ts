import { NextResponse } from 'next/server'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { hasSupabaseEnv, liveDataUnavailableResponse, shouldServeMockData } from '@/lib/data/mock-guard'

const MOCK_METHODS: any[] = []

function last4Of(raw: string) {
  const digits = String(raw).replace(/\D/g, '')
  return digits.slice(-4)
}

const UPI_RE = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/

export async function GET() {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({ methods: MOCK_METHODS })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const { data, error } = await auth.supabase
    .from('payment_methods')
    .select('*')
    .eq('profile_id', auth.profile.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ methods: data || [] })
}

export async function POST(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const kind: 'card' | 'upi' | 'netbanking' = body.kind || 'card'

  // Clients send only the last four digits — a full card number is never accepted or stored.
  const last4 = kind === 'card' ? last4Of(body.last4 || '') : null

  if (kind === 'upi' && !UPI_RE.test(String(body.upi_vpa || '').trim())) {
    return NextResponse.json({ error: 'Enter a valid UPI ID (name@bank)' }, { status: 400 })
  }
  if (kind === 'card' && (!last4 || last4.length !== 4)) {
    return NextResponse.json({ error: 'Card last 4 digits are required' }, { status: 400 })
  }

  const row = {
    profile_id: auth.profile.id,
    org_id: auth.orgId,
    kind,
    label: body.label || null,
    brand: kind === 'card' ? body.brand || 'Card' : null,
    last4,
    upi_vpa: kind === 'upi' ? String(body.upi_vpa).trim() : null,
    exp_month: body.exp_month ? Number(body.exp_month) : null,
    exp_year: body.exp_year ? Number(body.exp_year) : null,
    provider: 'razorpay',
    is_default: !!body.is_default,
  }

  if (shouldServeMockData(auth)) {
    const method = { id: `pm-${Date.now()}`, created_at: new Date().toISOString(), ...row }
    if (method.is_default) MOCK_METHODS.forEach((m) => (m.is_default = false))
    MOCK_METHODS.unshift(method)
    return NextResponse.json({ method }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const { count } = await auth.supabase
    .from('payment_methods')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', auth.profile.id)

  const makeDefault = row.is_default || !count

  if (makeDefault) {
    await auth.supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('profile_id', auth.profile.id)
  }

  const { data, error } = await auth.supabase
    .from('payment_methods')
    .insert({ ...row, is_default: makeDefault })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ method: data }, { status: 201 })
}

export async function PATCH(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  if (shouldServeMockData(auth)) {
    MOCK_METHODS.forEach((m) => (m.is_default = m.id === body.id))
    return NextResponse.json({ ok: true })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  await auth.supabase
    .from('payment_methods')
    .update({ is_default: false })
    .eq('profile_id', auth.profile.id)

  const { error } = await auth.supabase
    .from('payment_methods')
    .update({ is_default: true })
    .eq('id', body.id)
    .eq('profile_id', auth.profile.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  if (shouldServeMockData(auth)) {
    const idx = MOCK_METHODS.findIndex((m) => m.id === id)
    if (idx >= 0) MOCK_METHODS.splice(idx, 1)
    return NextResponse.json({ ok: true })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const { error } = await auth.supabase
    .from('payment_methods')
    .delete()
    .eq('id', id)
    .eq('profile_id', auth.profile.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Promote another method so the account always has a default
  const { data: remaining } = await auth.supabase
    .from('payment_methods')
    .select('id, is_default')
    .eq('profile_id', auth.profile.id)
    .order('created_at', { ascending: false })

  if (remaining && remaining.length > 0 && !remaining.some((m: any) => m.is_default)) {
    await auth.supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', remaining[0].id)
  }

  return NextResponse.json({ ok: true })
}
