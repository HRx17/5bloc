import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.text()
  const sig  = req.headers.get('x-razorpay-signature')

  // Developer bypass check if secret is not set
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (secret) {
    if (!sig) return new Response('Missing signature header', { status: 400 })
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    if (hmac !== sig) return new Response('Invalid signature', { status: 401 })
  } else {
    console.warn('RAZORPAY_WEBHOOK_SECRET is not configured. Bypassing signature validation for testing.')
  }

  try {
    const event  = JSON.parse(body)
    const sub    = event.payload.subscription?.entity
    const userId = sub?.notes?.user_id

    if (!userId) {
      return new Response('No user_id found in metadata notes', { status: 200 })
    }

    // Bypass db sync if Supabase variables are not set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('Supabase env vars missing. Skipping webhook db sync logs.')
      return new Response('OK')
    }

    // Use service role for webhook updates (bypasses RLS safely)
    const supabase = createServiceRoleClient()

    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const plan =
          sub.plan_id === process.env.RAZORPAY_PLAN_SOLO  ? 'solo'
        : sub.plan_id === process.env.RAZORPAY_PLAN_TEAM  ? 'team'
        : sub.plan_id === process.env.RAZORPAY_PLAN_AI    ? 'ai_addon'
        : 'badge'

        if (plan === 'badge') {
          await supabase.from('contractors')
            .update({ verified: true, badge_active: true })
            .eq('user_id', userId)
        } else if (plan === 'ai_addon') {
          await supabase.from('users')
            .update({ ai_add_on: true })
            .eq('id', userId)
        } else {
          await supabase.from('organisations')
            .update({ plan, seats_max: plan === 'team' ? 5 : 1 })
            .eq('owner_id', userId)
          await supabase.from('users')
            .update({ plan })
            .eq('id', userId)
        }
        break
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        const isBadge = sub.plan_id === process.env.RAZORPAY_PLAN_BADGE
        if (isBadge) {
          await supabase.from('contractors')
            .update({ verified: false, badge_active: false })
            .eq('user_id', userId)
        } else {
          await supabase.from('organisations')
            .update({ plan: 'free', seats_max: 1 })
            .eq('owner_id', userId)
          await supabase.from('users')
            .update({ plan: 'free' })
            .eq('id', userId)
        }
        break
      }
    }
  } catch (err) {
    console.error('Razorpay Webhook parsing error:', err)
  }

  return new Response('OK')
}
