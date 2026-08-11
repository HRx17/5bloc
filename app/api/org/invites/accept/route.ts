import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { isMockAuthEnabled } from '@/lib/rbac/mock'
import { liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { homeForRole, isRoleKey } from '@/lib/rbac/roles'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  if (isMockAuthEnabled()) {
    return NextResponse.json({
      invite: {
        email: 'colleague@firm.com',
        org_name: 'Mock Firm',
        member_role: 'member',
        user_role: 'architect',
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

  const { data: invite, error } = await supabase.rpc('get_org_invite_by_token', { p_token: token })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
  const expired = invite.expires_at && new Date(invite.expires_at) < new Date()
  return NextResponse.json({ invite: { ...invite, expired } })
}

export async function POST(req: Request) {
  const body = await req.json()
  const token = body.token
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  if (isMockAuthEnabled()) {
    return NextResponse.json({
      ok: true,
      role: 'architect',
      redirect: homeForRole('architect'),
    })
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const auth = await getAuthUserOrNull()
  if (!auth || auth.isMock) {
    return NextResponse.json({ error: 'Must be signed in to accept' }, { status: 401 })
  }

  const { data, error } = await auth.supabase.rpc('accept_org_invite', {
    p_token: token,
    p_full_name: body.full_name || auth.profile.full_name || null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.ok) return NextResponse.json({ error: 'Accept failed' }, { status: 400 })

  const role = (data.role || 'architect') as string
  return NextResponse.json({
    ok: true,
    org_id: data.org_id,
    role,
    redirect: isRoleKey(role) ? homeForRole(role) : '/dashboard',
  })
}
