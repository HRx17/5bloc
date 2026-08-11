import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_CLIENTS } from '@/lib/data/mock-store'

export async function GET() {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (shouldServeMockData(auth)) {
    return NextResponse.json({ clients: MOCK_CLIENTS })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('clients')
    .select('*')
    .eq('org_id', auth.orgId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const clients = (data || []).map((c: any) => ({
    ...c,
    full_name: c.full_name || c.name,
  }))
  return NextResponse.json({ clients })
}

export async function POST(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.full_name) return NextResponse.json({ error: 'full_name required' }, { status: 400 })

  if (shouldServeMockData(auth)) {
    const client = {
      id: `client-${Date.now()}`,
      org_id: auth.orgId || 'mock-org-id',
      full_name: body.full_name,
      email: body.email || null,
      phone: body.phone || null,
      company: body.company || null,
      city: body.city || null,
      state: body.state || null,
      pipeline_stage: body.pipeline_stage || 'prospect',
      total_value: body.total_value || 0,
      last_contact: new Date().toISOString().slice(0, 10),
    }
    MOCK_CLIENTS.unshift(client as any)
    return NextResponse.json({ client }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('clients')
    .insert({
      org_id: auth.orgId,
      name: body.full_name,
      full_name: body.full_name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      city: body.city,
      state: body.state,
      notes: body.notes,
      pipeline_stage: body.pipeline_stage || 'prospect',
      total_value: body.total_value || 0,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    client: { ...data, full_name: data.full_name || data.name },
  }, { status: 201 })
}
