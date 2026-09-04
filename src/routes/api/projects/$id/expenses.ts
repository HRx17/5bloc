import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

const MOCK: Record<string, any[]> = {}

function mapExpense(row: any) {
  return {
    id: row.id,
    title: row.description || row.title || '',
    category: row.category || 'Other',
    amount: Number(row.amount || 0),
    date: row.expense_date || row.date || '',
  }
}

const handleGET = async ({ request, params }: any) => {
  const { id } = params as { id: string }
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })



  const { data, error } = await auth.supabase
    .from('project_expenses')
    .select('*')
    .eq('project_id', id)
    .order('expense_date', { ascending: false })
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ expenses: (data || []).map(mapExpense) })
}

const handlePOST = async ({ request, params }: any) => {
  const { id } = params as { id: string }
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const title = String(body.title || body.description || '').trim()
  const amount = Number(body.amount)
  if (!title || !Number.isFinite(amount)) {
    return json({ error: 'title and amount required' }, { status: 400 })
  }



  const { data: project } = await auth.supabase.from('projects').select('org_id').eq('id', id).single()
  const { data, error } = await auth.supabase
    .from('project_expenses')
    .insert({
      project_id: id,
      org_id: project?.org_id || auth.orgId,
      description: title,
      category: body.category || 'Other',
      amount,
      expense_date: body.date || new Date().toISOString().slice(0, 10),
      created_by: auth.profile.id,
    })
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ expense: mapExpense(data) }, { status: 201 })
}

const handleDELETE = async ({ request, params }: any) => {
  const { id } = params as { id: string }
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const expenseId = url.searchParams.get('expense_id')
  if (!expenseId) return json({ error: 'expense_id required' }, { status: 400 })



  const { error } = await auth.supabase
    .from('project_expenses')
    .delete()
    .eq('id', expenseId)
    .eq('project_id', id)
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ ok: true })
}

export const Route = createFileRoute('/api/projects/$id/expenses')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
        DELETE: handleDELETE,
    },
  },
})
