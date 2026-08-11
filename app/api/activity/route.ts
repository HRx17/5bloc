import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
const MOCK_ACTIVITY: any[] = []

export async function GET(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const projectId = url.searchParams.get('project_id')
  const limit = Math.min(Number(url.searchParams.get('limit') || 20), 50)

  if (shouldServeMockData(auth)) {
    let items = MOCK_ACTIVITY
    if (projectId) items = items.filter((a) => a.project_id === projectId)
    return NextResponse.json({ activity: items.slice(0, limit) })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


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
    if (ids.length === 0) return NextResponse.json({ activity: [] })
    query = query.in('project_id', ids)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const activity = (data || []).map((a: any) => ({
    ...a,
    project_name: a.projects?.name,
  }))
  return NextResponse.json({ activity })
}
