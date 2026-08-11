import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { isMockAuthEnabled } from '@/lib/rbac/mock'
import { liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { MOCK_MEMBERS, MOCK_PROJECTS } from '@/lib/data/mock-store'
import { homeForRole, isRoleKey } from '@/lib/rbac/roles'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  if (isMockAuthEnabled()) {
    const invite = (MOCK_MEMBERS as any[]).find((m) => m.invite_token === token || m.id === token)
    if (!invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
    const project = MOCK_PROJECTS.find((p) => p.id === invite.project_id)
    return NextResponse.json({
      invite: {
        ...invite,
        project_name: project?.name,
        expired: false,
      },
    })
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const { data: invite } = await supabase.rpc('get_invite_by_token', { p_token: token })

  if (!invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
  const expired = invite.invite_expires && new Date(invite.invite_expires) < new Date()
  return NextResponse.json({
    invite: {
      ...invite,
      expired,
    },
  })
}

export async function POST(req: Request) {
  const body = await req.json()
  const token = body.token
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  if (isMockAuthEnabled()) {
    const invite = (MOCK_MEMBERS as any[]).find((m) => m.invite_token === token)
    if (!invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
    invite.accepted_at = new Date().toISOString()
    invite.user_id = body.user_id || `mock-${invite.role}-id`
    invite.full_name = body.full_name || invite.invite_email?.split('@')[0]
    const role = invite.role
    return NextResponse.json({
      ok: true,
      project_id: invite.project_id,
      role,
      redirect: isRoleKey(role) ? homeForRole(role) : `/projects/${invite.project_id}`,
    })
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const auth = await getAuthUserOrNull()
  if (!auth || auth.isMock) {
    return NextResponse.json({ error: 'Must be signed in to accept' }, { status: 401 })
  }

  const profile = auth.profile
  const supabase = auth.supabase

  const { data: invite } = await supabase.rpc('get_invite_by_token', { p_token: token })
  if (!invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
  if (invite.invite_expires && new Date(invite.invite_expires) < new Date()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
  }

  const { data, error } = await supabase.rpc('accept_project_invite', {
    p_token: token,
    p_full_name: body.full_name || profile.full_name || null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.ok) return NextResponse.json({ error: 'Accept failed' }, { status: 400 })

  const role = (data.role || invite.role) as string
  return NextResponse.json({
    ok: true,
    project_id: data.project_id,
    role,
    redirect: isRoleKey(role) ? homeForRole(role) : `/projects/${data.project_id}`,
  })
}
