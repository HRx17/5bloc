import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import {
  addMembersToConversation,
  createConversationInvites,
  getMessagingDb,
  resolveMemberIds,
  sendConversationInviteEmails,
  upgradeDmToGroupIfNeeded,
} from '@/lib/messages/server'

export const dynamic = 'force-dynamic'

/**
 * Add registered users to an existing conversation by profile id and/or email.
 * Body: { memberProfileIds?: string[], emails?: string[] }. Caller must already be a member.
 * Unregistered emails receive an invite email and join automatically after signup.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getMessagingDb(supabase)
  const { data: me } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('auth_id', user.id)
    .maybeSingle()
  if (!me) return NextResponse.json({ error: 'Profile not found' }, { status: 400 })

  const { data: membership } = await supabase
    .from('conversation_members')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('profile_id', me.id)
    .maybeSingle()
  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const rawIds: string[] = Array.isArray(body.memberProfileIds) ? body.memberProfileIds : []
  const rawEmails: string[] = Array.isArray(body.emails) ? body.emails : []

  const { memberIds, pendingEmails } = await resolveMemberIds(db, me.id, rawIds, rawEmails)
  if (memberIds.length === 0 && pendingEmails.length === 0) {
    return NextResponse.json({ error: 'No users or emails provided' }, { status: 400 })
  }

  const { data: conv } = await db
    .from('conversations')
    .select('project_id, title')
    .eq('id', conversationId)
    .maybeSingle()

  if (memberIds.length > 0) {
    await addMembersToConversation(db, conversationId, memberIds, conv?.project_id ?? null)
    await upgradeDmToGroupIfNeeded(db, conversationId)
  }

  let invited = 0
  let autoAdded = 0
  if (pendingEmails.length > 0) {
    const inviteResult = await createConversationInvites(db, conversationId, me.id, pendingEmails)
    invited = inviteResult.pendingEmails.length
    autoAdded = inviteResult.autoAdded
    if (inviteResult.pendingEmails.length > 0) {
      const inviterName = me.full_name || me.email || 'Someone'
      await sendConversationInviteEmails(inviteResult.pendingEmails, inviterName, conv?.title ?? null)
    }
    if (autoAdded > 0) {
      await upgradeDmToGroupIfNeeded(db, conversationId)
    }
  }

  return NextResponse.json({
    ok: true,
    added: memberIds.length + autoAdded,
    invited,
    pendingEmails: invited > 0 ? pendingEmails : undefined,
  })
}
