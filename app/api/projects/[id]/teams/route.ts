import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import {
  assertProjectAccess,
  canAccessProjectId,
  getOrgDb,
  PROJECT_TEAM_TEMPLATES,
} from '@/lib/org/server'

export const dynamic = 'force-dynamic'

async function requireProjectAccess(projectId: string, userId: string) {
  const supabase = await createSupabaseServer()
  const db = getOrgDb(supabase)
  const access = await assertProjectAccess(db, userId)
  if (!access) return { error: NextResponse.json({ error: 'Profile not found' }, { status: 400 }) }
  const allowed = await canAccessProjectId(db, projectId, access.profileId, access.orgId)
  if (!allowed) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { db, access }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gate = await requireProjectAccess(projectId, user.id)
  if (gate.error) return gate.error

  const { data: teams } = await gate.db!
    .from('project_teams')
    .select('id, name, template_key, created_at, project_team_members(id, profile_id, invite_email, display_name, is_external, project_role, status, profiles(full_name, email, role))')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  return NextResponse.json({
    templates: PROJECT_TEAM_TEMPLATES,
    teams: teams ?? [],
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gate = await requireProjectAccess(projectId, user.id)
  if (gate.error) return gate.error

  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const templateKey = typeof body.templateKey === 'string' ? body.templateKey : null
  if (!name) return NextResponse.json({ error: 'Team name required' }, { status: 400 })

  const { data: team, error } = await gate.db!
    .from('project_teams')
    .insert({
      project_id: projectId,
      name,
      template_key: templateKey,
      created_by: gate.access!.profileId,
    })
    .select('id, name, template_key, created_at')
    .single()

  if (error || !team) return NextResponse.json({ error: 'Could not create team' }, { status: 500 })
  return NextResponse.json({ team })
}
