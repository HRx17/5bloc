import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { signInvoicePayToken } from '@/lib/payments/invoice-pay-token'


const handleGET = async ({ request, params }: any) => {
  const { id } = params as { id: string }
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }
  {
    const { data, error } = await auth.supabase
      .from('invoices')
      .select('id')
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .maybeSingle()
    if (error) return json({ error: error.message }, { status: 500 })
    if (!data) return json({ error: 'Not found' }, { status: 404 })
  }

  const appUrl = new URL(request.url).origin
  if (!appUrl) {
    return json(
      { error: 'NEXT_PUBLIC_APP_URL is not set — cannot build a payment link.' },
      { status: 500 }
    )
  }
  const payToken = signInvoicePayToken(id)
  if (!payToken) {
    return json(
      { error: 'Could not sign a payment link. Check PAYMENT_LINK_SECRET or Razorpay/Supabase secrets.' },
      { status: 500 }
    )
  }

  return json({ url: `${appUrl}/pay/${encodeURIComponent(payToken)}` })
}

export const Route = createFileRoute('/api/invoices/$id/pay-link')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})
