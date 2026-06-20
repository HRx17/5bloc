import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { assertProjectAccess, canAccessProjectId, getOrgDb, appUrl } from '@/lib/org/server'
import { send } from '@/lib/email/resend'

export const dynamic = 'force-dynamic'

async function requireProjectAccess(projectId: string, userId: string) {
  const supabase = await createSupabaseServer()
  const db = getOrgDb(supabase)
  const access = await assertProjectAccess(db, userId)
  if (!access) return { error: NextResponse.json({ error: 'Profile not found' }, { status: 400 }) }
  const allowed = await canAccessProjectId(db, projectId, access.profileId, access.orgId)
  if (!allowed) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { db, access, supabase }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> },
) {
  const { id: projectId, teamId } = await params
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gate = await requireProjectAccess(projectId, user.id)
  if (gate.error) return gate.error

  const { data: me } = await gate.supabase!
    .from('profiles')
    .select('id, org_id, full_name')
    .eq('auth_id', user.id)
    .maybeSingle()
  if (!me) return NextResponse.json({ error: 'Profile not found' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
  const profileId = typeof body.profileId === 'string' ? body.profileId : null
  const projectRole = typeof body.projectRole === 'string' ? body.projectRole : 'member'

  const { data: team } = await gate.db!
    .from('project_teams')
    .select('id, name, project_id, projects(name)')
    .eq('id', teamId)
    .eq('project_id', projectId)
    .maybeSingle()
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  let resolvedProfileId = profileId
  let isExternal = false
  let inviteEmail: string | null = null

  if (email) {
    const { data: profile } = await gate.db!
      .from('profiles')
      .select('id, org_id, email, full_name')
      .ilike('email', email)
      .limit(1)
      .maybeSingle()

    if (profile?.id) {
      resolvedProfileId = profile.id
      isExternal = profile.org_id !== me.org_id
      await gate.db!.from('project_members').upsert(
        { project_id: projectId, profile_id: profile.id, role: projectRole },
        { onConflict: 'project_id,profile_id', ignoreDuplicates: true },
      )
    } else {
      inviteEmail = email
      isExternal = true
    }
  }

  if (!resolvedProfileId && !inviteEmail) {
    return NextResponse.json({ error: 'Email or profile required' }, { status: 400 })
  }

  const { data: member, error } = await gate.db!
    .from('project_team_members')
    .insert({
      team_id: teamId,
      profile_id: resolvedProfileId,
      invite_email: inviteEmail,
      display_name: displayName || null,
      is_external: isExternal,
      project_role: projectRole,
      status: inviteEmail ? 'pending' : 'active',
    })
    .select('id, profile_id, invite_email, display_name, is_external, project_role, status')
    .single()

  if (error || !member) return NextResponse.json({ error: 'Could not add member' }, { status: 500 })

  if (inviteEmail) {
    const projectName = (team as { projects: { name: string } | null }).projects?.name ?? 'a project'
    await send(
      inviteEmail,
      `Added to ${team.name} on ${projectName}`,
      `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0C1220">
        <p><strong>${me.full_name || 'Someone'}</strong> added you to the <strong>${team.name}</strong> team on <strong>${projectName}</strong>.</p>
        <p><a href="${appUrl()}/signup" style="display:inline-block;background:#F5A623;color:#0C1220;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Join 5Bloc</a></p>
      </div>`,
    )
  }

  return NextResponse.json({ member })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> },
) {
  const { id: projectId, teamId } = await params
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gate = await requireProjectAccess(projectId, user.id)
  if (gate.error) return gate.error

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  const { data: member } = await gate.db!
    .from('project_team_members')
    .select('id, team_id')
    .eq('id', memberId)
    .eq('team_id', teamId)
    .maybeSingle()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const { error } = await gate.db!.from('project_team_members').delete().eq('id', memberId)
  if (error) return NextResponse.json({ error: 'Could not remove member' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
