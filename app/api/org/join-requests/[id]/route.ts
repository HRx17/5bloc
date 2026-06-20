import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { ensureOrgMember, getOrgDb, appUrl } from '@/lib/org/server'
import { send } from '@/lib/email/resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getOrgDb(supabase)
  const { data: me } = await supabase
    .from('profiles')
    .select('id, org_id, full_name, email, role')
    .eq('auth_id', user.id)
    .maybeSingle()
  if (!me) return NextResponse.json({ error: 'Profile not found' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const action = body.action as 'approve' | 'reject'
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { data: requestRow } = await db
    .from('organisation_join_requests')
    .select('id, org_id, profile_id, status, profiles(full_name, email)')
    .eq('id', id)
    .maybeSingle()

  if (!requestRow || requestRow.status !== 'pending') {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const { data: org } = await db
    .from('organisations')
    .select('id, name, owner_id')
    .eq('id', requestRow.org_id)
    .maybeSingle()
  const { data: myMembership } = await db
    .from('organisation_members')
    .select('member_role')
    .eq('org_id', requestRow.org_id)
    .eq('profile_id', me.id)
    .maybeSingle()

  const isAdmin =
    org?.owner_id === me.id ||
    myMembership?.member_role === 'admin' ||
    myMembership?.member_role === 'owner'
  if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  if (action === 'approve') {
    await ensureOrgMember(db, requestRow.org_id, requestRow.profile_id, 'member')
    await db
      .from('organisation_join_requests')
      .update({ status: 'approved', reviewed_by: me.id, reviewed_at: new Date().toISOString() })
      .eq('id', id)

    const { data: approvedProfile } = await db
      .from('profiles')
      .select('email, full_name')
      .eq('id', requestRow.profile_id)
      .maybeSingle()
    if (approvedProfile?.email) {
      await send(
        approvedProfile.email,
        `Welcome to ${org?.name ?? 'your firm'} on 5Bloc`,
        `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0C1220">
          <p>Your request to join <strong>${org?.name ?? 'the workspace'}</strong> was approved.</p>
          <p><a href="${appUrl()}/dashboard" style="display:inline-block;background:#F5A623;color:#0C1220;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Open workspace</a></p>
        </div>`,
      )
    }
  } else {
    await db
      .from('organisation_join_requests')
      .update({ status: 'rejected', reviewed_by: me.id, reviewed_at: new Date().toISOString() })
      .eq('id', id)
  }

  return NextResponse.json({ ok: true, action })
}

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getOrgDb(supabase)
  const { data: me } = await supabase
    .from('profiles')
    .select('id, org_id')
    .eq('auth_id', user.id)
    .maybeSingle()
  if (!me?.org_id) return NextResponse.json({ requests: [] })

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
  if (!isAdmin) return NextResponse.json({ requests: [] })

  const { data } = await db
    .from('organisation_join_requests')
    .select('id, requested_org_name, message, status, created_at, profiles(full_name, email, role)')
    .eq('org_id', me.org_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return NextResponse.json({ requests: data ?? [] })
}
