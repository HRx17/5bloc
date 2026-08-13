import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_INVOICES, MOCK_CLIENTS } from '@/lib/data/mock-store'
import { send } from '@/lib/email/resend'
import { InvoiceEmail } from '@/lib/email/templates'
import { signInvoicePayToken } from '@/lib/payments/invoice-pay-token'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let invoice: any = null
  let clientEmail: string | null = null

  if (shouldServeMockData(auth)) {
    invoice = MOCK_INVOICES.find((i) => i.id === id)
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const client = MOCK_CLIENTS.find((c) => c.id === invoice.client_id)
    clientEmail = client?.email || null
  } else if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  } else {
    const { data, error } = await auth.supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    invoice = data

    if (invoice.client_id) {
      const { data: client } = await auth.supabase
        .from('clients')
        .select('email')
        .eq('id', invoice.client_id)
        .maybeSingle()
      clientEmail = client?.email || null
    }
  }

  if (!clientEmail) {
    return NextResponse.json(
      { error: 'No client email on file for this invoice' },
      { status: 400 }
    )
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  if (!appUrl) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_APP_URL is not set — cannot build a payment link for the email.' },
      { status: 500 }
    )
  }
  const payToken = signInvoicePayToken(invoice.id)
  if (!payToken) {
    return NextResponse.json(
      { error: 'Could not sign a payment link. Check PAYMENT_LINK_SECRET or Razorpay/Supabase secrets.' },
      { status: 500 }
    )
  }
  const paymentUrl = `${appUrl}/pay/${encodeURIComponent(payToken)}`
  const total = Number(invoice.total ?? invoice.amount ?? 0)
  const html = InvoiceEmail(
    invoice.invoice_number,
    invoice.client_name || 'Client',
    total,
    invoice.due_date || '—',
    paymentUrl
  )

  const result = await send(
    clientEmail,
    `Invoice ${invoice.invoice_number} from 5Bloc`,
    html
  )

  if (result.error && !result.mock) {
    return NextResponse.json(
      { error: 'Failed to send invoice email', detail: result.error },
      { status: 502 }
    )
  }

  // Optionally mark as sent when still draft
  if (invoice.status === 'draft' || !invoice.status) {
    if (shouldServeMockData(auth)) {
      invoice.status = 'sent'
    } else if (!hasSupabaseEnv() || !auth.supabase) {
      return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
    } else {
      await auth.supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', id)
        .eq('org_id', auth.orgId)
    }
  }

  return NextResponse.json({
    ok: true,
    emailed_to: clientEmail,
    payment_url: paymentUrl,
    mock: !!result.mock,
    email_warning: result.mock
      ? `Email not actually delivered — no mail provider is configured. It would have gone to ${clientEmail}.`
      : undefined,
    status: 'sent',
  })
}
