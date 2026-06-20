import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getOrgDb } from '@/lib/org/server'

export const dynamic = 'force-dynamic'

/** Public-ish lookup for invite token (requires auth for full details). */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const supabase = await createSupabaseServer()
  const db = getOrgDb(supabase)

  const { data: invite } = await db
    .from('organisation_invites')
    .select('id, email, user_role, member_role, expires_at, accepted_at, organisations(name)')
    .eq('invite_token', token)
    .maybeSingle()

  if (!invite || invite.accepted_at) {
    return NextResponse.json({ error: 'Invite not found or already used' }, { status: 404 })
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
  }

  const org = (invite as { organisations: { name: string } | null }).organisations

  return NextResponse.json({
    email: invite.email,
    userRole: invite.user_role,
    orgName: org?.name ?? 'Workspace',
    memberRole: invite.member_role,
  })
}
