import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_INVOICES, MOCK_PROJECTS, MOCK_CLIENTS } from '@/lib/data/mock-store'

function normalizeInvoice(row: any, projectName?: string) {
  if (!row) return row
  const subtotal = Number(row.subtotal ?? row.amount ?? 0)
  const total = Number(row.total ?? row.amount ?? subtotal)
  return {
    ...row,
    subtotal,
    total,
    amount: total,
    client_name: row.client_name || row.client_name_display || 'Client',
    project_name: row.project_name || projectName || row.projects?.name || '—',
  }
}

export async function GET(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const projectId = new URL(req.url).searchParams.get('project_id')

  if (shouldServeMockData(auth)) {
    let invoices = MOCK_INVOICES.map((inv) => {
      const project = MOCK_PROJECTS.find((p) => p.id === inv.project_id)
      const client = MOCK_CLIENTS.find((c) => c.id === inv.client_id)
      return normalizeInvoice({
        ...inv,
        client_name: client?.full_name || 'Client',
        project_name: project?.name || 'Project',
      })
    })
    if (projectId) invoices = invoices.filter((i) => i.project_id === projectId)
    return NextResponse.json({ invoices })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  let query = auth.supabase
    .from('invoices')
    .select('*, projects(name)')
    .eq('org_id', auth.orgId)
    .order('created_at', { ascending: false })
  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    invoices: (data || []).map((row: any) => normalizeInvoice(row, row.projects?.name)),
  })
}

export async function POST(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!auth.orgId) {
    return NextResponse.json({ error: 'Complete firm onboarding first' }, { status: 400 })
  }

  const body = await req.json()
  const subtotal = Number(body.subtotal ?? 0)
  if (subtotal <= 0) {
    return NextResponse.json({ error: 'subtotal required' }, { status: 400 })
  }

  const isInterstate = !!body.is_interstate || !!body.isInterstate
  const gstRate = Number(body.gst_rate ?? 18)
  const totalGst = Math.round(subtotal * (gstRate / 100))
  const cgst = isInterstate ? 0 : Math.round(totalGst / 2)
  const sgst = isInterstate ? 0 : totalGst - cgst
  const igst = isInterstate ? totalGst : 0
  const total = subtotal + totalGst
  const status = body.status || 'sent'
  const dueDate = body.due_date || body.dueDate || null
  const lineItems = body.line_items || body.lineItems || []
  const milestoneLabel = body.milestone_label || body.milestoneLabel || null
  const phase = body.phase || null
  const notes = body.notes || null

  const billToRaw = String(body.bill_to || body.billTo || 'client').toLowerCase()
  const BILL_TO = new Set(['client', 'contractor', 'consultant', 'other'])
  const billTo = BILL_TO.has(billToRaw) ? billToRaw : 'client'

  let clientName = String(body.client_name || body.clientName || '').trim()
  let projectName = body.project_name || body.projectName || ''
  let clientId = body.client_id || body.client || null
  let projectId = body.project_id || body.project || null

  // Client invoices must name a real CRM contact — never invent a bill-to.
  if (billTo === 'client' && !clientId) {
    return NextResponse.json(
      { error: 'Select the client this invoice is billed to.' },
      { status: 400 }
    )
  }
  if (billTo !== 'client' && !clientName) {
    return NextResponse.json(
      { error: 'Enter who this invoice is billed to.' },
      { status: 400 }
    )
  }
  if (billTo !== 'client') {
    clientId = null
  }

  if (shouldServeMockData(auth)) {
    if (clientId && !clientName) {
      clientName = MOCK_CLIENTS.find((c) => c.id === clientId)?.full_name || ''
    }
    if (billTo === 'client' && !clientName) {
      return NextResponse.json(
        { error: 'Select the client this invoice is billed to.' },
        { status: 400 }
      )
    }
    if (projectId && !projectName) {
      projectName = MOCK_PROJECTS.find((p) => p.id === projectId)?.name || 'Project'
    }
    const inv = {
      id: `inv-${Date.now()}`,
      org_id: auth.orgId || 'mock-org-id',
      project_id: projectId,
      client_id: clientId,
      invoice_number: `INV-${String(MOCK_INVOICES.length + 1).padStart(3, '0')}`,
      client_name: clientName,
      project_name: projectName || 'Project',
      phase,
      milestone_label: milestoneLabel,
      line_items: lineItems,
      subtotal,
      is_interstate: isInterstate,
      gst_rate: gstRate,
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: igst,
      total,
      amount: total,
      status,
      due_date: dueDate,
      notes,
      paid_at: null,
      created_at: new Date().toISOString(),
    }
    MOCK_INVOICES.unshift(inv as any)
    return NextResponse.json({ invoice: normalizeInvoice(inv) }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  if (clientId && !clientName) {
    const { data: client } = await auth.supabase
      .from('clients')
      .select('name, full_name')
      .eq('id', clientId)
      .maybeSingle()
    clientName = client?.full_name || client?.name || ''
  }
  if (billTo === 'client' && !clientName) {
    return NextResponse.json(
      { error: 'Select the client this invoice is billed to.' },
      { status: 400 }
    )
  }
  if (projectId && !projectName) {
    const { data: project } = await auth.supabase
      .from('projects')
      .select('name, client_id')
      .eq('id', projectId)
      .maybeSingle()
    projectName = project?.name || 'Project'
  }

  const { data: numberRow } = await auth.supabase.rpc('next_invoice_number', {
    p_org_id: auth.orgId,
  })
  const invoiceNumber = numberRow || `INV-${Date.now().toString().slice(-4)}`

  const { data, error } = await auth.supabase
    .from('invoices')
    .insert({
      org_id: auth.orgId,
      project_id: projectId,
      client_id: clientId,
      invoice_number: invoiceNumber,
      client_name: clientName,
      client_name_display: clientName,
      project_name: projectName,
      phase,
      milestone_label: milestoneLabel,
      line_items: lineItems,
      subtotal,
      is_interstate: isInterstate,
      gst_rate: gstRate,
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: igst,
      total,
      amount: total,
      currency: 'INR',
      status,
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: dueDate,
      notes,
      created_by: auth.profile.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (projectId) {
    await auth.supabase.from('activity_log').insert({
      project_id: projectId,
      org_id: auth.orgId,
      user_id: auth.profile.id,
      action: 'invoice.created',
      entity_type: 'invoice',
      entity_id: data.id,
      entity_name: data.invoice_number,
    })
  }

  return NextResponse.json({ invoice: normalizeInvoice(data, projectName) }, { status: 201 })
}
