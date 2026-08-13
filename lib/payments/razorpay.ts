import Razorpay from 'razorpay'

const hasRazorpay = !!(
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET
)

export const razorpay = hasRazorpay
  ? new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
  : null

export const PLANS = {
  solo:  process.env.RAZORPAY_PLAN_SOLO || 'plan_solo_mock',   // ₹2,999/mo
  team:  process.env.RAZORPAY_PLAN_TEAM || 'plan_team_mock',   // ₹7,999/mo
  badge: process.env.RAZORPAY_PLAN_BADGE || 'plan_badge_mock',  // ₹999/mo contractor badge
  ai:    process.env.RAZORPAY_PLAN_AI || 'plan_ai_mock',     // ₹1,499/mo add-on
}

export function isRazorpayConfigured(): boolean {
  return !!razorpay
}

export async function createSubscription(planId: string, userId: string) {
  if (!razorpay) {
    console.log('Razorpay is not initialized. Simulating subscription creation.');
    return { id: 'sub_mock_' + Date.now(), short_url: '#' }
  }
  return razorpay.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: 120,
    notes: { user_id: userId },
  })
}

/** One-off order used to collect payment against a client invoice. */
export async function createInvoiceOrder(opts: {
  amountRupees: number
  receipt: string
  notes: Record<string, string>
}) {
  if (!razorpay) return null
  return razorpay.orders.create({
    // Razorpay works in the smallest currency unit
    amount: Math.round(opts.amountRupees * 100),
    currency: 'INR',
    receipt: opts.receipt.slice(0, 40),
    notes: opts.notes,
  })
}

export async function fetchSubscription(subscriptionId: string) {
  if (!razorpay || !subscriptionId || subscriptionId.startsWith('sub_mock_')) return null
  try {
    return await razorpay.subscriptions.fetch(subscriptionId)
  } catch (err) {
    console.error('Razorpay subscription fetch failed:', err)
    return null
  }
}

/** Cancels at the end of the paid period so the customer keeps what they paid for. */
export async function cancelSubscription(subscriptionId: string, atCycleEnd = true) {
  if (!razorpay) return null
  return razorpay.subscriptions.cancel(subscriptionId, atCycleEnd)
}

export async function listSubscriptionInvoices(subscriptionId: string) {
  if (!razorpay || !subscriptionId || subscriptionId.startsWith('sub_mock_')) return []
  try {
    const res: any = await razorpay.invoices.all({ subscription_id: subscriptionId, count: 12 })
    return res?.items || []
  } catch (err) {
    console.error('Razorpay invoice list failed:', err)
    return []
  }
}

// Frontend checkout (use Razorpay JS SDK — NOT a redirect)
export function openCheckout(subscriptionId: string, email: string) {
  const options = {
    key:            process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mock',
    subscription_id: subscriptionId,
    name:           '5Bloc',
    description:    'Architecture platform subscription',
    image:          '/icons/icon-192.png',
    prefill:        { email },
    theme:          { color: '#F5A623' },
    handler: (response: any) => {
      // Webhook handles plan activation — just redirect
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard?subscribed=true'
      }
    },
  }
  
  if (typeof window !== 'undefined' && (window as any).Razorpay) {
    const rzp = new (window as any).Razorpay(options)
    rzp.open()
  } else {
    console.error('Razorpay SDK script not loaded — checkout aborted (no simulated success).')
    throw new Error('Razorpay checkout failed to load. Refresh and try again.')
  }
}
