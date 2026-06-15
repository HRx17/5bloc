import { supabaseClient } from '@/lib/supabase/client'

export interface ChatProfile {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  avatar_url: string | null
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string | null
  body: string
  attachment_url: string | null
  attachment_name: string | null
  created_at: string
  sender?: ChatProfile | null
}

export interface ChatConversation {
  id: string
  type: string
  title: string | null
  project_id: string | null
  last_message_at: string
  members: ChatProfile[]
  lastMessage: { body: string; sender_id: string | null; created_at: string } | null
  unread: number
}

/** Current user's profile (id used everywhere as the messaging identity). */
export async function getMyProfile(): Promise<ChatProfile | null> {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) return null
    const { data } = await supabaseClient
      .from('profiles')
      .select('id, full_name, email, role, avatar_url')
      .eq('auth_id', user.id)
      .maybeSingle()
    return data ?? null
  } catch {
    return null
  }
}

/**
 * Load all conversations the current user belongs to, enriched with members,
 * the last message preview and an unread count.
 */
export async function listConversations(myProfileId: string): Promise<ChatConversation[]> {
  const { data: myMemberships, error } = await supabaseClient
    .from('conversation_members')
    .select('conversation_id, last_read_at')
    .eq('profile_id', myProfileId)
  if (error || !myMemberships || myMemberships.length === 0) return []

  const convIds = myMemberships.map((m) => m.conversation_id)
  const lastReadMap = new Map(myMemberships.map((m) => [m.conversation_id, m.last_read_at]))

  const [{ data: convs }, { data: members }, { data: recent }] = await Promise.all([
    supabaseClient
      .from('conversations')
      .select('id, type, title, project_id, last_message_at')
      .in('id', convIds)
      .order('last_message_at', { ascending: false }),
    supabaseClient
      .from('conversation_members')
      .select('conversation_id, profiles(id, full_name, email, role, avatar_url)')
      .in('conversation_id', convIds),
    supabaseClient
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false })
      .limit(400),
  ])

  const membersByConv = new Map<string, ChatProfile[]>()
  for (const row of members || []) {
    const p = (row as { profiles: ChatProfile | null }).profiles
    if (!p) continue
    const arr = membersByConv.get(row.conversation_id) || []
    arr.push(p)
    membersByConv.set(row.conversation_id, arr)
  }

  const lastByConv = new Map<string, { body: string; sender_id: string | null; created_at: string }>()
  const unreadByConv = new Map<string, number>()
  for (const m of recent || []) {
    if (!lastByConv.has(m.conversation_id)) {
      lastByConv.set(m.conversation_id, { body: m.body, sender_id: m.sender_id, created_at: m.created_at })
    }
    const lastRead = lastReadMap.get(m.conversation_id)
    if (m.sender_id !== myProfileId && (!lastRead || m.created_at > lastRead)) {
      unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) || 0) + 1)
    }
  }

  return (convs || []).map((c) => ({
    id: c.id,
    type: c.type,
    title: c.title,
    project_id: c.project_id,
    last_message_at: c.last_message_at,
    members: membersByConv.get(c.id) || [],
    lastMessage: lastByConv.get(c.id) || null,
    unread: unreadByConv.get(c.id) || 0,
  }))
}

export async function listMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabaseClient
    .from('messages')
    .select('id, conversation_id, sender_id, body, attachment_url, attachment_name, created_at, sender:profiles(id, full_name, email, role, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(500)
  if (error || !data) return []
  return data as unknown as ChatMessage[]
}

export async function sendMessage(conversationId: string, senderId: string, body: string): Promise<ChatMessage | null> {
  const { data, error } = await supabaseClient
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select('id, conversation_id, sender_id, body, attachment_url, attachment_name, created_at, sender:profiles(id, full_name, email, role, avatar_url)')
    .single()
  if (error || !data) return null
  return data as unknown as ChatMessage
}

export async function markConversationRead(conversationId: string, profileId: string): Promise<void> {
  await supabaseClient
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('profile_id', profileId)
}

/** Display label for a conversation given the current user. */
export function conversationTitle(c: ChatConversation, myProfileId: string): string {
  if (c.title) return c.title
  const others = c.members.filter((m) => m.id !== myProfileId)
  if (others.length === 0) return 'You'
  if (others.length === 1) return others[0].full_name || others[0].email || 'Direct message'
  return others.map((m) => (m.full_name || m.email || 'User').split(' ')[0]).join(', ')
}

export function initialsOf(name: string | null | undefined, email?: string | null): string {
  const src = (name || email || 'U').trim()
  const parts = src.split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return src.slice(0, 2).toUpperCase()
}

export function relativeTime(iso: string): string {
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
