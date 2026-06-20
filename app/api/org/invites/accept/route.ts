import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { ensureOrgMember, getOrgDb } from '@/lib/org/server'
import { USER_ROLES, type UserRole } from '@/lib/roles'

export const dynamic = 'force-dynamic'

/** Accept an organisation invite for the currently logged-in user. */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const db = getOrgDb(supabase)
  const { data: me } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('auth_id', user.id)
    .maybeSingle()
  if (!me) return NextResponse.json({ error: 'Profile not found' }, { status: 400 })

  const { data: invite } = await db
    .from('organisation_invites')
    .select('id, org_id, email, user_role, member_role, accepted_at, expires_at, organisations(name)')
    .eq('invite_token', token)
    .maybeSingle()

  if (!invite || invite.accepted_at) {
    return NextResponse.json({ error: 'Invite not found or already used' }, { status: 404 })
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
  }

  const inviteEmail = invite.email.toLowerCase()
  const userEmail = (user.email || me.email || '').toLowerCase()
  if (inviteEmail !== userEmail) {
    return NextResponse.json(
      { error: `Sign in as ${invite.email} to accept this invite` },
      { status: 400 },
    )
  }

  const memberRole = invite.member_role === 'admin' ? 'admin' : 'member'
  await ensureOrgMember(db, invite.org_id, me.id, memberRole)

  const inviteRole = invite.user_role as UserRole | null
  if (inviteRole && USER_ROLES.some((r) => r.id === inviteRole)) {
    await supabase.from('profiles').update({ role: inviteRole }).eq('id', me.id)
    await supabase.auth.updateUser({ data: { role: inviteRole } })
  }

  await db
    .from('organisation_invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  const org = (invite as { organisations: { name: string } | null }).organisations

  return NextResponse.json({
    ok: true,
    orgName: org?.name ?? 'Workspace',
    orgId: invite.org_id,
  })
}
