import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Add registered users to an existing conversation.
 * Body: { memberProfileIds: string[] }. Caller must already be a member.
 */
const handlePOST = async ({ request, params }: any) => {
  const { id: conversationId } = params as { id: string }
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const me = auth.profile
  if (!me?.id) return json({ error: 'Profile not found' }, { status: 400 })

  const admin = createServiceRoleClient()
  const { data: membership } = await admin
    .from('conversation_members')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('profile_id', me.id)
    .maybeSingle()
  if (!membership) return json({ error: 'Not a member' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const rawIds: string[] = Array.isArray(body.memberProfileIds) ? body.memberProfileIds : []
  const memberIds = Array.from(new Set(rawIds.filter(Boolean)))
  if (memberIds.length === 0) return json({ error: 'No users provided' }, { status: 400 })

  const rows = memberIds.map((profile_id) => ({ conversation_id: conversationId, profile_id }))
  const { error } = await admin
    .from('conversation_members')
    .upsert(rows, { onConflict: 'conversation_id,profile_id', ignoreDuplicates: true })
  if (error) return json({ error: 'Could not add members' }, { status: 500 })

  const { data: conv } = await admin
    .from('conversations')
    .select('project_id')
    .eq('id', conversationId)
    .maybeSingle()
  if (conv?.project_id) {
    const pmRows = memberIds.map((profile_id) => ({
      project_id: conv.project_id as string,
      profile_id,
      role: 'member',
    }))
    await admin
      .from('project_members')
      .upsert(pmRows, { onConflict: 'project_id,profile_id', ignoreDuplicates: true })
  }

  return json({ ok: true, added: memberIds.length })
}

export const Route = createFileRoute('/api/messages/conversations/$id/members')({
  server: { handlers: { POST: handlePOST } },
})
