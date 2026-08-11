import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
const MOCK_RECS: any[] = []

export async function POST(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'builder' && auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.project_id || !body.vendor_name) {
    return NextResponse.json({ error: 'project_id and vendor_name required' }, { status: 400 })
  }

  if (shouldServeMockData(auth)) {
    const rec = {
      id: `vr-${Date.now()}`,
      ...body,
      recommended_by: auth.profile.id,
      status: 'pending',
      created_at: new Date().toISOString(),
    }
    MOCK_RECS.push(rec)
    return NextResponse.json({ recommendation: rec }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('vendor_recommendations')
    .insert({
      project_id: body.project_id,
      recommended_by: auth.profile.id,
      vendor_name: body.vendor_name,
      specialization: body.specialization,
      email: body.email,
      note: body.note,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ recommendation: data }, { status: 201 })
}

export async function GET(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const projectId = new URL(req.url).searchParams.get('project_id')

  if (shouldServeMockData(auth)) {
    return NextResponse.json({
      recommendations: projectId
        ? MOCK_RECS.filter((r) => r.project_id === projectId)
        : MOCK_RECS,
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  let query = auth.supabase.from('vendor_recommendations').select('*')
  if (projectId) query = query.eq('project_id', projectId)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ recommendations: data || [] })
}
