import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_SITE_VISITS, MOCK_MATERIAL_LOGS, MOCK_PUNCH_ITEMS } from '@/lib/data/mock-store'

type Ctx = { params: Promise<{ id: string }> }

function normalizeVisit(row: any) {
  if (!row) return row
  return {
    ...row,
    date: row.visit_date || row.date,
    observations: row.observations || row.notes || '',
    photos: row.photos || row.photo_urls || [],
  }
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({
      visits: MOCK_SITE_VISITS.filter((v) => v.project_id === id).map(normalizeVisit),
      materials: MOCK_MATERIAL_LOGS.filter((m) => m.project_id === id),
      punch: MOCK_PUNCH_ITEMS.filter((p) => p.project_id === id),
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const [visits, materials, punch] = await Promise.all([
    auth.supabase
      .from('site_visits')
      .select('*')
      .eq('project_id', id)
      .order('visit_date', { ascending: false }),
    auth.supabase
      .from('material_logs')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
    auth.supabase
      .from('punch_items')
      .select('*')
      .eq('project_id', id)
      .order('item_number', { ascending: false }),
  ])

  if (visits.error) return NextResponse.json({ error: visits.error.message }, { status: 500 })
  if (materials.error) return NextResponse.json({ error: materials.error.message }, { status: 500 })
  if (punch.error) return NextResponse.json({ error: punch.error.message }, { status: 500 })

  return NextResponse.json({
    visits: (visits.data || []).map(normalizeVisit),
    materials: materials.data || [],
    punch: punch.data || [],
  })
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const kind = body.kind as 'visit' | 'material' | 'punch'
  if (!kind) return NextResponse.json({ error: 'kind required' }, { status: 400 })

  if (shouldServeMockData(auth)) {
    if (kind === 'visit') {
      const next =
        Math.max(0, ...MOCK_SITE_VISITS.filter((v) => v.project_id === id).map((v) => v.visit_number)) + 1
      const visit = {
        id: `sv-${Date.now()}`,
        project_id: id,
        visit_number: next,
        visit_date: new Date().toISOString().slice(0, 10),
        supervisor: body.supervisor || '',
        gps_coordinates: body.gps_coordinates || '',
        notes: body.observations || '',
        photo_urls: [],
      }
      MOCK_SITE_VISITS.unshift(visit as any)
      return NextResponse.json({ visit: normalizeVisit(visit) }, { status: 201 })
    }
    if (kind === 'material') {
      const material = {
        id: `mat-${Date.now()}`,
        project_id: id,
        material_name: body.material_name,
        specified_standard: body.specified_standard || '',
        delivered_material: body.delivered_material || '',
        status: body.status || 'pending_testing',
        contractor: body.contractor || '',
        notes: body.notes || '',
      }
      MOCK_MATERIAL_LOGS.unshift(material as any)
      return NextResponse.json({ material }, { status: 201 })
    }
    const next =
      Math.max(0, ...MOCK_PUNCH_ITEMS.filter((p) => p.project_id === id).map((p) => p.item_number)) + 1
    const item = {
      id: `punch-${Date.now()}`,
      project_id: id,
      item_number: next,
      defect: body.defect,
      location: body.location || '',
      assigned_to: body.assigned_to || '',
      status: 'open',
    }
    MOCK_PUNCH_ITEMS.unshift(item as any)
    return NextResponse.json({ punch: item }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data: project } = await auth.supabase.from('projects').select('org_id').eq('id', id).single()
  const orgId = project?.org_id || auth.orgId

  if (kind === 'visit') {
    const { data: last } = await auth.supabase
      .from('site_visits')
      .select('visit_number')
      .eq('project_id', id)
      .order('visit_number', { ascending: false })
      .limit(1)
      .maybeSingle()
    const { data, error } = await auth.supabase
      .from('site_visits')
      .insert({
        project_id: id,
        org_id: orgId,
        visit_number: (last?.visit_number || 0) + 1,
        visit_date: new Date().toISOString().slice(0, 10),
        supervisor: body.supervisor || null,
        gps_coordinates: body.gps_coordinates || null,
        notes: body.observations || null,
        photo_urls: [],
        created_by: auth.profile.id,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ visit: normalizeVisit(data) }, { status: 201 })
  }

  if (kind === 'material') {
    const { data, error } = await auth.supabase
      .from('material_logs')
      .insert({
        project_id: id,
        org_id: orgId,
        material_name: body.material_name,
        specified_standard: body.specified_standard || null,
        delivered_material: body.delivered_material || null,
        status: body.status || 'pending_testing',
        contractor: body.contractor || null,
        notes: body.notes || null,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ material: data }, { status: 201 })
  }

  const { data: lastPunch } = await auth.supabase
    .from('punch_items')
    .select('item_number')
    .eq('project_id', id)
    .order('item_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  const { data, error } = await auth.supabase
    .from('punch_items')
    .insert({
      project_id: id,
      org_id: orgId,
      item_number: (lastPunch?.item_number || 0) + 1,
      defect: body.defect,
      location: body.location || null,
      assigned_to: body.assigned_to || null,
      status: 'open',
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ punch: data }, { status: 201 })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  if (body.punch_id && body.status) {
    if (shouldServeMockData(auth)) {
      const item = MOCK_PUNCH_ITEMS.find((p) => p.id === body.punch_id && p.project_id === id)
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      item.status = body.status
      return NextResponse.json({ punch: item })
    }
    if (!hasSupabaseEnv() || !auth.supabase) {
      return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
    }

    const { data, error } = await auth.supabase
      .from('punch_items')
      .update({ status: body.status })
      .eq('id', body.punch_id)
      .eq('project_id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ punch: data })
  }

  if (body.material_id && body.status) {
    if (shouldServeMockData(auth)) {
      const item = MOCK_MATERIAL_LOGS.find((m) => m.id === body.material_id && m.project_id === id)
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      item.status = body.status
      return NextResponse.json({ material: item })
    }
    if (!hasSupabaseEnv() || !auth.supabase) {
      return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
    }

    const { data, error } = await auth.supabase
      .from('material_logs')
      .update({ status: body.status })
      .eq('id', body.material_id)
      .eq('project_id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ material: data })
  }

  return NextResponse.json({ error: 'punch_id or material_id required' }, { status: 400 })
}
