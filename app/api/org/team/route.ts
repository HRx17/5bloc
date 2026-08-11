import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { send } from '@/lib/email/resend'
import { InviteEmail } from '@/lib/email/templates'
import { notifyUser } from '@/lib/notifications/notify'

export async function GET() {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!auth.orgId) return NextResponse.json({ members: [], invites: [] })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({
      members: [
        {
          id: auth.profile.id,
          name: auth.profile.full_name || 'You',
          email: auth.profile.email,
          role: 'Owner',
          joined_at: String((auth.profile as any).created_at || '').slice(0, 10),
          status: 'active',
        },
      ],
      invites: [],
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const [{ data: members }, { data: invites }] = await Promise.all([
    auth.supabase
      .from('organisation_members')
      .select('id, member_role, status, created_at, profile_id, profiles(full_name, email)')
      .eq('org_id', auth.orgId)
      .order('created_at', { ascending: true }),
    auth.supabase
      .from('organisation_invites')
      .select('id, email, member_role, expires_at, accepted_at, created_at, invite_token')
      .eq('org_id', auth.orgId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false }),
  ])

  const mapped = (members || []).map((m: any) => ({
    id: m.id,
    profile_id: m.profile_id,
    name: m.profiles?.full_name || 'Member',
    email: m.profiles?.email || '',
    role: m.member_role === 'owner' ? 'Owner' : m.member_role,
    joined_at: (m.created_at || '').slice(0, 10),
    status: m.status,
  }))

  // Ensure owner appears even if organisation_members row missing
  if (!mapped.some((m: { profile_id: string }) => m.profile_id === auth.profile.id)) {
    mapped.unshift({
      id: auth.profile.id,
      profile_id: auth.profile.id,
      name: auth.profile.full_name || 'You',
      email: auth.profile.email || '',
      role: 'Owner',
      joined_at: String((auth.profile as any).created_at || '').slice(0, 10),
      status: 'active',
    })
  }

  return NextResponse.json({
    members: mapped,
    invites: (invites || []).map((i: any) => ({
      id: i.id,
      email: i.email,
      role: i.member_role,
      expires_at: i.expires_at,
      invite_token: i.invite_token,
    })),
  })
}

export async function POST(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Only architects can invite org members' }, { status: 403 })
  }
  if (!auth.orgId) {
    return NextResponse.json({ error: 'No organisation' }, { status: 400 })
  }

  const body = await req.json()
  const email = String(body.email || '').trim().toLowerCase()
  const memberRole = body.member_role || 'member'
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json(
      {
        invite: {
          id: `oi-${Date.now()}`,
          email,
          member_role: memberRole,
          invite_token: `org-invite-${Date.now()}`,
        },
        accept_url: `/signup?email=${encodeURIComponent(email)}&role=architect`,
      },
      { status: 201 }
    )
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const token =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : `orginv-${Date.now()}`

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Re-invite: refresh token on pending row for same org+email
  const { data: existingInvite } = await auth.supabase
    .from('organisation_invites')
    .select('id, accepted_at')
    .eq('org_id', auth.orgId)
    .ilike('email', email)
    .maybeSingle()

  if (existingInvite?.accepted_at) {
    return NextResponse.json({ error: 'This email already accepted an invite to this firm' }, { status: 409 })
  }

  let invite
  let error
  if (existingInvite?.id) {
    ;({ data: invite, error } = await auth.supabase
      .from('organisation_invites')
      .update({
        invited_by: auth.profile.id,
        member_role: memberRole,
        user_role: 'architect',
        invite_token: token,
        expires_at: expiresAt,
      })
      .eq('id', existingInvite.id)
      .select()
      .single())
  } else {
    ;({ data: invite, error } = await auth.supabase
      .from('organisation_invites')
      .insert({
        org_id: auth.orgId,
        email,
        invited_by: auth.profile.id,
        member_role: memberRole,
        user_role: 'architect',
        invite_token: token,
        expires_at: expiresAt,
      })
      .select()
      .single())
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup?email=${encodeURIComponent(email)}&role=architect&org_invite=${token}`

  const mail = await send(
    email,
    `You're invited to join ${auth.profile.organisations?.name || 'a firm'} on 5Bloc`,
    InviteEmail(
      auth.profile.full_name || 'Architect',
      auth.profile.organisations?.name || 'Organisation',
      'architect',
      acceptUrl
    )
  ).catch((e) => ({ data: null, error: e, mock: true as const }))

  const { data: existing } = await auth.supabase
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle()
  if (existing?.id) {
    await notifyUser(auth.supabase, {
      userId: existing.id,
      title: 'Organisation invitation',
      body: `Join ${auth.profile.organisations?.name || 'a firm'} on 5Bloc`,
      type: 'invite',
      href: acceptUrl.replace(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', '') || '/signup',
    })
  }

  return NextResponse.json({
    invite,
    accept_url: acceptUrl,
    email_sent: !mail.mock && !mail.error,
    email_warning: mail.mock
      ? 'Invite created. Email not sent — set RESEND_API_KEY. Share the accept link manually.'
      : mail.error
        ? 'Invite created but email failed. Share the accept link manually.'
        : null,
  }, { status: 201 })
}

export async function DELETE(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!auth.orgId) return NextResponse.json({ error: 'No organisation' }, { status: 400 })

  const url = new URL(req.url)
  const memberId = url.searchParams.get('member_id')
  const inviteId = url.searchParams.get('invite_id')
  if (!memberId && !inviteId) {
    return NextResponse.json({ error: 'member_id or invite_id required' }, { status: 400 })
  }

  if (shouldServeMockData(auth)) {
    return NextResponse.json({ ok: true })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  if (inviteId) {
    const { error } = await auth.supabase
      .from('organisation_invites')
      .delete()
      .eq('id', inviteId)
      .eq('org_id', auth.orgId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (memberId === auth.profile.id) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
  }

  const { error } = await auth.supabase
    .from('organisation_members')
    .delete()
    .eq('id', memberId!)
    .eq('org_id', auth.orgId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
