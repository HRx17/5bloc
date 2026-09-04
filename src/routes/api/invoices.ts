import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

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

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }

  const projectId = new URL(request.url).searchParams.get('project_id')



  let query = auth.supabase
    .from('invoices')
    .select('*, projects(name)')
    .eq('org_id', auth.orgId)
    .order('created_at', { ascending: false })
  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) return json({ error: error.message }, { status: 500 })
  return json({
    invoices: (data || []).map((row: any) => normalizeInvoice(row, row.projects?.name)),
  })
}

const handlePOST = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!auth.orgId) {
    return json({ error: 'Complete firm onboarding first' }, { status: 400 })
  }

  const body = await request.json()
  const subtotal = Number(body.subtotal ?? 0)
  if (subtotal <= 0) {
    return json({ error: 'subtotal required' }, { status: 400 })
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
    return json(
      { error: 'Select the client this invoice is billed to.' },
      { status: 400 }
    )
  }
  if (billTo !== 'client' && !clientName) {
    return json(
      { error: 'Enter who this invoice is billed to.' },
      { status: 400 }
    )
  }
  if (billTo !== 'client') {
    clientId = null
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
    return json(
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

  if (error) return json({ error: error.message }, { status: 500 })

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

  return json({ invoice: normalizeInvoice(data, projectName) }, { status: 201 })
}

export const Route = createFileRoute('/api/invoices')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
    },
  },
})
