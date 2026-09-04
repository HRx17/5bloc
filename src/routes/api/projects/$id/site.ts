import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

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

const handleGET = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })



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

  if (visits.error) return json({ error: visits.error.message }, { status: 500 })
  if (materials.error) return json({ error: materials.error.message }, { status: 500 })
  if (punch.error) return json({ error: punch.error.message }, { status: 500 })

  return json({
    visits: (visits.data || []).map(normalizeVisit),
    materials: materials.data || [],
    punch: punch.data || [],
  })
}

const handlePOST = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const kind = body.kind as 'visit' | 'material' | 'punch'
  if (!kind) return json({ error: 'kind required' }, { status: 400 })



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
    if (error) return json({ error: error.message }, { status: 500 })
    return json({ visit: normalizeVisit(data) }, { status: 201 })
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
    if (error) return json({ error: error.message }, { status: 500 })
    return json({ material: data }, { status: 201 })
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
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ punch: data }, { status: 201 })
}

const handlePATCH = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()

  if (body.punch_id && body.status) {

    const { data, error } = await auth.supabase
      .from('punch_items')
      .update({ status: body.status })
      .eq('id', body.punch_id)
      .eq('project_id', id)
      .select()
      .single()
    if (error) return json({ error: error.message }, { status: 500 })
    return json({ punch: data })
  }

  if (body.material_id && body.status) {

    const { data, error } = await auth.supabase
      .from('material_logs')
      .update({ status: body.status })
      .eq('id', body.material_id)
      .eq('project_id', id)
      .select()
      .single()
    if (error) return json({ error: error.message }, { status: 500 })
    return json({ material: data })
  }

  return json({ error: 'punch_id or material_id required' }, { status: 400 })
}

export const Route = createFileRoute('/api/projects/$id/site')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
        PATCH: handlePATCH,
    },
  },
})
