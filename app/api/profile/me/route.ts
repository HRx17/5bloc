import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getOrgDb } from '@/lib/org/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getOrgDb(supabase)

  let profile = (
    await supabase
      .from('profiles')
      .select('*, organisations!profiles_org_id_fkey(*)')
      .eq('auth_id', user.id)
      .maybeSingle()
  ).data

  if (!profile) {
    const { data: profileId } = await supabase.rpc('my_profile_id')
    if (profileId) {
      const { data: byId } = await supabase
        .from('profiles')
        .select('*, organisations!profiles_org_id_fkey(*)')
        .eq('id', profileId)
        .maybeSingle()
      profile = byId
    }
  }

  const meta = user.user_metadata ?? {}

  let joinRequestPending: { id: string; orgName: string } | null = null
  if (profile?.id && !profile.org_id) {
    const { data: pending } = await db
      .from('organisation_join_requests')
      .select('id, requested_org_name, organisations(name)')
      .eq('profile_id', profile.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (pending) {
      const org = (pending as { organisations: { name: string } | null }).organisations
      joinRequestPending = {
        id: pending.id,
        orgName: org?.name ?? pending.requested_org_name,
      }
    }
  }

  let isOrgAdmin = false
  if (profile?.org_id) {
    const { data: org } = await db
      .from('organisations')
      .select('owner_id')
      .eq('id', profile.org_id)
      .maybeSingle()
    const { data: membership } = await db
      .from('organisation_members')
      .select('member_role')
      .eq('org_id', profile.org_id)
      .eq('profile_id', profile.id)
      .maybeSingle()
    isOrgAdmin =
      org?.owner_id === profile.id ||
      membership?.member_role === 'admin' ||
      membership?.member_role === 'owner'
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? meta.full_name ?? user.email?.split('@')[0],
      role: profile?.role ?? meta.role ?? 'architect',
      avatar_url: profile?.avatar_url ?? meta.avatar_url ?? user.user_metadata?.picture ?? null,
      onboarding_complete: meta.onboarding_complete === true || !!profile?.org_id || !!joinRequestPending,
      isOrgAdmin,
    },
    profile,
    organisation: profile?.organisations ?? null,
    joinRequestPending,
    metadata: {
      city: meta.city ?? null,
      state: meta.state ?? null,
      gst_number: meta.gst_number ?? null,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const metaUpdates: Record<string, string | null> = {}

    if (typeof body.full_name === 'string') metaUpdates.full_name = body.full_name.trim()
    if (typeof body.city === 'string') metaUpdates.city = body.city.trim() || null
    if (typeof body.state === 'string') metaUpdates.state = body.state.trim() || null
    if (typeof body.gst_number === 'string') metaUpdates.gst_number = body.gst_number.trim() || null

    if (Object.keys(metaUpdates).length > 0) {
      await supabase.auth.updateUser({ data: metaUpdates })
    }

    if (typeof body.full_name === 'string') {
      await supabase
        .from('profiles')
        .update({ full_name: body.full_name.trim() })
        .eq('auth_id', user.id)
    }

    if (typeof body.org_name === 'string') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('auth_id', user.id)
        .maybeSingle()

      if (profile?.org_id) {
        await supabase
          .from('organisations')
          .update({ name: body.org_name.trim() })
          .eq('id', profile.org_id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
