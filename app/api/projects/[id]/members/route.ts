import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_MEMBERS } from '@/lib/data/mock-store'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({
      members: MOCK_MEMBERS.filter((m) => m.project_id === id),
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('project_members')
    .select('*, profiles(full_name, email)')
    .eq('project_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const members = (data || []).map((m: any) => ({
    ...m,
    full_name: m.profiles?.full_name || m.invite_email,
    email: m.profiles?.email || m.invite_email || null,
  }))
  return NextResponse.json({ members })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.member_id) {
    return NextResponse.json({ error: 'member_id required' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  for (const key of ['can_upload', 'can_comment', 'can_approve', 'role']) {
    if (key in body) updates[key] = body[key]
  }

  if (shouldServeMockData(auth)) {
    const m = MOCK_MEMBERS.find((x) => x.id === body.member_id && x.project_id === id)
    if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    Object.assign(m, updates)
    return NextResponse.json({ member: m })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('project_members')
    .update(updates)
    .eq('id', body.member_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ member: data })
}
