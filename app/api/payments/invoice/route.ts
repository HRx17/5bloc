import { NextResponse } from 'next/server'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { hasSupabaseEnv, liveDataUnavailableResponse, shouldServeMockData } from '@/lib/data/mock-guard'
import { createInvoiceOrder, isRazorpayConfigured } from '@/lib/payments/razorpay'

/**
 * Creates a Razorpay order for a client invoice. The invoice is only marked paid
 * by the webhook once Razorpay confirms capture — never from the browser.
 */
export async function POST(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.invoice_id) {
    return NextResponse.json({ error: 'invoice_id required' }, { status: 400 })
  }

  if (shouldServeMockData(auth)) {
    return NextResponse.json({
      mock: true,
      message: 'Demo mode: no real payment was created.',
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const { data: invoice, error } = await auth.supabase
    .from('invoices')
    .select('id, invoice_number, total, status, org_id, project_id')
    .eq('id', body.invoice_id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  if (invoice.status === 'paid') {
    return NextResponse.json({ error: 'This invoice is already paid' }, { status: 409 })
  }
  if (!Number(invoice.total) || Number(invoice.total) <= 0) {
    return NextResponse.json({ error: 'Invoice has no payable amount' }, { status: 400 })
  }

  if (!isRazorpayConfigured()) {
    return NextResponse.json({
      mock: true,
      message:
        'Razorpay keys are not configured. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and NEXT_PUBLIC_RAZORPAY_KEY_ID to collect payments.',
    })
  }

  const order = await createInvoiceOrder({
    amountRupees: Number(invoice.total),
    receipt: invoice.invoice_number || invoice.id,
    notes: {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number || '',
      org_id: invoice.org_id || '',
    },
  })

  if (!order) {
    return NextResponse.json({ error: 'Could not create the payment order' }, { status: 502 })
  }

  // Mark as sent so the invoice reads correctly while payment is pending
  if (invoice.status === 'draft') {
    await auth.supabase.from('invoices').update({ status: 'sent' }).eq('id', invoice.id)
  }

  return NextResponse.json({
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null,
    invoice_number: invoice.invoice_number,
    email: auth.profile.email,
  })
}
