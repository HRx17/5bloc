import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { createServiceRoleClient, hasValidServiceRoleKey } from '@/lib/supabase/server'
import { send } from '@/lib/email/resend'

export type OrgDb = SupabaseClient<Database>

export function hasServiceRoleKey(): boolean {
  return hasValidServiceRoleKey()
}

export function getOrgDb(fallback: OrgDb): OrgDb {
  if (!hasServiceRoleKey()) return fallback
  return createServiceRoleClient()
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
}

export function inviteLink(token: string): string {
  return `${appUrl()}/accept-invite?token=${token}`
}

export async function sendOrgInviteEmail(
  email: string,
  orgName: string,
  inviterName: string,
  token: string,
  userRole?: string | null,
): Promise<void> {
  const link = inviteLink(token)
  const roleLine = userRole ? ` as ${userRole.replace(/_/g, ' ')}` : ''
  await send(
    email,
    `${inviterName} invited you to ${orgName} on 5Bloc`,
    `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0C1220">
      <p><strong>${inviterName}</strong> invited you to join <strong>${orgName}</strong>${roleLine} on 5Bloc.</p>
      <p><a href="${link}" style="display:inline-block;background:#F5A623;color:#0C1220;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Accept invite</a></p>
      <p style="color:#5C5750;font-size:13px">Or copy this link: ${link}</p>
    </div>`,
  )
}

export async function sendJoinRequestEmail(
  ownerEmail: string,
  requesterName: string,
  orgName: string,
): Promise<void> {
  const link = `${appUrl()}/settings?tab=team`
  await send(
    ownerEmail,
    `Join request for ${orgName}`,
    `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0C1220">
      <p><strong>${requesterName}</strong> requested to join <strong>${orgName}</strong>.</p>
      <p><a href="${link}" style="display:inline-block;background:#F5A623;color:#0C1220;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Review in settings</a></p>
    </div>`,
  )
}

export async function findOrgByName(db: OrgDb, name: string): Promise<{ id: string; name: string } | null> {
  const trimmed = name.trim()
  if (!trimmed) return null
  const { data } = await db
    .from('organisations')
    .select('id, name')
    .ilike('name', trimmed)
    .limit(10)
  const match = (data || []).find((o) => o.name.trim().toLowerCase() === trimmed.toLowerCase())
  return match ?? null
}

export async function assertProjectAccess(
  db: OrgDb,
  authUserId: string,
): Promise<{ profileId: string; orgId: string | null } | null> {
  const { data: profile } = await db
    .from('profiles')
    .select('id, org_id')
    .eq('auth_id', authUserId)
    .maybeSingle()
  if (!profile) return null
  return { profileId: profile.id, orgId: profile.org_id }
}

export async function canAccessProjectId(
  db: OrgDb,
  projectId: string,
  profileId: string,
  orgId: string | null,
): Promise<boolean> {
  const { data: project } = await db.from('projects').select('org_id').eq('id', projectId).maybeSingle()
  if (project?.org_id && orgId && project.org_id === orgId) return true
  const { data: membership } = await db
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('profile_id', profileId)
    .maybeSingle()
  return !!membership
}

export async function ensureOrgMember(
  db: OrgDb,
  orgId: string,
  profileId: string,
  memberRole: 'owner' | 'admin' | 'member' = 'member',
): Promise<void> {
  await db.from('organisation_members').upsert(
    { org_id: orgId, profile_id: profileId, member_role: memberRole, status: 'active' },
    { onConflict: 'org_id,profile_id' },
  )
  await db.from('profiles').update({ org_id: orgId }).eq('id', profileId)
}

export const PROJECT_TEAM_TEMPLATES = [
  { key: 'civil', name: 'Civil team', icon: 'foundation' },
  { key: 'interior', name: 'Interior designers', icon: 'weekend' },
  { key: 'electrical', name: 'Electrical team', icon: 'bolt' },
  { key: 'mep', name: 'MEP consultants', icon: 'hvac' },
  { key: 'structural', name: 'Structural team', icon: 'account_balance' },
  { key: 'custom', name: 'Custom team', icon: 'groups' },
] as const
