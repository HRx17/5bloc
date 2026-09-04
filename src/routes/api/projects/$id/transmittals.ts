import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

type Ctx = { params: Promise<{ id: string }> }

function normalize(row: any) {
  if (!row) return row
  return {
    ...row,
    date: row.sent_date || row.date,
  }
}

const handleGET = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }



  const { data, error } = await auth.supabase
    .from('transmittals')
    .select('*')
    .eq('project_id', id)
    .order('sent_date', { ascending: false })
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ transmittals: (data || []).map(normalize) })
}

const handlePOST = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.recipient_name) {
    return json({ error: 'recipient_name required' }, { status: 400 })
  }



  const { data: project } = await auth.supabase.from('projects').select('org_id').eq('id', id).single()
  const { count } = await auth.supabase
    .from('transmittals')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)

  const base = {
    project_id: id,
    org_id: project?.org_id || auth.orgId,
    transmittal_no: `TR-${String((count || 0) + 1).padStart(3, '0')}`,
    sent_date: body.date || new Date().toISOString().slice(0, 10),
    recipient_name: body.recipient_name,
    recipient_company: body.recipient_company || null,
    via: body.via || 'Email',
    documents: body.documents || null,
    purpose: body.purpose || 'For Information',
    status: 'sent',
    created_by: auth.profile.id,
  }

  let { data, error } = await auth.supabase
    .from('transmittals')
    .insert({ ...base, attachment_url: body.attachment_url || null })
    .select()
    .single()

  // attachment_url arrives with 20260821120000_transmittal_attachments.sql
  if (error && /attachment_url|column|schema cache/i.test(error.message)) {
    const retry = await auth.supabase.from('transmittals').insert(base).select().single()
    data = retry.data
    error = retry.error
  }

  if (error) return json({ error: error.message }, { status: 500 })
  return json({ transmittal: normalize(data) }, { status: 201 })
}

const handlePATCH = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json()
  if (!body.transmittal_id) {
    return json({ error: 'transmittal_id required' }, { status: 400 })
  }



  const { data, error } = await auth.supabase
    .from('transmittals')
    .update({ status: body.status })
    .eq('id', body.transmittal_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ transmittal: normalize(data) })
}

export const Route = createFileRoute('/api/projects/$id/transmittals')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
        PATCH: handlePATCH,
    },
  },
})
