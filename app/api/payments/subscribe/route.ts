import { NextResponse } from 'next/server'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { createSubscription, PLANS } from '@/lib/payments/razorpay'
import { hasSupabaseEnv } from '@/lib/rbac/mock'

const PLAN_KEYS = ['solo', 'team', 'badge', 'ai'] as const
type PlanKey = (typeof PLAN_KEYS)[number]

export async function POST(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const plan = body.plan as PlanKey
  if (!PLAN_KEYS.includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan. Use solo|team|badge|ai' }, { status: 400 })
  }

  if (plan === 'badge' && auth.profile.role !== 'contractor') {
    return NextResponse.json({ error: 'Badge plan is for contractors' }, { status: 403 })
  }
  if ((plan === 'solo' || plan === 'team') && auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Firm plans are for architects' }, { status: 403 })
  }
  if (plan === 'ai' && auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'The AI add-on is part of a firm plan' }, { status: 403 })
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

  return NextResponse.json({
    subscription_id: subscription.id,
    short_url: (subscription as any).short_url || null,
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null,
    plan,
    mock: String(subscription.id).startsWith('sub_mock_'),
    email: auth.profile.email,
  })
}
