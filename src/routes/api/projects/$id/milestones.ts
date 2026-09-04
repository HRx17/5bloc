import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { milestoneRead, milestoneWrite } from '@/lib/supabase/schema-map'


const handleGET = async ({ request, params }: any) => {
  const { id } = params as { id: string }
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })



  const { data, error } = await auth.supabase
    .from('phase_milestones')
    .select('*')
    .eq('project_id', id)
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ milestones: (data || []).map(milestoneRead) })
}

const handlePATCH = async ({ request, params }: any) => {
  const { id } = params as { id: string }
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect' && auth.profile.role !== 'builder') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.phase) return json({ error: 'phase required' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of [
    'milestone_date',
    'completion_pct',
    'fee_amount',
    'fee_paid',
    'notes',
    'rera_certified',
  ]) {
    if (key in body) updates[key] = body[key]
  }
  Object.assign(updates, milestoneWrite(updates))



  const { data, error } = await auth.supabase
    .from('phase_milestones')
    .update(updates)
    .eq('project_id', id)
    .eq('phase_key', body.phase)
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })

  await auth.supabase.from('activity_log').insert({
    project_id: id,
    org_id: auth.orgId,
    user_id: auth.profile.id,
    action: 'milestone.updated',
    entity_type: 'phase_milestone',
    entity_id: data.id,
    entity_name: body.phase,
    metadata: updates,
  })

  return json({ milestone: milestoneRead(data) })
}

export const Route = createFileRoute('/api/projects/$id/milestones')({
  server: {
    handlers: {
        GET: handleGET,
        PATCH: handlePATCH,
    },
  },
})
