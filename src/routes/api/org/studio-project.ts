import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { STUDIO_PROJECT_NAME, studioDates } from '@/lib/projects/studio'

export const dynamic = 'force-dynamic'

async function findStudio(supabase: any, orgId: string) {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('org_id', orgId)
    .ilike('name', STUDIO_PROJECT_NAME)
    .maybeSingle()
  return data
}

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  const project = await findStudio(auth.supabase, auth.orgId!)
  return json({ project })
}

const handlePOST = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Only architects can create the office project' }, { status: 403 })
  }
  if (!auth.orgId) {
    return json({ error: 'Complete firm onboarding first' }, { status: 400 })
  }

  const existing = await findStudio(auth.supabase, auth.orgId!)
  if (existing) return json({ project: existing, created: false })

  const dates = studioDates()
  const orgName = auth.profile.organisations?.name || '5Bloc'
  const { data: project, error } = await auth.supabase
    .from('projects')
    .insert({
      org_id: auth.orgId,
      name: STUDIO_PROJECT_NAME,
      type: 'commercial',
      city: auth.profile.organisations?.city || 'Mumbai',
      state: 'Maharashtra',
      brief: `Internal workspace for ${orgName} — run the firm on 5Bloc: timeline, meetings, documents, and coordination.`,
      construction_cost: null,
      start_date: dates.start_date,
      estimated_end: dates.estimated_end,
      end_date: dates.estimated_end,
      created_by: auth.profile.id,
      status: 'active',
      phase: 1,
      phase_key: 'design_development',
      portal_enabled: false,
    })
    .select()
    .single()

  if (error) return json({ error: error.message }, { status: 500 })

  await auth.supabase.from('phase_milestones').insert(
    dates.phases.map((p) => ({
      project_id: project.id,
      org_id: auth.orgId,
      phase: p.phase,
      phase_key: p.phase,
      label: p.label,
      milestone_date: p.milestone_date,
      completion: p.completion,
      completion_pct: p.completion,
      fee: 0,
      fee_amount: 0,
      paid: false,
      fee_paid: false,
    }))
  )

  await auth.supabase.from('project_members').insert({
    project_id: project.id,
    profile_id: auth.profile.id,
    role: 'architect',
    accepted_at: new Date().toISOString(),
    can_upload: true,
    can_comment: true,
    can_approve: true,
    invited_by: auth.profile.id,
  })

  const standup = new Date()
  standup.setUTCDate(standup.getUTCDate() + ((8 - standup.getUTCDay()) % 7 || 7))
  standup.setUTCHours(10, 0, 0, 0)
  const orientation = new Date()
  orientation.setUTCHours(16, 0, 0, 0)

  await auth.supabase.from('meetings').insert([
    {
      org_id: auth.orgId,
      project_id: project.id,
      title: 'Intern orientation',
      meeting_date: orientation.toISOString().slice(0, 10),
      starts_at: orientation.toISOString(),
      ends_at: new Date(orientation.getTime() + 60 * 60 * 1000).toISOString(),
      attendees: [auth.profile.full_name || 'Team'].filter(Boolean),
      agenda: 'Walk through 5Bloc Studio — calendar, documents, and how outreach work lands in the timeline.',
      status: 'scheduled',
      created_by: auth.profile.id,
    },
    {
      org_id: auth.orgId,
      project_id: project.id,
      title: 'Weekly product standup',
      meeting_date: standup.toISOString().slice(0, 10),
      starts_at: standup.toISOString(),
      ends_at: new Date(standup.getTime() + 30 * 60 * 1000).toISOString(),
      attendees: [auth.profile.full_name || 'Team'].filter(Boolean),
      agenda: 'What shipped, what’s blocked, next week on the Gantt.',
      status: 'scheduled',
      created_by: auth.profile.id,
    },
  ])

  await auth.supabase.from('activity_log').insert({
    project_id: project.id,
    org_id: auth.orgId,
    user_id: auth.profile.id,
    action: 'project.created',
    entity_type: 'project',
    entity_id: project.id,
    entity_name: project.name,
  })

  return json({ project, created: true }, { status: 201 })
}

export const Route = createFileRoute('/api/org/studio-project')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
    },
  },
})
