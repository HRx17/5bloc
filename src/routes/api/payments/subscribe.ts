import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { createSubscription, PLANS } from '@/lib/payments/razorpay'
import { hasSupabaseEnv } from '@/lib/rbac/mock'

const PLAN_KEYS = ['solo', 'team', 'badge', 'ai'] as const
type PlanKey = (typeof PLAN_KEYS)[number]

const handlePOST = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const plan = body.plan as PlanKey
  if (!PLAN_KEYS.includes(plan)) {
    return json({ error: 'Invalid plan. Use solo|team|badge|ai' }, { status: 400 })
  }

  if (plan === 'badge' && auth.profile.role !== 'contractor') {
    return json({ error: 'Badge plan is for contractors' }, { status: 403 })
  }
  if ((plan === 'solo' || plan === 'team') && auth.profile.role !== 'architect') {
    return json({ error: 'Firm plans are for architects' }, { status: 403 })
  }
  if (plan === 'ai' && auth.profile.role !== 'architect') {
    return json({ error: 'The AI add-on is part of a firm plan' }, { status: 403 })
  }

  const planId = PLANS[plan]
  const subscription = await createSubscription(planId, auth.profile.id)

  const persistable =
    hasSupabaseEnv() && !auth.isMock && subscription?.id && !String(subscription.id).startsWith('sub_mock_')

  if (persistable && plan === 'badge') {
    await auth.supabase
      .from('contractors')
      .update({ razorpay_subscription_id: subscription.id })
      .eq('user_id', auth.profile.id)
  }

  // Firm plans hang off the organisation so any co-worker sees the same subscription
  if (persistable && (plan === 'solo' || plan === 'team') && auth.orgId) {
    await auth.supabase
      .from('organisations')
      .update({ razorpay_subscription_id: subscription.id })
      .eq('id', auth.orgId)
  }

  return json({
    subscription_id: subscription.id,
    short_url: (subscription as any).short_url || null,
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null,
    plan,
    mock: String(subscription.id).startsWith('sub_mock_'),
    email: auth.profile.email,
  })
}

export const Route = createFileRoute('/api/payments/subscribe')({
  server: {
    handlers: {
        POST: handlePOST,
    },
  },
})
