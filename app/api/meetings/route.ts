import { NextRequest, NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_MEETINGS, MOCK_PROJECTS } from '@/lib/data/mock-store'
import { normalizeMeeting } from '@/lib/meetings/normalize'

export const dynamic = 'force-dynamic'

async function visibleProjectIds(auth: NonNullable<Awaited<ReturnType<typeof getAuthUserOrNull>>>) {
  if (auth.profile.role === 'architect' && auth.orgId) return null
  const { data: memberships } = await auth.supabase!
    .from('project_members')
    .select('project_id')
    .eq('profile_id', auth.profile.id)
    .not('accepted_at', 'is', null)
  return (memberships || []).map((m: { project_id: string }) => m.project_id)
}

export async function GET(req: NextRequest) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const upcoming = req.nextUrl.searchParams.get('upcoming') === '1'
  const from = req.nextUrl.searchParams.get('from')
  const to = req.nextUrl.searchParams.get('to')

  if (shouldServeMockData(auth)) {
    const names = new Map(MOCK_PROJECTS.map((p: any) => [p.id, p.name]))
    let meetings = MOCK_MEETINGS.map((m) =>
      normalizeMeeting({ ...m, project_name: names.get(m.project_id) })
    )
    if (upcoming) {
      const now = Date.now()
      meetings = meetings.filter((m) => {
        const start = m.starts_at ? new Date(m.starts_at).getTime() : Date.parse(`${m.meeting_date}T00:00:00`)
        return m.status !== 'cancelled' && start >= now
      })
    }
    return NextResponse.json({ meetings })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const ids = await visibleProjectIds(auth)
  if (ids && ids.length === 0) return NextResponse.json({ meetings: [] })

  let query = auth.supabase.from('meetings').select('*, projects(id, name)')
  if (auth.profile.role === 'architect' && auth.orgId) {
    query = query.eq('org_id', auth.orgId)
  } else if (ids) {
    query = query.in('project_id', ids)
  }

  if (from) query = query.gte('starts_at', from)
  if (to) query = query.lte('starts_at', to)
  if (upcoming) {
    query = query.gte('starts_at', new Date().toISOString()).neq('status', 'cancelled').limit(12)
  }

  let { data, error } = await query.order('starts_at', { ascending: upcoming, nullsFirst: false })
  if (error && /starts_at|column|schema cache/i.test(error.message)) {
    let fallback = auth.supabase.from('meetings').select('*, projects(id, name)')
    if (auth.profile.role === 'architect' && auth.orgId) fallback = fallback.eq('org_id', auth.orgId)
    else if (ids) fallback = fallback.in('project_id', ids)
    if (from) fallback = fallback.gte('meeting_date', from.slice(0, 10))
    if (to) fallback = fallback.lte('meeting_date', to.slice(0, 10))
    const res = await fallback.order('meeting_date', { ascending: upcoming })
    data = res.data
    error = res.error
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let meetings = (data || []).map((row: any) =>
    normalizeMeeting({ ...row, project_name: row.projects?.name })
  )
  if (upcoming) {
    const now = Date.now()
    meetings = meetings
      .filter((m: any) => {
        if (m.status === 'cancelled' || m.status === 'completed') return false
        const start = m.starts_at
          ? new Date(m.starts_at).getTime()
          : Date.parse(`${m.meeting_date}T00:00:00`)
        return Number.isFinite(start) && start >= now
      })
      .slice(0, 12)
  }
  return NextResponse.json({ meetings })
}
