import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
type Ctx = { params: Promise<{ id: string }> }

const handleGET = async ({ request }: any) => {
  const { id: projectId } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const documentId = new URL(request.url).searchParams.get('document_id')
  if (!documentId) {
    return json({ error: 'document_id required' }, { status: 400 })
  }



  const { data, error } = await auth.supabase
    .from('document_annotations')
    .select('id, note, kind, page_number, x_pct, y_pct, payload, created_at, created_by')
    .eq('project_id', projectId)
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) return json({ error: error.message }, { status: 500 })

  const creatorIds = [...new Set((data || []).map((r: any) => r.created_by).filter(Boolean))]
  let nameById: Record<string, string> = {}
  if (creatorIds.length) {
    const { data: people } = await auth.supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', creatorIds)
    for (const p of people || []) nameById[p.id] = p.full_name || 'Team'
  }

  const annotations = (data || []).map((row: any) => ({
    id: row.id,
    note: row.note,
    kind: row.kind || 'comment',
    page_number: row.page_number,
    x_pct: row.x_pct,
    y_pct: row.y_pct,
    payload: row.payload,
    created_at: row.created_at,
    created_by: row.created_by,
    author_name: (row.created_by && nameById[row.created_by]) || 'Team',
  }))

  return json({ annotations })
}

const handlePOST = async ({ request }: any) => {
  const { id: projectId } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.document_id || !String(body.note || '').trim()) {
    return json({ error: 'document_id and note required' }, { status: 400 })
  }



  const { data: project } = await auth.supabase
    .from('projects')
    .select('org_id')
    .eq('id', projectId)
    .single()

  const insert = {
    project_id: projectId,
    org_id: project?.org_id || auth.orgId,
    document_id: body.document_id,
    note: String(body.note).trim(),
    kind: body.kind || 'comment',
    page_number: body.page_number ?? null,
    x_pct: body.x_pct ?? null,
    y_pct: body.y_pct ?? null,
    payload: body.payload ?? null,
    created_by: auth.profile.id,
  }

  const { data, error } = await auth.supabase
    .from('document_annotations')
    .insert(insert)
    .select('id, note, kind, page_number, x_pct, y_pct, payload, created_at, created_by')
    .single()

  if (error) return json({ error: error.message }, { status: 500 })

  return json(
    {
      annotation: {
        ...data,
        author_name: auth.profile.full_name || 'You',
      },
    },
    { status: 201 }
  )
}

export const Route = createFileRoute('/api/projects/$id/document-annotations')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
    },
  },
})
