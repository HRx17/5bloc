import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Add registered users to an existing conversation.
 * Body: { memberProfileIds: string[] }. Caller must already be a member.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleClient()
  const { data: me } = await admin
    .from('profiles')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()
  if (!me) return NextResponse.json({ error: 'Profile not found' }, { status: 400 })

  // Caller must be a member of the conversation
  const { data: membership } = await admin
    .from('conversation_members')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('profile_id', me.id)
    .maybeSingle()
  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const rawIds: string[] = Array.isArray(body.memberProfileIds) ? body.memberProfileIds : []
  const memberIds = Array.from(new Set(rawIds.filter(Boolean)))
  if (memberIds.length === 0) return NextResponse.json({ error: 'No users provided' }, { status: 400 })

  const rows = memberIds.map((profile_id) => ({ conversation_id: conversationId, profile_id }))
  // Ignore duplicates (unique constraint) by upserting on the unique pair
  const { error } = await admin
    .from('conversation_members')
    .upsert(rows, { onConflict: 'conversation_id,profile_id', ignoreDuplicates: true })
  if (error) return NextResponse.json({ error: 'Could not add members' }, { status: 500 })

  // If this conversation is tied to a project, mirror membership into project_members
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

  return NextResponse.json({ ok: true, added: memberIds.length })
}
