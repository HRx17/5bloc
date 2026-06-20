import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import {
  addMembersToConversation,
  createConversationInvites,
  findExistingDm,
  getMessagingDb,
  hasServiceRoleKey,
  resolveMemberIds,
  sendConversationInviteEmails,
  upgradeDmToGroupIfNeeded,
} from '@/lib/messages/server'

export const dynamic = 'force-dynamic'

/**
 * Create a conversation and add the creator + the given members.
 * Body: { title?: string, projectId?: string, memberProfileIds?: string[], emails?: string[] }
 * For 1:1 (creator + one member, no project) an existing DM is reused.
 * Unregistered emails receive an invite email and are added when they sign up.
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getMessagingDb(supabase)
  let me = (
    await supabase
      .from('profiles')
      .select('id, org_id, full_name, email')
      .eq('auth_id', user.id)
      .maybeSingle()
  ).data

  if (!me) {
    const { data: profileId } = await supabase.rpc('my_profile_id')
    if (profileId) {
      const { data: byId } = await supabase
        .from('profiles')
        .select('id, org_id, full_name, email')
        .eq('id', profileId)
        .maybeSingle()
      me = byId
    }
  }

  if (!me) return NextResponse.json({ error: 'Profile not found' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const title: string | null = body.title?.trim() || null
  const projectId: string | null = body.projectId || null
  const rawIds: string[] = Array.isArray(body.memberProfileIds) ? body.memberProfileIds : []
  const rawEmails: string[] = Array.isArray(body.emails) ? body.emails : []

  const { memberIds, pendingEmails } = await resolveMemberIds(db, me.id, rawIds, rawEmails)

  if (memberIds.length === 0 && pendingEmails.length === 0) {
    return NextResponse.json({ error: 'Add at least one person by name or email' }, { status: 400 })
  }

  const isDm = memberIds.length === 1 && pendingEmails.length === 0 && !projectId
  const type = projectId ? 'project' : isDm ? 'dm' : 'group'

  if (isDm) {
    const existingId = await findExistingDm(db, me.id, memberIds[0])
    if (existingId) return NextResponse.json({ id: existingId, existing: true })
  }

  let convId: string

  if (hasServiceRoleKey()) {
    const { data: conv, error: convErr } = await db
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
      return NextResponse.json({ error: convErr?.message || 'Could not create conversation' }, { status: 500 })
    }

    convId = conv.id
    const otherMemberIds = memberIds.filter((id) => id !== me.id)

    const { error: selfMemErr } = await db
      .from('conversation_members')
      .insert({ conversation_id: convId, profile_id: me.id })
    if (selfMemErr) {
      return NextResponse.json({ error: 'Could not add members' }, { status: 500 })
    }

    if (otherMemberIds.length > 0) {
      const { error: memErr } = await db.from('conversation_members').insert(
        otherMemberIds.map((profile_id) => ({ conversation_id: convId, profile_id })),
      )
      if (memErr) {
        return NextResponse.json({ error: 'Could not add members' }, { status: 500 })
      }
    }
  } else {
    const { data: rpcId, error: convErr } = await supabase.rpc('create_conversation', {
      p_type: type,
      p_title: title,
      p_project_id: projectId,
      p_member_ids: memberIds,
    })
    if (convErr || !rpcId) {
      return NextResponse.json({ error: convErr?.message || 'Could not create conversation' }, { status: 500 })
    }
    convId = rpcId as string
  }

  let invited = 0
  if (pendingEmails.length > 0) {
    const { pendingEmails: emailsToSend, autoAdded } = await createConversationInvites(
      db,
      convId,
      me.id,
      pendingEmails,
    )
    invited = emailsToSend.length
    if (emailsToSend.length > 0) {
      const inviterName = me.full_name || me.email || 'Someone'
      await sendConversationInviteEmails(emailsToSend, inviterName, title)
    }
    if (autoAdded > 0) {
      await upgradeDmToGroupIfNeeded(db, convId)
    }
  }

  return NextResponse.json({
    id: convId,
    invited,
    pendingEmails: invited > 0 ? pendingEmails : undefined,
  })
}
