import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

type Ctx = { params: Promise<{ id: string }> }

const handleGET = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })



  const { data, error } = await auth.supabase
    .from('submittals')
    .select('*')
    .eq('project_id', id)
    .order('submittal_number', { ascending: false })
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ submittals: data || [] })
}

const handlePOST = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const role = auth.profile.role
  if (!['architect', 'contractor', 'builder', 'consultant'].includes(role)) {
    return json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.title) return json({ error: 'title required' }, { status: 400 })



  const { data: project } = await auth.supabase
    .from('projects')
    .select('org_id')
    .eq('id', id)
    .single()

  const { data: last } = await auth.supabase
    .from('submittals')
    .select('submittal_number')
    .eq('project_id', id)
    .order('submittal_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await auth.supabase
    .from('submittals')
    .insert({
      project_id: id,
      org_id: project?.org_id || auth.orgId,
      submittal_number: (last?.submittal_number || 0) + 1,
      title: body.title,
      spec_section: body.spec_section || null,
      contractor: body.contractor || auth.profile.full_name || null,
      description: body.description || null,
      due_date: body.due_date || null,
      file_name: body.file_name || null,
      status: 'pending',
      revision: 0,
      submitted_by: auth.profile.id,
    })
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })

  await auth.supabase.from('activity_log').insert({
    project_id: id,
    org_id: project?.org_id || auth.orgId,
    user_id: auth.profile.id,
    action: 'submittal.created',
    entity_type: 'submittal',
    entity_id: data.id,
    entity_name: data.title,
  })

  return json({ submittal: data }, { status: 201 })
}

const handlePATCH = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.submittal_id) {
    return json({ error: 'submittal_id required' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  for (const key of ['status', 'review_note', 'file_name', 'description', 'due_date', 'revision']) {
    if (key in body) updates[key] = body[key]
  }

  const reviewing = ['approved', 'rejected', 'revise_resubmit', 'under_review'].includes(
    String(body.status || '')
  )
  if (reviewing) {
    if (!['architect', 'builder', 'consultant'].includes(auth.profile.role)) {
      return json({ error: 'Only reviewers can change status' }, { status: 403 })
    }
    updates.reviewed_by = auth.profile.id
    updates.reviewed_at = new Date().toISOString()
  }



  const { data, error } = await auth.supabase
    .from('submittals')
    .update(updates)
    .eq('id', body.submittal_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })

  await auth.supabase.from('activity_log').insert({
    project_id: id,
    org_id: auth.orgId,
    user_id: auth.profile.id,
    action: 'submittal.reviewed',
    entity_type: 'submittal',
    entity_id: data.id,
    entity_name: data.title,
    metadata: { status: data.status },
  })

  return json({ submittal: data })
}

export const Route = createFileRoute('/api/projects/$id/submittals')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
        PATCH: handlePATCH,
    },
  },
})
