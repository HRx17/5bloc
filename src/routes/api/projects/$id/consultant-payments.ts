import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

const MOCK: Record<string, any[]> = {}

const handleGET = async ({ request, params }: any) => {
  const { id } = params as { id: string }
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })



  const { data, error } = await auth.supabase
    .from('consultant_payments')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ payments: data || [] })
}

const handlePOST = async ({ request, params }: any) => {
  const { id } = params as { id: string }
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.consultant_name || body.amount == null) {
    return json({ error: 'consultant_name and amount required' }, { status: 400 })
  }



  const { data: project } = await auth.supabase.from('projects').select('org_id').eq('id', id).single()
  const { data, error } = await auth.supabase
    .from('consultant_payments')
    .insert({
      project_id: id,
      org_id: project?.org_id || auth.orgId,
      consultant_name: body.consultant_name,
      discipline: body.discipline || 'Structural',
      milestone_phase: body.milestone_phase || null,
      amount: Number(body.amount),
      status: body.status || 'pending',
      due_date: body.due_date || null,
      created_by: auth.profile.id,
    })
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ payment: data }, { status: 201 })
}

const handlePATCH = async ({ request, params }: any) => {
  const { id } = params as { id: string }
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.payment_id) return json({ error: 'payment_id required' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.status) {
    updates.status = body.status
    if (body.status === 'paid') {
      updates.paid_date = body.paid_date || new Date().toISOString().slice(0, 10)
    }
  }
  for (const key of ['consultant_name', 'discipline', 'milestone_phase', 'amount', 'due_date', 'paid_date']) {
    if (key in body) updates[key] = body[key]
  }



  const { data, error } = await auth.supabase
    .from('consultant_payments')
    .update(updates)
    .eq('id', body.payment_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ payment: data })
}

export const Route = createFileRoute('/api/projects/$id/consultant-payments')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
        PATCH: handlePATCH,
    },
  },
})
