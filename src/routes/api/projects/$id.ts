import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { milestoneRead } from '@/lib/supabase/schema-map'

type Ctx = { params: Promise<{ id: string }> }

const PROJECT_PATCH_KEYS = [
  'name',
  'type',
  'city',
  'state',
  'address',
  'total_sqft',
  'floors',
  'spec_level',
  'brief',
  'construction_cost',
  'architect_fee',
  'architect_fee_pct',
  'start_date',
  'estimated_end',
  'end_date',
  'client_id',
  'status',
  'phase_key',
  'is_rera_registered',
  'rera_number',
  'portal_enabled',
] as const

function normalizeProject(project: any) {
  if (!project) return project
  return {
    ...project,
    phase: project.phase_key || project.phase,
    estimated_end: project.estimated_end || project.end_date,
  }
}

const handleGET = async ({ request, params }: any) => {
  const { id } = params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })



  const { data: project, error } = await auth.supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !project) return json({ error: 'Not found' }, { status: 404 })

  const [{ data: milestones }, { data: membership }, { data: documents }, { data: rfis }] =
    await Promise.all([
      auth.supabase.from('phase_milestones').select('*').eq('project_id', id),
      auth.supabase
        .from('project_members')
        .select('*')
        .eq('project_id', id)
        .eq('profile_id', auth.profile.id)
        .maybeSingle(),
      auth.supabase.from('documents').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      auth.supabase.from('rfis').select('*').eq('project_id', id).order('rfi_number', { ascending: false }),
    ])

  return json({
    project: normalizeProject(project),
    milestones: (milestones || []).map(milestoneRead),
    membership,
    documents: documents || [],
    rfis: rfis || [],
  })
}

const handlePATCH = async ({ request, params }: any) => {
  const { id } = params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect' && auth.profile.role !== 'builder') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of PROJECT_PATCH_KEYS) {
    if (key in body) updates[key] = body[key]
  }
  if ('phase' in body && !('phase_key' in updates)) {
    updates.phase_key = body.phase
  }
  if ('estimated_end' in body) updates.end_date = body.estimated_end



  const { data, error } = await auth.supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ project: normalizeProject(data) })
}

export const Route = createFileRoute('/api/projects/$id')({
  server: {
    handlers: {
        GET: handleGET,
        PATCH: handlePATCH,
    },
  },
})
