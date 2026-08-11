import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_DOCUMENTS } from '@/lib/data/mock-store'
import { documentRead } from '@/lib/supabase/schema-map'
import { notifyUser } from '@/lib/notifications/notify'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({ documents: MOCK_DOCUMENTS.filter((d) => d.project_id === id) })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('documents')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ documents: (data || []).map(documentRead) })
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  if (shouldServeMockData(auth)) {
    const doc = {
      id: `doc-${Date.now()}`,
      project_id: id,
      name: body.name,
      original_filename: body.original_filename || body.name,
      extension: body.extension || 'pdf',
      version: 1,
      folder: body.folder || 'general',
      approval_status: 'pending',
      shared_with_client: !!body.shared_with_client,
      size_bytes: body.size_bytes || 0,
      created_at: new Date().toISOString(),
    }
    MOCK_DOCUMENTS.unshift(doc as any)
    return NextResponse.json({ document: doc }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data: project } = await auth.supabase.from('projects').select('org_id').eq('id', id).single()
  const storagePath = body.r2_key || body.storage_path || `projects/${id}/${Date.now()}-${body.name}`
  const { data, error } = await auth.supabase
    .from('documents')
    .insert({
      project_id: id,
      org_id: project?.org_id || auth.orgId,
      name: body.name,
      original_filename: body.original_filename || body.name,
      storage_path: storagePath,
      r2_key: storagePath,
      extension: body.extension,
      file_type: body.extension,
      size_bytes: body.size_bytes,
      file_size: body.size_bytes,
      folder: body.folder || 'general',
      status: 'active',
      uploaded_by: auth.profile.id,
      shared_with_client: !!body.shared_with_client,
      approval_status: 'pending',
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await auth.supabase.from('document_versions').insert({
    document_id: data.id,
    project_id: id,
    version: data.version || 1,
    storage_path: storagePath,
    r2_key: storagePath,
    original_filename: data.original_filename || body.original_filename || body.name,
    uploaded_by: auth.profile.id,
    note: 'Initial upload',
  })

  await auth.supabase.from('activity_log').insert({
    project_id: id,
    org_id: project?.org_id || auth.orgId,
    user_id: auth.profile.id,
    action: 'document.uploaded',
    entity_type: 'document',
    entity_id: data.id,
    entity_name: data.name,
  })

  return NextResponse.json({ document: documentRead(data) }, { status: 201 })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.document_id) {
    return NextResponse.json({ error: 'document_id required' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  for (const key of [
    'name',
    'folder',
    'status',
    'approval_status',
    'approval_note',
    'shared_with_client',
  ]) {
    if (key in body) updates[key] = body[key]
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  if (shouldServeMockData(auth)) {
    const doc = MOCK_DOCUMENTS.find((d) => d.id === body.document_id && d.project_id === id)
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    Object.assign(doc, updates)
    return NextResponse.json({ document: doc })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('documents')
    .update(updates)
    .eq('id', body.document_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (
    body.approval_status &&
    ['approved', 'rejected'].includes(body.approval_status) &&
    data.uploaded_by &&
    data.uploaded_by !== auth.profile.id
  ) {
    await notifyUser(auth.supabase, {
      userId: data.uploaded_by,
      title: `Document ${body.approval_status}`,
      body: data.name || data.original_filename || 'A document',
      type: 'document',
      href: `/projects/${id}/documents`,
    })
  }

  return NextResponse.json({ document: documentRead(data) })
}
