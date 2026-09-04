import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Create a conversation and add the creator + the given members.
 * Body: { title?: string, projectId?: string, memberProfileIds: string[] }
 * For 1:1 (creator + one member, no project) an existing DM is reused.
 */
const handlePOST = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const me = auth.profile
  if (!me?.id) return json({ error: 'Profile not found' }, { status: 400 })

  const admin = createServiceRoleClient()
  const body = await request.json().catch(() => ({}))
  const title: string | null = body.title?.trim() || null
  const projectId: string | null = body.projectId || null
  const rawIds: string[] = Array.isArray(body.memberProfileIds) ? body.memberProfileIds : []
  const memberIds = Array.from(new Set(rawIds.filter((id: string) => id && id !== me.id)))

  if (memberIds.length === 0) {
    return json({ error: 'Add at least one person' }, { status: 400 })
  }

  const isDm = memberIds.length === 1 && !projectId
  const type = projectId ? 'project' : isDm ? 'dm' : 'group'

  if (isDm) {
    const other = memberIds[0]!
    const { data: myConvs } = await admin
      .from('conversation_members')
      .select('conversation_id, conversations!inner(type)')
      .eq('profile_id', me.id)
    const myDmIds = (myConvs || [])
      .filter((r: any) => {
        const conv = Array.isArray(r.conversations) ? r.conversations[0] : r.conversations
        return conv?.type === 'dm'
      })
      .map((r: any) => r.conversation_id)
    if (myDmIds.length > 0) {
      const { data: shared } = await admin
        .from('conversation_members')
        .select('conversation_id')
        .eq('profile_id', other)
        .in('conversation_id', myDmIds)
      if (shared && shared.length > 0) {
        return json({ id: shared[0]!.conversation_id, existing: true })
      }
    }
  }

  const { data: conv, error: convErr } = await admin
    .from('conversations')
    .insert({
      org_id: (me as any).org_id ?? null,
      project_id: projectId,
      type,
      title,
      created_by: me.id,
    })
    .select('id')
    .single()

  if (convErr || !conv) {
    return json({ error: 'Could not create conversation' }, { status: 500 })
  }

  const rows = [me.id, ...memberIds].map((profile_id) => ({
    conversation_id: conv.id,
    profile_id,
  }))
  const { error: memErr } = await admin.from('conversation_members').insert(rows)
  if (memErr) return json({ error: 'Could not add members' }, { status: 500 })

  return json({ id: conv.id })
}

export const Route = createFileRoute('/api/messages/conversations')({
  server: { handlers: { POST: handlePOST } },
})
