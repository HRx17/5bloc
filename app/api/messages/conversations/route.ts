import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Create a conversation and add the creator + the given members.
 * Body: { title?: string, projectId?: string, memberProfileIds: string[] }
 * For 1:1 (creator + one member, no project) an existing DM is reused.
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleClient()
  const { data: me } = await admin
    .from('profiles')
    .select('id, org_id')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!me) return NextResponse.json({ error: 'Profile not found' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const title: string | null = body.title?.trim() || null
  const projectId: string | null = body.projectId || null
  const rawIds: string[] = Array.isArray(body.memberProfileIds) ? body.memberProfileIds : []
  const memberIds = Array.from(new Set(rawIds.filter((id: string) => id && id !== me.id)))

  if (memberIds.length === 0) {
    return NextResponse.json({ error: 'Add at least one person' }, { status: 400 })
  }

  const isDm = memberIds.length === 1 && !projectId
  const type = projectId ? 'project' : isDm ? 'dm' : 'group'

  // Reuse an existing 1:1 DM if one already exists between these two users
  if (isDm) {
    const other = memberIds[0]
    const { data: myConvs } = await admin
      .from('conversation_members')
      .select('conversation_id, conversations!inner(type)')
      .eq('profile_id', me.id)
    const myDmIds = (myConvs || [])
      .filter((r: { conversations: { type: string } | null }) => r.conversations?.type === 'dm')
      .map((r) => r.conversation_id)
    if (myDmIds.length > 0) {
      const { data: shared } = await admin
        .from('conversation_members')
        .select('conversation_id')
        .eq('profile_id', other)
        .in('conversation_id', myDmIds)
      if (shared && shared.length > 0) {
        return NextResponse.json({ id: shared[0].conversation_id, existing: true })
      }
    }
  }

  const { data: conv, error: convErr } = await admin
    .from('conversations')
    .insert({
      org_id: me.org_id,
      project_id: projectId,
      type,
      title,
      created_by: me.id,
    })
    .select('id')
    .single()

  if (convErr || !conv) {
    return NextResponse.json({ error: 'Could not create conversation' }, { status: 500 })
  }

  const rows = [me.id, ...memberIds].map((profile_id) => ({
    conversation_id: conv.id,
    profile_id,
  }))
  const { error: memErr } = await admin.from('conversation_members').insert(rows)
  if (memErr) {
    return NextResponse.json({ error: 'Could not add members' }, { status: 500 })
  }

  return NextResponse.json({ id: conv.id })
}
