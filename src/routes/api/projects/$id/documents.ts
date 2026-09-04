import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { documentRead } from '@/lib/supabase/schema-map'
import { notifyUser } from '@/lib/notifications/notify'

type Ctx = { params: Promise<{ id: string }> }

const handleGET = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })



  const { data, error } = await auth.supabase
    .from('documents')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ documents: (data || []).map(documentRead) })
}

const handlePOST = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.name) return json({ error: 'name required' }, { status: 400 })



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
  if (error) return json({ error: error.message }, { status: 500 })

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

  return json({ document: documentRead(data) }, { status: 201 })
}

const handlePATCH = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.document_id) {
    return json({ error: 'document_id required' }, { status: 400 })
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
    return json({ error: 'No valid fields to update' }, { status: 400 })
  }



  const { data, error } = await auth.supabase
    .from('documents')
    .update(updates)
    .eq('id', body.document_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })

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

  return json({ document: documentRead(data) })
}

export const Route = createFileRoute('/api/projects/$id/documents')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
        PATCH: handlePATCH,
    },
  },
})
