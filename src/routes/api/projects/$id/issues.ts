import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

type Ctx = { params: Promise<{ id: string }> }

const handleGET = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })



  const { data, error } = await auth.supabase
    .from('issues')
    .select('*')
    .eq('project_id', id)
    .order('issue_number', { ascending: false })
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ issues: data || [] })
}

const handlePOST = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.title) return json({ error: 'title required' }, { status: 400 })



  const { data: project } = await auth.supabase.from('projects').select('org_id').eq('id', id).single()
  const { data: last } = await auth.supabase
    .from('issues')
    .select('issue_number')
    .eq('project_id', id)
    .order('issue_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await auth.supabase
    .from('issues')
    .insert({
      project_id: id,
      org_id: project?.org_id || auth.orgId,
      issue_number: (last?.issue_number || 0) + 1,
      title: body.title,
      description: body.description || null,
      severity: body.severity || 'medium',
      status: 'open',
      assigned_to: body.assigned_to || null,
      reported_by: auth.profile.full_name || null,
      date_reported: new Date().toISOString().slice(0, 10),
      photo_attached: body.photo_attached || null,
    })
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ issue: data }, { status: 201 })
}

const handlePATCH = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.issue_id) return json({ error: 'issue_id required' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ['status', 'severity', 'assigned_to', 'description', 'title']) {
    if (key in body) updates[key] = body[key]
  }



  const { data, error } = await auth.supabase
    .from('issues')
    .update(updates)
    .eq('id', body.issue_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ issue: data })
}

export const Route = createFileRoute('/api/projects/$id/issues')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
        PATCH: handlePATCH,
    },
  },
})
