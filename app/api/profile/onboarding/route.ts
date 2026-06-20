import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { USER_ROLES, type UserRole } from '@/lib/roles'
import {
  ensureOrgMember,
  findOrgByName,
  getOrgDb,
  sendJoinRequestEmail,
} from '@/lib/org/server'

export const dynamic = 'force-dynamic'

const VALID_ROLES = USER_ROLES.map((r) => r.id)

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getOrgDb(supabase)

  try {
    const body = await req.json()
    const inviteToken = typeof body.invite_token === 'string' ? body.invite_token.trim() : ''
    const role = (body.role ?? user.user_metadata?.role ?? 'architect') as UserRole
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const fullName = body.full_name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0]
    const orgName = body.org_name?.trim() ?? `${fullName}'s Workspace`

    await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        role,
        onboarding_complete: true,
        city: body.city ?? null,
        state: body.state ?? null,
        gst_number: body.gst_number ?? null,
      },
    })

    const profilePayload = {
      auth_id: user.id,
      email: user.email,
      full_name: fullName,
      role,
      plan: 'free',
      ai_add_on: false,
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()

    let profileId: string | undefined = existing?.id
    if (existing) {
      await supabase.from('profiles').update(profilePayload).eq('auth_id', user.id)
    } else {
      const { data: inserted } = await supabase
        .from('profiles')
        .insert(profilePayload)
        .select('id')
        .single()
      profileId = inserted?.id
    }

    if (!profileId) return NextResponse.json({ error: 'Profile not created' }, { status: 500 })

    // ── Invited user: join existing org ──
    if (inviteToken) {
      const { data: invite } = await db
        .from('organisation_invites')
        .select('id, org_id, email, user_role, member_role, accepted_at, expires_at, organisations(name, owner_id)')
        .eq('invite_token', inviteToken)
        .maybeSingle()

      if (!invite || invite.accepted_at || new Date(invite.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Invite invalid or expired' }, { status: 400 })
      }
      if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
        return NextResponse.json({ error: 'Sign up with the invited email address' }, { status: 400 })
      }

      const inviteRole = (invite.user_role as UserRole) || role
      if (VALID_ROLES.includes(inviteRole)) {
        await supabase.from('profiles').update({ role: inviteRole }).eq('id', profileId)
      }

      const memberRole = invite.member_role === 'admin' ? 'admin' : 'member'
      await ensureOrgMember(db, invite.org_id, profileId, memberRole)
      await db
        .from('organisation_invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite.id)

      const org = (invite as { organisations: { name: string } | null }).organisations
      return NextResponse.json({
        ok: true,
        role: inviteRole,
        joinedOrg: true,
        orgName: org?.name ?? orgName,
      })
    }

    // ── Try to join existing firm by name ──
    const matchedOrg = await findOrgByName(db, orgName)
    if (matchedOrg) {
      await db.from('organisation_join_requests').upsert(
        {
          org_id: matchedOrg.id,
          profile_id: profileId,
          requested_org_name: orgName,
          message: body.join_message ?? null,
          status: 'pending',
        },
        { onConflict: 'org_id,profile_id' },
      )

      const { data: orgDetails } = await db
        .from('organisations')
        .select('name, owner_id')
        .eq('id', matchedOrg.id)
        .maybeSingle()

      if (orgDetails?.owner_id) {
        const { data: ownerProfile } = await db
          .from('profiles')
          .select('email, full_name')
          .eq('id', orgDetails.owner_id)
          .maybeSingle()
        if (ownerProfile?.email) {
          await sendJoinRequestEmail(ownerProfile.email, fullName, matchedOrg.name)
        }
      }

      return NextResponse.json({
        ok: true,
        role,
        joinRequestPending: true,
        orgName: matchedOrg.name,
      })
    }

    // ── Create new org (owner / admin on signup) ──
    const { data: org } = await db
      .from('organisations')
      .insert({ name: orgName, plan: 'free', owner_id: profileId })
      .select('id')
      .single()

    if (org?.id) {
      await db.from('profiles').update({ org_id: org.id }).eq('id', profileId)
      await ensureOrgMember(db, org.id, profileId, 'owner')
    }

    return NextResponse.json({ ok: true, role, createdOrg: true, orgName })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Onboarding failed'
    console.error('Onboarding API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
