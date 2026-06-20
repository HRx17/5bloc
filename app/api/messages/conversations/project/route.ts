import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { addMembersToConversation, getMessagingDb } from '@/lib/messages/server'

export const dynamic = 'force-dynamic'

/**
 * Find or create the project-wide conversation for a project.
 * Query: ?projectId=uuid
 */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const db = getMessagingDb(supabase)
  const { data: me } = await supabase
    .from('profiles')
    .select('id, org_id')
    .eq('auth_id', user.id)
    .maybeSingle()
  if (!me) return NextResponse.json({ error: 'Profile not found' }, { status: 400 })

  const { data: existing } = await db
    .from('conversations')
    .select('id')
    .eq('project_id', projectId)
    .eq('type', 'project')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    await db
      .from('conversation_members')
      .upsert(
        { conversation_id: existing.id, profile_id: me.id },
        { onConflict: 'conversation_id,profile_id', ignoreDuplicates: true },
      )
    return NextResponse.json({ id: existing.id, existing: true })
  }

  const { data: project } = await db
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .maybeSingle()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const { data: projectMembers } = await db
    .from('project_members')
    .select('profile_id')
    .eq('project_id', projectId)

  const memberIds = Array.from(
    new Set([me.id, ...(projectMembers || []).map((m) => m.profile_id).filter(Boolean)]),
  )

  const { data: conv, error: convErr } = await db
    .from('conversations')
    .insert({
      org_id: me.org_id,
      project_id: projectId,
      type: 'project',
      title: `${project.name} · Team chat`,
      created_by: me.id,
    })
    .select('id')
    .single()

  if (convErr || !conv) {
    return NextResponse.json({ error: 'Could not create project chat' }, { status: 500 })
  }

  await addMembersToConversation(db, conv.id, memberIds, projectId)

  return NextResponse.json({ id: conv.id, existing: false })
}
