import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
const MOCK_ACTIVITY: any[] = []

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const projectId = url.searchParams.get('project_id')
  const limit = Math.min(Number(url.searchParams.get('limit') || 20), 50)



  let query = auth.supabase
    .from('activity_log')
    .select('*, projects(name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (projectId) {
    query = query.eq('project_id', projectId)
  } else if (auth.orgId) {
    query = query.eq('org_id', auth.orgId)
  } else {
    // Vendors/builders without org: scope to projects they can access
    const { data: memberships } = await auth.supabase
      .from('project_members')
      .select('project_id')
      .eq('profile_id', auth.profile.id)
      .not('accepted_at', 'is', null)
    const ids = (memberships || []).map((m: { project_id: string }) => m.project_id).filter(Boolean)
    if (ids.length === 0) return json({ activity: [] })
    query = query.in('project_id', ids)
  }

  const { data, error } = await query
  if (error) return json({ error: error.message }, { status: 500 })

  const activity = (data || []).map((a: any) => ({
    ...a,
    project_name: a.projects?.name,
  }))
  return json({ activity })
}

export const Route = createFileRoute('/api/activity')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})
