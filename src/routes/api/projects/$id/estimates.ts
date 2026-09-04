import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
type Ctx = { params: Promise<{ id: string }> }

/** Persist an AI estimate against a project (ai_estimates + project brief note). */
const handlePOST = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.result && body.estimated_total == null) {
    return json({ error: 'estimate result required' }, { status: 400 })
  }

  const total =
    body.estimated_total ??
    body.result?.total_estimate ??
    body.result?.total ??
    null
  const lineItems = body.breakdown || body.result?.line_items || body.line_items || []



  const { data: project } = await auth.supabase
    .from('projects')
    .select('id, org_id, brief, name')
    .eq('id', id)
    .single()
  if (!project) return json({ error: 'Project not found' }, { status: 404 })

  const { data: estimate, error } = await auth.supabase
    .from('ai_estimates')
    .insert({
      org_id: project.org_id || auth.orgId,
      project_id: id,
      profile_id: auth.profile.id,
      user_id: auth.profile.id,
      project_type: body.project_type || body.projectType || null,
      city: body.city || null,
      total_sqft: body.total_sqft || body.sqft || null,
      floors: body.floors || null,
      spec_level: body.spec_level || body.specLevel || null,
      estimated_total: total,
      breakdown: lineItems,
      input: body.input || body,
      result: body.result || { total_estimate: total, line_items: lineItems },
    })
    .select('id')
    .single()
  if (error) return json({ error: error.message }, { status: 500 })

  const stamp = new Date().toISOString().slice(0, 10)
  const note = `\n\n[AI Estimate ${stamp}] ₹${Number(total || 0).toLocaleString()} — ${lineItems.length} line items (id ${estimate.id})`
  const brief = `${project.brief || ''}${note}`.trim()
  await auth.supabase.from('projects').update({ brief, updated_at: new Date().toISOString() }).eq('id', id)

  return json({
    ok: true,
    estimate_id: estimate.id,
    project_id: id,
    estimated_total: total,
  })
}

export const Route = createFileRoute('/api/projects/$id/estimates')({
  server: {
    handlers: {
        POST: handlePOST,
    },
  },
})
