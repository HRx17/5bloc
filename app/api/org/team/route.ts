import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import {
  ensureOrgMember,
  getOrgDb,
  inviteLink,
  sendOrgInviteEmail,
} from '@/lib/org/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getOrgDb(supabase)
  const { data: me } = await supabase
    .from('profiles')
    .select('id, org_id, full_name, email, role')
    .eq('auth_id', user.id)
    .maybeSingle()
  if (!me?.org_id) return NextResponse.json({ members: [], invites: [], joinRequests: [], isAdmin: false })

  const { data: org } = await db
    .from('organisations')
    .select('id, name, owner_id')
    .eq('id', me.org_id)
    .maybeSingle()

  const isAdmin =
    org?.owner_id === me.id ||
    (await db
      .from('organisation_members')
      .select('member_role')
      .eq('org_id', me.org_id)
      .eq('profile_id', me.id)
      .eq('status', 'active')
      .maybeSingle()).data?.member_role === 'admin' ||
    (await db
      .from('organisation_members')
      .select('member_role')
      .eq('org_id', me.org_id)
      .eq('profile_id', me.id)
      .eq('status', 'active')
      .maybeSingle()).data?.member_role === 'owner'

  const [{ data: members }, { data: invites }, { data: joinRequests }] = await Promise.all([
    db
      .from('organisation_members')
      .select('id, member_role, status, profiles(id, full_name, email, role)')
      .eq('org_id', me.org_id),
    isAdmin
      ? db
          .from('organisation_invites')
          .select('id, email, invite_token, user_role, member_role, created_at, accepted_at, expires_at')
          .eq('org_id', me.org_id)
          .is('accepted_at', null)
      : Promise.resolve({ data: [] }),
    isAdmin
      ? db
          .from('organisation_join_requests')
          .select('id, requested_org_name, message, status, created_at, profiles(full_name, email, role)')
          .eq('org_id', me.org_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  return NextResponse.json({
    org: org ? { id: org.id, name: org.name } : null,
    isAdmin,
    members: members ?? [],
    invites: (invites ?? [])
      .filter((i) => !!i.invite_token)
      .map((i) => ({ ...i, inviteLink: inviteLink(i.invite_token as string) })),
    joinRequests: joinRequests ?? [],
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getOrgDb(supabase)
  const { data: me } = await supabase
    .from('profiles')
    .select('id, org_id, full_name, email, role')
    .eq('auth_id', user.id)
    .maybeSingle()
  if (!me?.org_id) return NextResponse.json({ error: 'No organisation' }, { status: 400 })

  const { data: org } = await db.from('organisations').select('id, name, owner_id').eq('id', me.org_id).maybeSingle()
  const { data: myMembership } = await db
    .from('organisation_members')
    .select('member_role')
    .eq('org_id', me.org_id)
    .eq('profile_id', me.id)
    .maybeSingle()

  const isAdmin =
    org?.owner_id === me.id ||
    myMembership?.member_role === 'admin' ||
    myMembership?.member_role === 'owner'
  if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const userRole = typeof body.userRole === 'string' ? body.userRole : me.role
  const memberRole = body.memberRole === 'admin' ? 'admin' : 'member'
  if (!email.includes('@')) return NextResponse.json({ error: 'Valid email required' }, { status: 400 })

  const { data: existingProfile } = await db
    .from('profiles')
    .select('id, email')
    .ilike('email', email)
    .limit(1)
    .maybeSingle()

  if (existingProfile?.id) {
    await ensureOrgMember(db, me.org_id, existingProfile.id, memberRole)
    return NextResponse.json({ ok: true, added: true, profileId: existingProfile.id })
  }

  const { data: invite, error } = await db
    .from('organisation_invites')
    .upsert(
      {
        org_id: me.org_id,
        email,
        invited_by: me.id,
        user_role: userRole,
        member_role: memberRole,
      },
      { onConflict: 'org_id,email' },
    )
    .select('invite_token')
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Could not create invite' }, { status: 500 })

  const { data: savedInvite } = await db
    .from('organisation_invites')
    .select('invite_token')
    .eq('org_id', me.org_id)
    .eq('email', email)
    .maybeSingle()

  const token = savedInvite?.invite_token ?? invite?.invite_token
  if (!token) return NextResponse.json({ error: 'Invite token missing' }, { status: 500 })

  await sendOrgInviteEmail(email, org?.name ?? 'your firm', me.full_name || me.email || 'Admin', token, userRole)

  return NextResponse.json({
    ok: true,
    invited: true,
    inviteLink: inviteLink(token),
  })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const inviteId = new URL(req.url).searchParams.get('inviteId')
  if (!inviteId) return NextResponse.json({ error: 'inviteId required' }, { status: 400 })

  const db = getOrgDb(supabase)
  const { data: me } = await supabase
    .from('profiles')
    .select('id, org_id')
    .eq('auth_id', user.id)
    .maybeSingle()
  if (!me?.org_id) return NextResponse.json({ error: 'No organisation' }, { status: 400 })

  const { data: org } = await db.from('organisations').select('owner_id').eq('id', me.org_id).maybeSingle()
  const { data: myMembership } = await db
    .from('organisation_members')
    .select('member_role')
    .eq('org_id', me.org_id)
    .eq('profile_id', me.id)
    .maybeSingle()

  const isAdmin =
    org?.owner_id === me.id ||
    myMembership?.member_role === 'admin' ||
    myMembership?.member_role === 'owner'
  if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { error } = await db
    .from('organisation_invites')
    .delete()
    .eq('id', inviteId)
    .eq('org_id', me.org_id)
    .is('accepted_at', null)

  if (error) return NextResponse.json({ error: 'Could not revoke invite' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
