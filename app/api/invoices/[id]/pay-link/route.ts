import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_INVOICES } from '@/lib/data/mock-store'
import { signInvoicePayToken } from '@/lib/payments/invoice-pay-token'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (shouldServeMockData(auth)) {
    const invoice = MOCK_INVOICES.find((i) => i.id === id)
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } else if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  } else {
    const { data, error } = await auth.supabase
      .from('invoices')
      .select('id')
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  if (!appUrl) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_APP_URL is not set — cannot build a payment link.' },
      { status: 500 }
    )
  }
  const payToken = signInvoicePayToken(id)
  if (!payToken) {
    return NextResponse.json(
      { error: 'Could not sign a payment link. Check PAYMENT_LINK_SECRET or Razorpay/Supabase secrets.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ url: `${appUrl}/pay/${encodeURIComponent(payToken)}` })
}
