import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { createServiceRoleClient, hasValidServiceRoleKey } from '@/lib/supabase/server'
import { send } from '@/lib/email/resend'

export type MessagingDb = SupabaseClient<Database>

export function hasServiceRoleKey(): boolean {
  return hasValidServiceRoleKey()
}

/** Prefer service role; fall back to the authenticated server client. */
export function getMessagingDb(fallback: MessagingDb): MessagingDb {
  if (!hasServiceRoleKey()) return fallback
  return createServiceRoleClient()
}

export interface ResolvedMembers {
  memberIds: string[]
  pendingEmails: string[]
}

export async function resolveMemberIds(
  db: MessagingDb,
  myId: string,
  memberProfileIds: string[],
  emails: string[],
): Promise<ResolvedMembers> {
  const ids = new Set(memberProfileIds.filter((id) => id && id !== myId))
  const normalizedEmails = emails
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'))
  const foundEmails = new Set<string>()

  if (normalizedEmails.length > 0) {
    for (const email of normalizedEmails) {
      if (foundEmails.has(email)) continue

      if (hasServiceRoleKey()) {
        const { data: byEmail } = await db
          .from('profiles')
          .select('id, email')
          .in('email', [email])

        for (const row of byEmail || []) {
          if (row.id && row.id !== myId) {
            ids.add(row.id)
            if (row.email) foundEmails.add(row.email.toLowerCase())
          }
        }

        if (foundEmails.has(email)) continue

        const { data: match } = await db
          .from('profiles')
          .select('id, email')
          .ilike('email', email)
          .limit(1)
          .maybeSingle()
        if (match?.id && match.id !== myId) {
          ids.add(match.id)
          if (match.email) foundEmails.add(match.email.toLowerCase())
        }
        continue
      }

      const { data: matches } = await db.rpc('search_messaging_profiles', {
        search_query: email,
        result_limit: 5,
      })
      const exact = (matches || []).find(
        (row: { id: string; email: string | null }) => row.email?.toLowerCase() === email,
      )
      if (exact?.id && exact.id !== myId) {
        ids.add(exact.id)
        foundEmails.add(email)
      }
    }
  }

  const pendingEmails = normalizedEmails.filter((e) => !foundEmails.has(e))
  return { memberIds: Array.from(ids), pendingEmails }
}

export async function upgradeDmToGroupIfNeeded(
  db: MessagingDb,
  conversationId: string,
): Promise<void> {
  const { data: conv } = await db
    .from('conversations')
    .select('type')
    .eq('id', conversationId)
    .maybeSingle()
  if (conv?.type !== 'dm') return

  const { count } = await db
    .from('conversation_members')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)

  if ((count || 0) > 2) {
    await db.from('conversations').update({ type: 'group' }).eq('id', conversationId)
  }
}

export async function createConversationInvites(
  db: MessagingDb,
  conversationId: string,
  invitedBy: string,
  emails: string[],
): Promise<{ pendingEmails: string[]; autoAdded: number }> {
  if (emails.length === 0) return { pendingEmails: [], autoAdded: 0 }

  const pendingEmails: string[] = []
  let autoAdded = 0

  for (const email of emails) {
    const normalized = email.toLowerCase()
    const { data: existingProfile } = await db
      .from('profiles')
      .select('id')
      .ilike('email', normalized)
      .limit(1)
      .maybeSingle()

    if (existingProfile?.id) {
      await db
        .from('conversation_members')
        .upsert(
          { conversation_id: conversationId, profile_id: existingProfile.id },
          { onConflict: 'conversation_id,profile_id', ignoreDuplicates: true },
        )
      await db
        .from('conversation_invites')
        .upsert(
          {
            conversation_id: conversationId,
            email: normalized,
            invited_by: invitedBy,
            accepted_at: new Date().toISOString(),
          },
          { onConflict: 'conversation_id,email' },
        )
      autoAdded += 1
      continue
    }

    const { error } = await db.from('conversation_invites').upsert(
      {
        conversation_id: conversationId,
        email: normalized,
        invited_by: invitedBy,
      },
      { onConflict: 'conversation_id,email', ignoreDuplicates: true },
    )
    if (!error) pendingEmails.push(normalized)
  }

  return { pendingEmails, autoAdded }
}

export async function sendConversationInviteEmails(
  emails: string[],
  inviterName: string,
  conversationTitle: string | null,
): Promise<void> {
  if (emails.length === 0) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const chatLabel = conversationTitle || 'a conversation on 5Bloc'
  const signupUrl = `${appUrl}/signup`

  await Promise.all(
    emails.map((email) =>
      send(
        email,
        `${inviterName} invited you to chat on 5Bloc`,
        `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0C1220">
          <p><strong>${inviterName}</strong> added you to <strong>${chatLabel}</strong> on 5Bloc.</p>
          <p>Create your free account to join the conversation and receive messages in real time.</p>
          <p><a href="${signupUrl}" style="display:inline-block;background:#F5A623;color:#0C1220;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Join 5Bloc</a></p>
          <p style="color:#5C5750;font-size:13px">If you already have an account, sign in with this email address.</p>
        </div>`,
      ),
    ),
  )
}

export async function addMembersToConversation(
  db: MessagingDb,
  conversationId: string,
  memberIds: string[],
  projectId: string | null,
): Promise<void> {
  if (memberIds.length === 0) return

  const rows = memberIds.map((profile_id) => ({ conversation_id: conversationId, profile_id }))
  await db
    .from('conversation_members')
    .upsert(rows, { onConflict: 'conversation_id,profile_id', ignoreDuplicates: true })

  if (projectId) {
    const pmRows = memberIds.map((profile_id) => ({
      project_id: projectId,
      profile_id,
      role: 'member',
    }))
    await db
      .from('project_members')
      .upsert(pmRows, { onConflict: 'project_id,profile_id', ignoreDuplicates: true })
  }
}

export async function findExistingDm(
  db: MessagingDb,
  myId: string,
  otherId: string,
): Promise<string | null> {
  const { data: myConvs } = await db
    .from('conversation_members')
    .select('conversation_id, conversations!inner(type)')
    .eq('profile_id', myId)

  const myDmIds = (myConvs || [])
    .filter((r: { conversations: { type: string } | null }) => r.conversations?.type === 'dm')
    .map((r) => r.conversation_id)

  if (myDmIds.length === 0) return null

  const { data: shared } = await db
    .from('conversation_members')
    .select('conversation_id')
    .eq('profile_id', otherId)
    .in('conversation_id', myDmIds)

  return shared?.[0]?.conversation_id ?? null
}
