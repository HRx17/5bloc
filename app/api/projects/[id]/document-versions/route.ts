import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { documentRead } from '@/lib/supabase/schema-map'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const documentId = new URL(req.url).searchParams.get('document_id')
  if (!documentId) return NextResponse.json({ error: 'document_id required' }, { status: 400 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({
      versions: [
        {
          id: 'v1',
          version: 1,
          created_at: new Date().toISOString(),
          uploaded_by_name: auth.profile.full_name || 'You',
          active: true,
        },
      ],
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data: doc } = await auth.supabase
    .from('documents')
    .select('id, version, r2_key, storage_path, uploaded_by, created_at, original_filename')
    .eq('id', documentId)
    .eq('project_id', id)
    .maybeSingle()
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  const { data: versions, error } = await auth.supabase
    .from('document_versions')
    .select('*, profiles:uploaded_by(full_name)')
    .eq('document_id', documentId)
    .order('version', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
  return NextResponse.json({
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

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.document_id || !body.version_id) {
    return NextResponse.json({ error: 'document_id and version_id required' }, { status: 400 })
  }

  if (shouldServeMockData(auth)) {
    return NextResponse.json({ ok: true, version: (body.restore_to || 1) + 1 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data: target, error: tErr } = await auth.supabase
    .from('document_versions')
    .select('*')
    .eq('id', body.version_id)
    .eq('document_id', body.document_id)
    .eq('project_id', id)
    .single()
  if (tErr || !target) return NextResponse.json({ error: 'Version not found' }, { status: 404 })

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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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

  return NextResponse.json({
    ok: true,
    document: documentRead(updated),
    restored_from: target.version,
    version: nextVersion,
  })
}
