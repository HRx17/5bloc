import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
type Ctx = { params: Promise<{ id: string }> }

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

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({ expenses: (MOCK[id] || []).map(mapExpense) })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase
    .from('project_expenses')
    .select('*')
    .eq('project_id', id)
    .order('expense_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expenses: (data || []).map(mapExpense) })
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const title = String(body.title || body.description || '').trim()
  const amount = Number(body.amount)
  if (!title || !Number.isFinite(amount)) {
    return NextResponse.json({ error: 'title and amount required' }, { status: 400 })
  }

  if (shouldServeMockData(auth)) {
    const row = {
      id: `exp-${Date.now()}`,
      project_id: id,
      description: title,
      category: body.category || 'Other',
      amount,
      expense_date: body.date || new Date().toISOString().slice(0, 10),
    }
    MOCK[id] = [row, ...(MOCK[id] || [])]
    return NextResponse.json({ expense: mapExpense(row) }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expense: mapExpense(data) }, { status: 201 })
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const expenseId = url.searchParams.get('expense_id')
  if (!expenseId) return NextResponse.json({ error: 'expense_id required' }, { status: 400 })

  if (shouldServeMockData(auth)) {
    MOCK[id] = (MOCK[id] || []).filter((e) => e.id !== expenseId)
    return NextResponse.json({ ok: true })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { error } = await auth.supabase
    .from('project_expenses')
    .delete()
    .eq('id', expenseId)
    .eq('project_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
