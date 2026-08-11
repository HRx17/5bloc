import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import {
  MOCK_PROJECTS,
  MOCK_MILESTONES,
  MOCK_MEMBERS,
  MOCK_DOCUMENTS,
  MOCK_RFIS,
} from '@/lib/data/mock-store'
import { milestoneRead } from '@/lib/supabase/schema-map'

type Ctx = { params: Promise<{ id: string }> }

const PROJECT_PATCH_KEYS = [
  'name',
  'type',
  'city',
  'state',
  'address',
  'total_sqft',
  'floors',
  'spec_level',
  'brief',
  'construction_cost',
  'architect_fee',
  'architect_fee_pct',
  'start_date',
  'estimated_end',
  'end_date',
  'client_id',
  'status',
  'phase_key',
  'is_rera_registered',
  'rera_number',
  'portal_enabled',
] as const

function normalizeProject(project: any) {
  if (!project) return project
  return {
    ...project,
    phase: project.phase_key || project.phase,
    estimated_end: project.estimated_end || project.end_date,
  }
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    const project = MOCK_PROJECTS.find((p) => p.id === id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const membership = MOCK_MEMBERS.find(
      (m) => m.project_id === id && m.user_id === auth.profile.id
    )
    return NextResponse.json({
      project,
      milestones: MOCK_MILESTONES.filter((m) => m.project_id === id),
      membership: membership || {
        role: auth.profile.role,
        can_upload: true,
        can_comment: true,
        can_approve: auth.profile.role === 'architect',
      },
      documents: MOCK_DOCUMENTS.filter((d) => d.project_id === id),
      rfis: MOCK_RFIS.filter((r) => r.project_id === id),
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data: project, error } = await auth.supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [{ data: milestones }, { data: membership }, { data: documents }, { data: rfis }] =
    await Promise.all([
      auth.supabase.from('phase_milestones').select('*').eq('project_id', id),
      auth.supabase
        .from('project_members')
        .select('*')
        .eq('project_id', id)
        .eq('profile_id', auth.profile.id)
        .maybeSingle(),
      auth.supabase.from('documents').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      auth.supabase.from('rfis').select('*').eq('project_id', id).order('rfi_number', { ascending: false }),
    ])

  return NextResponse.json({
    project: normalizeProject(project),
    milestones: (milestones || []).map(milestoneRead),
    membership,
    documents: documents || [],
    rfis: rfis || [],
  })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect' && auth.profile.role !== 'builder') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of PROJECT_PATCH_KEYS) {
    if (key in body) updates[key] = body[key]
  }
  if ('phase' in body && !('phase_key' in updates)) {
    updates.phase_key = body.phase
  }
  if ('estimated_end' in body) updates.end_date = body.estimated_end

  if (shouldServeMockData(auth)) {
    const idx = MOCK_PROJECTS.findIndex((p) => p.id === id)
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    MOCK_PROJECTS[idx] = { ...MOCK_PROJECTS[idx], ...updates, ...body }
    return NextResponse.json({ project: MOCK_PROJECTS[idx] })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: normalizeProject(data) })
}
