import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { hasSupabaseEnv, liveDataUnavailableResponse, shouldServeMockData } from '@/lib/data/mock-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (shouldServeMockData(auth) || !hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json({ model: null })
  }
  if (!auth.orgId) return NextResponse.json({ model: null })

  const documentId = req.nextUrl.searchParams.get('document_id')
  if (!documentId) return NextResponse.json({ error: 'document_id required' }, { status: 400 })

  const { data, error } = await auth.supabase
    .from('cad_models')
    .select('*')
    .eq('org_id', auth.orgId)
    .eq('document_id', documentId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ model: data })
}

export async function POST(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (shouldServeMockData(auth) || !hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }
  if (!auth.orgId) return NextResponse.json({ error: 'No organisation' }, { status: 400 })

  const body = await req.json()
  if (!body.urn || !body.name) {
    return NextResponse.json({ error: 'urn and name required' }, { status: 400 })
  }

  if (body.document_id) {
    const { data: existing } = await auth.supabase
      .from('cad_models')
      .select('id')
      .eq('org_id', auth.orgId)
      .eq('document_id', body.document_id)
      .maybeSingle()
    if (existing?.id) {
      const { data, error } = await auth.supabase
        .from('cad_models')
        .update({
          urn: body.urn,
          name: body.name,
          status: body.status || 'translating',
          project_id: body.project_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ model: data })
    }
  }

  const { data, error } = await auth.supabase
    .from('cad_models')
    .insert({
      org_id: auth.orgId,
      project_id: body.project_id || null,
      document_id: body.document_id || null,
      name: body.name,
      urn: body.urn,
      status: body.status || 'translating',
      created_by: auth.profile.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ model: data }, { status: 201 })
}

export async function PATCH(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (shouldServeMockData(auth) || !hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }
  if (!auth.orgId) return NextResponse.json({ error: 'No organisation' }, { status: 400 })

  const body = await req.json()
  if (!body.document_id) {
    return NextResponse.json({ error: 'document_id required' }, { status: 400 })
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.status) patch.status = body.status
  if (body.urn) patch.urn = body.urn

  const { data, error } = await auth.supabase
    .from('cad_models')
    .update(patch)
    .eq('org_id', auth.orgId)
    .eq('document_id', body.document_id)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ model: data })
}
