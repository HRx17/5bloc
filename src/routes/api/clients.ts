import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }



  const { data, error } = await auth.supabase
    .from('clients')
    .select('*')
    .eq('org_id', auth.orgId)
    .order('created_at', { ascending: false })
  if (error) return json({ error: error.message }, { status: 500 })
  const clients = (data || []).map((c: any) => ({
    ...c,
    full_name: c.full_name || c.name,
  }))
  return json({ clients })
}

const handlePOST = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.full_name) return json({ error: 'full_name required' }, { status: 400 })



  const { data, error } = await auth.supabase
    .from('clients')
    .insert({
      org_id: auth.orgId,
      name: body.full_name,
      full_name: body.full_name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      city: body.city,
      state: body.state,
      notes: body.notes,
      pipeline_stage: body.pipeline_stage || 'prospect',
      total_value: body.total_value || 0,
    })
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })
  return json({
    client: { ...data, full_name: data.full_name || data.name },
  }, { status: 201 })
}

export const Route = createFileRoute('/api/clients')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
    },
  },
})
