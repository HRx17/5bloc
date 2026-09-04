import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

/** Create a tender scoped to a project (architect). */
const handlePOST = async ({ request, params }: any) => {
  const { id: projectId } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.title) return json({ error: 'title required' }, { status: 400 })

  const services: string[] = Array.isArray(body.services)
    ? body.services.map((s: string) => String(s).trim()).filter(Boolean)
    : body.trade_type
      ? [String(body.trade_type)]
      : ['Civil']



  const { data: project } = await auth.supabase
    .from('projects')
    .select('id, name, city, org_id')
    .eq('id', projectId)
    .single()
  if (!project) return json({ error: 'Project not found' }, { status: 404 })

  const { data, error } = await auth.supabase
    .from('tenders')
    .insert({
      project_id: projectId,
      org_id: project.org_id,
      title: body.title,
      scope: body.scope,
      trade_type: services[0] || body.trade_type || 'Civil',
      services,
      project_name: body.project_name || project.name,
      city: body.city || project.city || null,
      budget_min: body.budget_min,
      budget_max: body.budget_max,
      timeline_weeks: body.timeline_weeks,
      deadline: body.deadline,
      visibility: body.visibility || 'public',
      status: 'open',
    })
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })

  await auth.supabase.from('activity_log').insert({
    project_id: projectId,
    org_id: project.org_id,
    user_id: auth.profile.id,
    action: 'tender.created',
    entity_type: 'tender',
    entity_id: data.id,
    entity_name: data.title,
  })

  return json({ tender: data }, { status: 201 })
}

const handleGET = async ({ request, params }: any) => {
  const { id: projectId } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })



  const { data, error } = await auth.supabase
    .from('tenders')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ tenders: data || [] })
}

export const Route = createFileRoute('/api/projects/$id/tenders')({
  server: {
    handlers: {
        POST: handlePOST,
        GET: handleGET,
    },
  },
})
