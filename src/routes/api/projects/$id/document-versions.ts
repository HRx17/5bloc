import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { documentRead } from '@/lib/supabase/schema-map'

type Ctx = { params: Promise<{ id: string }> }

const handleGET = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const documentId = new URL(request.url).searchParams.get('document_id')
  if (!documentId) return json({ error: 'document_id required' }, { status: 400 })



  const { data: doc } = await auth.supabase
    .from('documents')
    .select('id, version, r2_key, storage_path, uploaded_by, created_at, original_filename')
    .eq('id', documentId)
    .eq('project_id', id)
    .maybeSingle()
  if (!doc) return json({ error: 'Document not found' }, { status: 404 })

  const { data: versions, error } = await auth.supabase
    .from('document_versions')
    .select('*, profiles:uploaded_by(full_name)')
    .eq('document_id', documentId)
    .order('version', { ascending: false })
  if (error) return json({ error: error.message }, { status: 500 })

  let rows = versions || []
  if (rows.length === 0) {
    // Backfill current file as v1 for older docs
    const { data: inserted } = await auth.supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        project_id: id,
        version: doc.version || 1,
        storage_path: doc.storage_path || doc.r2_key,
        r2_key: doc.r2_key || doc.storage_path,
        original_filename: doc.original_filename,
        uploaded_by: doc.uploaded_by,
        note: 'Initial version',
        created_at: doc.created_at,
      })
      .select('*, profiles:uploaded_by(full_name)')
      .single()
    if (inserted) rows = [inserted]
  }

  const currentVersion = doc.version || rows[0]?.version || 1
  return json({
    versions: rows.map((v: any) => ({
      id: v.id,
      version: v.version,
      created_at: v.created_at,
      note: v.note,
      uploaded_by_name: v.profiles?.full_name || 'Member',
      active: v.version === currentVersion,
      storage_path: v.storage_path || v.r2_key,
    })),
  })
}

const handlePOST = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.document_id) {
    return json({ error: 'document_id required' }, { status: 400 })
  }
  // Two modes: restore an old version (version_id), or publish an uploaded file as the next version (r2_key)
  const isUpload = !body.version_id && !!body.r2_key
  if (!body.version_id && !isUpload) {
    return json(
      { error: 'version_id (restore) or r2_key (new version) required' },
      { status: 400 }
    )
  }


  if (isUpload) {
    const { data: current } = await auth.supabase
      .from('documents')
      .select('version, original_filename, extension')
      .eq('id', body.document_id)
      .eq('project_id', id)
      .single()
    if (!current) return json({ error: 'Document not found' }, { status: 404 })

    const nextVersion = (current.version || 1) + 1
    const updates: Record<string, unknown> = {
      version: nextVersion,
      r2_key: body.r2_key,
      storage_path: body.r2_key,
      updated_at: new Date().toISOString(),
    }
    if (body.original_filename) updates.original_filename = body.original_filename
    if (body.extension) updates.extension = body.extension
    if (body.size_bytes) updates.size_bytes = body.size_bytes

    const { data: updated, error: upErr } = await auth.supabase
      .from('documents')
      .update(updates)
      .eq('id', body.document_id)
      .eq('project_id', id)
      .select()
      .single()
    if (upErr) return json({ error: upErr.message }, { status: 500 })

    await auth.supabase.from('document_versions').insert({
      document_id: body.document_id,
      project_id: id,
      version: nextVersion,
      storage_path: body.r2_key,
      r2_key: body.r2_key,
      original_filename: body.original_filename || current.original_filename,
      uploaded_by: auth.profile.id,
      note: body.note || `Uploaded v${nextVersion}`,
    })

    return json({ ok: true, document: documentRead(updated), version: nextVersion })
  }

  const { data: target, error: tErr } = await auth.supabase
    .from('document_versions')
    .select('*')
    .eq('id', body.version_id)
    .eq('document_id', body.document_id)
    .eq('project_id', id)
    .single()
  if (tErr || !target) return json({ error: 'Version not found' }, { status: 404 })

  const { data: doc } = await auth.supabase
    .from('documents')
    .select('version')
    .eq('id', body.document_id)
    .eq('project_id', id)
    .single()
  const nextVersion = (doc?.version || target.version || 1) + 1
  const key = target.r2_key || target.storage_path

  const { data: updated, error } = await auth.supabase
    .from('documents')
    .update({
      version: nextVersion,
      r2_key: key,
      storage_path: key,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.document_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })

  await auth.supabase.from('document_versions').insert({
    document_id: body.document_id,
    project_id: id,
    version: nextVersion,
    storage_path: key,
    r2_key: key,
    original_filename: target.original_filename,
    uploaded_by: auth.profile.id,
    note: `Restored from v${target.version}`,
  })

  return json({
    ok: true,
    document: documentRead(updated),
    restored_from: target.version,
    version: nextVersion,
  })
}

export const Route = createFileRoute('/api/projects/$id/document-versions')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
    },
  },
})
