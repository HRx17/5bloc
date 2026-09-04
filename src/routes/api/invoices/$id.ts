import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

type Ctx = { params: Promise<{ id: string }> }

const handlePATCH = async ({ request, params }: any) => {
  const { id } = (params as any)
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  for (const key of ['status', 'notes', 'due_date', 'paid_at']) {
    if (key in body) updates[key] = body[key]
  }
  if (body.status === 'paid' && !updates.paid_at) {
    updates.paid_at = new Date().toISOString()
  }



  const { data, error } = await auth.supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .eq('org_id', auth.orgId)
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ invoice: data })
}

export const Route = createFileRoute('/api/invoices/$id')({
  server: {
    handlers: {
        PATCH: handlePATCH,
    },
  },
})
