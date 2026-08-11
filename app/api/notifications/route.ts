import { NextResponse } from 'next/server'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { MOCK_NOTIFICATIONS } from '@/lib/data/mock-store'

export async function GET() {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    const notifications = MOCK_NOTIFICATIONS.filter((n) => n.user_id === auth.profile.id)
    return NextResponse.json({ notifications })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const { data, error } = await auth.supabase
    .from('notifications')
    .select('*')
    .eq('user_id', auth.profile.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notifications: data || [] })
}

export async function PATCH(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (shouldServeMockData(auth)) {
    return NextResponse.json({ ok: true })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  if (body.markAllRead) {
    const { error } = await auth.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', auth.profile.id)
      .is('read_at', null)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (body.id) {
    const { error } = await auth.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', body.id)
      .eq('user_id', auth.profile.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    return NextResponse.json({ error: 'id or markAllRead required' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
