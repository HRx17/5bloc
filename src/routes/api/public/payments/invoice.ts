import { createFileRoute } from '@tanstack/react-router'
import { json } from '@/lib/api/get-user.server'
import { createServiceRoleClient, hasValidServiceRoleKey } from '@/lib/supabase/server'
import { createInvoiceOrder, isRazorpayConfigured } from '@/lib/payments/razorpay'
import { verifyInvoicePayToken } from '@/lib/payments/invoice-pay-token'

/**
 * Public invoice pay endpoints — authenticated by a signed pay token, not a session.
 * GET  ?token=… → invoice summary for the pay page
 * POST { token } → payment order for that invoice
 */
type InvoiceRow = {
  id: string
  invoice_number: string | null
  client_name: string | null
  project_name: string | null
  total: number | null
  status: string | null
  due_date: string | null
  org_id: string | null
  project_id: string | null
}

async function loadInvoice(
  invoiceId: string
): Promise<{ invoice?: InvoiceRow; error?: string; status?: number }> {
  if (!hasValidServiceRoleKey()) return { error: 'Live database required', status: 503 }
  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('invoices')
    .select(
      'id, invoice_number, client_name, project_name, total, status, due_date, org_id, project_id'
    )
    .eq('id', invoiceId)
    .maybeSingle()
  if (error) return { error: error.message, status: 500 }
  if (!data) return { error: 'Invoice not found', status: 404 }
  return { invoice: data as InvoiceRow }
}


const handleGET = async ({ request }: any) => {
  const token = new URL(request.url).searchParams.get('token') || ''
  const invoiceId = verifyInvoicePayToken(token)
  if (!invoiceId) {
    return json({ error: 'This payment link is invalid or has expired.' }, { status: 404 })
  }

  const loaded = await loadInvoice(invoiceId)
  if (!loaded.invoice) return json({ error: loaded.error }, { status: loaded.status ?? 500 })
  const invoice = loaded.invoice

  return json({
    invoice: {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      client_name: invoice.client_name,
      project_name: invoice.project_name,
      total: Number(invoice.total || 0),
      status: invoice.status,
      due_date: invoice.due_date,
    },
    payable: invoice.status !== 'paid' && Number(invoice.total) > 0,
  })
}

const handlePOST = async ({ request }: any) => {
  const body = await request.json().catch(() => ({}))
  const invoiceId = verifyInvoicePayToken(String(body.token || ''))
  if (!invoiceId) {
    return json({ error: 'This payment link is invalid or has expired.' }, { status: 404 })
  }

  const loaded = await loadInvoice(invoiceId)
  if (!loaded.invoice) return json({ error: loaded.error }, { status: loaded.status ?? 500 })
  const invoice = loaded.invoice

  if (invoice.status === 'paid') {
    return json({ error: 'This invoice is already paid.' }, { status: 409 })
  }
  if (!Number(invoice.total) || Number(invoice.total) <= 0) {
    return json({ error: 'This invoice has no payable amount.' }, { status: 400 })
  }
  if (!isRazorpayConfigured()) {
    return json({
      mock: true,
      message:
        'Online payment is not configured yet. Please contact your architect to arrange payment.',
    })
  }

  const order = await createInvoiceOrder({
    amountRupees: Number(invoice.total),
    receipt: invoice.invoice_number || invoice.id,
    notes: {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number || '',
      org_id: invoice.org_id || '',
      source: 'public_pay_link',
    },
  })
  if (!order) {
    return json({ error: 'Could not start the payment. Please try again.' }, { status: 502 })
  }

  if (invoice.status === 'draft' && hasValidServiceRoleKey()) {
    const db = createServiceRoleClient()
    await db.from('invoices').update({ status: 'sent' }).eq('id', invoice.id)
  }

  return json({
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    key_id: process.env['RAZORPAY_KEY_ID'] || null,
    invoice_number: invoice.invoice_number,
  })
}

export const Route = createFileRoute('/api/public/payments/invoice')({
  server: { handlers: { GET: handleGET, POST: handlePOST } },
})
