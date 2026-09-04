import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { milestoneRead } from '@/lib/supabase/schema-map'

/**
 * Phase bars for every project the user can see, for the Gantt-style timeline.
 * A phase with no milestone_date is returned with a null date so the UI can
 * fall back to spreading it across the project's start/end window.
 */
const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })


  const role = auth.profile.role
  let projectQuery = auth.supabase
    .from('projects')
    .select('id, name, phase, phase_key, start_date, estimated_end, status')

  if (role === 'architect' && auth.orgId) {
    projectQuery = projectQuery.eq('org_id', auth.orgId)
  } else {
    const { data: memberships } = await auth.supabase
      .from('project_members')
      .select('project_id')
      .eq('profile_id', auth.profile.id)
      .not('accepted_at', 'is', null)
    const ids = (memberships || []).map((m: { project_id: string }) => m.project_id)
    if (ids.length === 0) return json({ projects: [] })
    projectQuery = projectQuery.in('id', ids)
  }

  const { data: projects, error } = await projectQuery.order('created_at', { ascending: false })
  if (error) return json({ error: error.message }, { status: 500 })

  const projectIds = (projects || []).map((p: { id: string }) => p.id)
  if (projectIds.length === 0) return json({ projects: [] })

  const { data: milestones } = await auth.supabase
    .from('phase_milestones')
    .select('*')
    .in('project_id', projectIds)

  const byProject = new Map<string, any[]>()
  for (const raw of milestones || []) {
    const m = milestoneRead(raw)
    const list = byProject.get(m.project_id) || []
    list.push({
      id: m.id,
      phase: m.phase,
      label: m.label,
      date: m.milestone_date,
      completion_pct: m.completion_pct,
      fee_amount: m.fee_amount,
      fee_paid: m.fee_paid,
    })
    byProject.set(m.project_id, list)
  }

  return json({
    projects: (projects || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      phase: p.phase_key || p.phase,
      status: p.status,
      start_date: p.start_date,
      estimated_end: p.estimated_end,
      milestones: byProject.get(p.id) || [],
    })),
  })
}

export const Route = createFileRoute('/api/timeline')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})
