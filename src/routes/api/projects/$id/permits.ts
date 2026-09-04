import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

type Ctx = { params: Promise<{ id: string }> }

const handleGET = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (!['architect', 'builder'].includes(auth.profile.role)) {
    return json({ error: 'Forbidden' }, { status: 403 })
  }



  const { data, error } = await auth.supabase
    .from('permits')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: true })
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ permits: data || [] })
}

const handlePOST = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (!['architect', 'builder'].includes(auth.profile.role)) {
    return json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.approval_name) {
    return json({ error: 'approval_name required' }, { status: 400 })
  }



  const { data: project } = await auth.supabase.from('projects').select('org_id').eq('id', id).single()
  const { data, error } = await auth.supabase
    .from('permits')
    .insert({
      project_id: id,
      org_id: project?.org_id || auth.orgId,
      approval_name: body.approval_name,
      authority: body.authority || null,
      status: body.status || 'not_started',
      submission_date: body.submission_date || null,
      expiry_date: body.expiry_date || null,
      notes: body.notes || null,
    })
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ permit: data }, { status: 201 })
}

const handlePATCH = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (!['architect', 'builder'].includes(auth.profile.role)) {
    return json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.permit_id) return json({ error: 'permit_id required' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ['status', 'notes', 'submission_date', 'expiry_date', 'authority', 'approval_name']) {
    if (key in body) updates[key] = body[key]
  }



  const { data, error } = await auth.supabase
    .from('permits')
    .update(updates)
    .eq('id', body.permit_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ permit: data })
}

export const Route = createFileRoute('/api/projects/$id/permits')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
        PATCH: handlePATCH,
    },
  },
})
