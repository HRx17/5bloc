import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { cancelSubscription, fetchSubscription, listSubscriptionInvoices } from '@/lib/payments/razorpay'

const money = (paise?: number | null) =>
  typeof paise === 'number' ? Math.round(paise / 100) : null

/** Where the active subscription id lives for this user's role. */
async function subscriptionRefFor(auth: any): Promise<{ id: string | null; scope: 'org' | 'contractor' | null }> {
  if (auth.profile.role === 'contractor') {
    const { data } = await auth.supabase
      .from('contractors')
      .select('razorpay_subscription_id')
      .eq('user_id', auth.profile.id)
      .maybeSingle()
    return { id: data?.razorpay_subscription_id || null, scope: 'contractor' }
  }
  if (auth.orgId) {
    const { data } = await auth.supabase
      .from('organisations')
      .select('razorpay_subscription_id')
      .eq('id', auth.orgId)
      .maybeSingle()
    return { id: data?.razorpay_subscription_id || null, scope: 'org' }
  }
  return { id: null, scope: null }
}

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })


  const ref = await subscriptionRefFor(auth)
  if (!ref.id) return json({ subscription: null, history: [] })

  const [sub, invoices] = await Promise.all([
    fetchSubscription(ref.id),
    listSubscriptionInvoices(ref.id),
  ])

  return json({
    subscription: sub
      ? {
          id: sub.id,
          status: sub.status,
          current_end: sub.current_end ? new Date(Number(sub.current_end) * 1000).toISOString() : null,
          ended_at: sub.ended_at ? new Date(Number(sub.ended_at) * 1000).toISOString() : null,
          cancelled_at_cycle_end: !!(sub as any).cancel_at_cycle_end,
        }
      : null,
    history: (invoices || []).map((inv: any) => ({
      id: inv.id,
      amount: money(inv.amount),
      status: inv.status,
      paid_at: inv.paid_at ? new Date(Number(inv.paid_at) * 1000).toISOString() : null,
      receipt_url: inv.short_url || null,
    })),
  })
}

const handleDELETE = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })


  const ref = await subscriptionRefFor(auth)
  if (!ref.id) return json({ error: 'No active subscription' }, { status: 404 })

  try {
    // At cycle end, so the customer keeps the period they already paid for
    await cancelSubscription(ref.id, true)
  } catch (err: any) {
    return json(
      { error: err?.error?.description || 'Could not cancel the subscription' },
      { status: 502 }
    )
  }

  return json({
    ok: true,
    message: 'Subscription will end when the current billing period closes.',
  })
}

export const Route = createFileRoute('/api/payments/subscription')({
  server: {
    handlers: {
        GET: handleGET,
        DELETE: handleDELETE,
    },
  },
})
