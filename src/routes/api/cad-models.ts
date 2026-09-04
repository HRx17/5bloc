import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

export const dynamic = 'force-dynamic'

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (!auth.orgId) return json({ model: null })

  const documentId = new URL(request.url).searchParams.get('document_id')
  if (!documentId) return json({ error: 'document_id required' }, { status: 400 })

  const { data, error } = await auth.supabase
    .from('cad_models')
    .select('*')
    .eq('org_id', auth.orgId)
    .eq('document_id', documentId)
    .maybeSingle()

  if (error) return json({ error: error.message }, { status: 500 })
  return json({ model: data })
}

const handlePOST = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (!auth.orgId) return json({ error: 'No organisation' }, { status: 400 })

  const body = await request.json()
  if (!body.urn || !body.name) {
    return json({ error: 'urn and name required' }, { status: 400 })
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
      if (error) return json({ error: error.message }, { status: 500 })
      return json({ model: data })
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

  if (error) return json({ error: error.message }, { status: 500 })
  return json({ model: data }, { status: 201 })
}

const handlePATCH = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (!auth.orgId) return json({ error: 'No organisation' }, { status: 400 })

  const body = await request.json()
  if (!body.document_id) {
    return json({ error: 'document_id required' }, { status: 400 })
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

  if (error) return json({ error: error.message }, { status: 500 })
  return json({ model: data })
}

export const Route = createFileRoute('/api/cad-models')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
        PATCH: handlePATCH,
    },
  },
})
