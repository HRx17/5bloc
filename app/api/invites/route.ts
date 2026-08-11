import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_MEMBERS, MOCK_PROJECTS } from '@/lib/data/mock-store'
import { PROJECT_MEMBER_ROLES, type RoleKey } from '@/lib/rbac/roles'
import { InviteEmail } from '@/lib/email/templates'
import { send } from '@/lib/email/resend'
import { notifyUser } from '@/lib/notifications/notify'

export async function POST(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Only architects can invite' }, { status: 403 })
  }

  const body = await req.json()
  const { project_id, email, role, can_upload, can_comment, can_approve } = body
  if (!project_id || !email || !role) {
    return NextResponse.json({ error: 'project_id, email, role required' }, { status: 400 })
  }
  if (!PROJECT_MEMBER_ROLES.includes(role as RoleKey)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  if (shouldServeMockData(auth)) {
    const token = `invite-${Date.now()}`
    const member = {
      id: `pm-${Date.now()}`,
      project_id,
      user_id: null as any,
      role,
      invite_email: email,
      accepted_at: null as any,
      invite_token: token,
      can_upload: can_upload ?? true,
      can_comment: can_comment ?? true,
      can_approve: can_approve ?? role === 'builder',
      full_name: email.split('@')[0],
    }
    MOCK_MEMBERS.push(member as any)
    const project = MOCK_PROJECTS.find((p) => p.id === project_id)
    return NextResponse.json({
      invite: member,
      accept_url: `/accept-invite?token=${token}`,
      project_name: project?.name,
    }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const token =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : `invite-${Date.now()}-${Math.random().toString(36).slice(2)}`

  const { data: invite, error } = await auth.supabase
    .from('project_members')
    .insert({
      project_id,
      invite_email: email,
      role,
      invited_by: auth.profile.id,
      invite_token: token,
      invite_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      can_upload: can_upload ?? true,
      can_comment: can_comment ?? true,
      can_approve: can_approve ?? false,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: project } = await auth.supabase
    .from('projects')
    .select('name')
    .eq('id', project_id)
    .single()

  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invite?token=${invite.invite_token || token}`

  const mail = await send(
    email,
    `You're invited to ${project?.name || 'a project'} on 5Bloc`,
    InviteEmail(
      auth.profile.full_name || 'Architect',
      project?.name || 'Project',
      role,
      acceptUrl
    )
  ).catch((e) => ({ data: null, error: e, mock: true as const }))

  // In-app notify if invitee already has a profile
  const { data: existing } = await auth.supabase
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle()
  if (existing?.id) {
    await notifyUser(auth.supabase, {
      userId: existing.id,
      title: 'Project invitation',
      body: `You've been invited to ${project?.name || 'a project'} as ${role}.`,
      type: 'invite',
      href: `/accept-invite?token=${invite.invite_token || token}`,
    })
  }

  return NextResponse.json(
    {
      invite,
      accept_url: `/accept-invite?token=${invite.invite_token || token}`,
      email_sent: !mail.mock && !mail.error,
      email_warning: mail.mock
        ? 'Invite created. Email not sent — set RESEND_API_KEY. Share the accept link manually.'
        : mail.error
          ? 'Invite created but email failed. Share the accept link manually.'
          : null,
    },
    { status: 201 }
  )
}
