import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { notifyUser } from '@/lib/notifications/notify'
import { send } from '@/lib/email/resend'
import { RFICreatedEmail } from '@/lib/email/templates'


const handleGET = async ({ request, params }: any) => {
  const { id } = params as { id: string }
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })



  const { data, error } = await auth.supabase
    .from('rfis')
    .select('*')
    .eq('project_id', id)
    .order('rfi_number', { ascending: false })
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ rfis: data || [] })
}

const handlePOST = async ({ request, params }: any) => {
  const { id } = params as { id: string }
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.title) return json({ error: 'title required' }, { status: 400 })



  const { data: project } = await auth.supabase
    .from('projects')
    .select('org_id')
    .eq('id', id)
    .single()

  const { data: last } = await auth.supabase
    .from('rfis')
    .select('rfi_number')
    .eq('project_id', id)
    .order('rfi_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await auth.supabase
    .from('rfis')
    .insert({
      project_id: id,
      org_id: project?.org_id || auth.orgId,
      rfi_number: (last?.rfi_number || 0) + 1,
      title: body.title,
      description: body.description,
      drawing_ref: body.drawing_ref,
      attachment_url: body.attachment_url || null,
      due_date: body.due_date,
      raised_by: auth.profile.full_name || auth.profile.id,
      assigned_to: body.assigned_to || null,
      status: 'open',
    })
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })

  await auth.supabase.from('activity_log').insert({
    project_id: id,
    org_id: project?.org_id || auth.orgId,
    user_id: auth.profile.id,
    action: 'rfi.created',
    entity_type: 'rfi',
    entity_id: data.id,
    entity_name: data.title,
  })

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.5bloc.com').replace(/\/$/, '')
  const viewUrl = `${appUrl}/projects/${id}/rfis`
  const dueLabel = data.due_date || 'Not set'
  const rfiHtml = RFICreatedEmail(
    data.rfi_number,
    data.title,
    data.description || '',
    dueLabel,
    viewUrl
  )

  // assigned_to may be email, uuid, or a display name
  if (data.assigned_to && String(data.assigned_to).includes('@')) {
    try {
      await send(
        String(data.assigned_to),
        `New RFI #${data.rfi_number}: ${data.title}`,
        rfiHtml
      )
    } catch (e) {
      console.warn('RFI email (assigned_to) failed:', e)
    }
  }

  // Notify + email when assigned_to looks like a profile uuid
  if (data.assigned_to && /^[0-9a-f-]{36}$/i.test(String(data.assigned_to))) {
    await notifyUser(auth.supabase, {
      userId: data.assigned_to,
      title: 'New RFI assigned',
      body: data.title,
      type: 'rfi',
      href: `/projects/${id}/rfis`,
    })
    try {
      const { data: assignee } = await auth.supabase
        .from('profiles')
        .select('email')
        .eq('id', data.assigned_to)
        .maybeSingle()
      if (assignee?.email) {
        await send(
          assignee.email,
          `New RFI #${data.rfi_number}: ${data.title}`,
          rfiHtml
        )
      }
    } catch (e) {
      console.warn('RFI email (profile) failed:', e)
    }
  }

  return json({ rfi: data }, { status: 201 })
}

const handlePATCH = async ({ request, params }: any) => {
  const { id } = params as { id: string }
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.rfi_id) return json({ error: 'rfi_id required' }, { status: 400 })

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  for (const key of [
    'title',
    'description',
    'status',
    'response',
    'due_date',
    'assigned_to',
    'drawing_ref',
    'attachment_url',
    'is_scope_change',
    'scope_change_amount',
    'ai_draft_response',
  ]) {
    if (key in body) updates[key] = body[key]
  }

  if (body.response != null) {
    updates.responded_by = auth.profile.id
    updates.responded_at = new Date().toISOString()
    if (!body.status) updates.status = 'answered'
  }



  const { data, error } = await auth.supabase
    .from('rfis')
    .update(updates)
    .eq('id', body.rfi_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })

  if (body.response != null) {
    await auth.supabase.from('activity_log').insert({
      project_id: id,
      org_id: auth.orgId,
      user_id: auth.profile.id,
      action: 'rfi.answered',
      entity_type: 'rfi',
      entity_id: data.id,
      entity_name: data.title,
    })
    if (data.raised_by && data.raised_by !== auth.profile.id) {
      await notifyUser(auth.supabase, {
        userId: data.raised_by,
        title: 'RFI answered',
        body: data.title,
        type: 'rfi',
        href: `/projects/${id}/rfis`,
      })
    }
  }

  return json({ rfi: data })
}

export const Route = createFileRoute('/api/projects/$id/rfis')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
        PATCH: handlePATCH,
    },
  },
})
