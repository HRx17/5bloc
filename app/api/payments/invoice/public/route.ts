import { NextResponse } from 'next/server'
import { createServiceRoleClient, hasValidServiceRoleKey } from '@/lib/supabase/server'
import { createInvoiceOrder, isRazorpayConfigured } from '@/lib/payments/razorpay'
import { verifyInvoicePayToken } from '@/lib/payments/invoice-pay-token'

/**
 * Public invoice pay endpoints — authenticated by a signed pay token, not a session.
 * GET  ?token=… → invoice summary for the pay page
 * POST { token } → Razorpay order for that invoice
 */

async function loadInvoice(invoiceId: string) {
  if (!hasValidServiceRoleKey()) return { error: 'Live database required', status: 503 as const }
  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('invoices')
    .select('id, invoice_number, client_name, project_name, total, status, due_date, org_id, project_id')
    .eq('id', invoiceId)
    .maybeSingle()
  if (error) return { error: error.message, status: 500 as const }
  if (!data) return { error: 'Invoice not found', status: 404 as const }
  return { invoice: data }
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') || ''
  const invoiceId = verifyInvoicePayToken(token)
  if (!invoiceId) {
    return NextResponse.json({ error: 'This payment link is invalid or has expired.' }, { status: 404 })
  }

  const loaded = await loadInvoice(invoiceId)
  if ('error' in loaded && !('invoice' in loaded)) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status })
  }
  const invoice = loaded.invoice!

  return NextResponse.json({
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

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const invoiceId = verifyInvoicePayToken(String(body.token || ''))
  if (!invoiceId) {
    return NextResponse.json({ error: 'This payment link is invalid or has expired.' }, { status: 404 })
  }

  const loaded = await loadInvoice(invoiceId)
  if ('error' in loaded && !('invoice' in loaded)) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status })
  }
  const invoice = loaded.invoice!

  if (invoice.status === 'paid') {
    return NextResponse.json({ error: 'This invoice is already paid.' }, { status: 409 })
  }
  if (!Number(invoice.total) || Number(invoice.total) <= 0) {
    return NextResponse.json({ error: 'This invoice has no payable amount.' }, { status: 400 })
  }
  if (!isRazorpayConfigured()) {
    return NextResponse.json({
      mock: true,
      message: 'Online payment is not configured yet. Please contact your architect to arrange payment.',
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
    return NextResponse.json({ error: 'Could not start the payment. Please try again.' }, { status: 502 })
  }

  if (invoice.status === 'draft' && hasValidServiceRoleKey()) {
    const db = createServiceRoleClient()
    await db.from('invoices').update({ status: 'sent' }).eq('id', invoice.id)
  }

  return NextResponse.json({
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null,
    invoice_number: invoice.invoice_number,
  })
}
