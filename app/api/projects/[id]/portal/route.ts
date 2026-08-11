import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_PORTAL_SETTINGS, MOCK_PROJECTS } from '@/lib/data/mock-store'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({
      settings: { ...MOCK_PORTAL_SETTINGS, project_id: id },
      project: MOCK_PROJECTS.find((p) => p.id === id),
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data: settings } = await auth.supabase
    .from('client_portal_settings')
    .select('*')
    .eq('project_id', id)
    .maybeSingle()
  const { data: project } = await auth.supabase.from('projects').select('*').eq('id', id).single()
  return NextResponse.json({ settings, project })
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  if (shouldServeMockData(auth)) {
    const idx = MOCK_PROJECTS.findIndex((p) => p.id === id)
    if (idx >= 0) {
      MOCK_PROJECTS[idx].portal_enabled = body.portal_enabled ?? true
      if (!MOCK_PROJECTS[idx].portal_token) {
        MOCK_PROJECTS[idx].portal_token = `portal-${Date.now().toString(36)}`
      }
    }
    Object.assign(MOCK_PORTAL_SETTINGS, body.settings || {}, { project_id: id })
    return NextResponse.json({
      ok: true,
      settings: MOCK_PORTAL_SETTINGS,
      project: MOCK_PROJECTS[idx],
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  if (body.portal_enabled != null) {
    const { data: existing } = await auth.supabase
      .from('projects')
      .select('portal_token')
      .eq('id', id)
      .single()

    const projectPatch: Record<string, unknown> = {
      portal_enabled: body.portal_enabled,
    }
    if (body.portal_enabled && !existing?.portal_token) {
      projectPatch.portal_token =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
          : `portal-${Date.now()}`
    }
    await auth.supabase.from('projects').update(projectPatch).eq('id', id)
  }

  const { data: settings, error } = await auth.supabase
    .from('client_portal_settings')
    .upsert({ project_id: id, ...(body.settings || {}), updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: project } = await auth.supabase.from('projects').select('*').eq('id', id).single()
  return NextResponse.json({ ok: true, settings, project })
}
