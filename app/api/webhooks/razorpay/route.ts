import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('x-razorpay-signature')
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET

  // Fail closed always when secret missing (required in production; no unsigned bypass anywhere)
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('RAZORPAY_WEBHOOK_SECRET missing in production')
    } else {
      console.warn('RAZORPAY_WEBHOOK_SECRET is not configured — rejecting webhook')
    }
    return new Response(
      JSON.stringify({ error: 'RAZORPAY_WEBHOOK_SECRET is not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!sig) return new Response('Missing signature header', { status: 400 })
  const hmac = crypto.createHmac('sha256', secret).update(body).digest('hex')
  if (hmac !== sig) return new Response('Invalid signature', { status: 401 })

  try {
    const event = JSON.parse(body)
    const sub = event.payload.subscription?.entity
    const userId = sub?.notes?.user_id

    if (!userId) {
      return new Response('No user_id found in metadata notes', { status: 200 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({
          ok: false,
          skipped: true,
          reason: 'SUPABASE_SERVICE_ROLE_KEY not configured — plan not activated',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createServiceRoleClient()

    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const plan =
          sub.plan_id === process.env.RAZORPAY_PLAN_SOLO
            ? 'solo'
            : sub.plan_id === process.env.RAZORPAY_PLAN_TEAM
              ? 'team'
              : sub.plan_id === process.env.RAZORPAY_PLAN_AI
                ? 'ai_addon'
                : 'badge'

        if (plan === 'badge') {
          await supabase
            .from('contractors')
            .update({ verified: true, badge_active: true })
            .eq('user_id', userId)
          await supabase
            .from('contractors')
            .update({ verified: true, badge_active: true })
            .eq('profile_id', userId)
        } else if (plan === 'ai_addon') {
          await supabase.from('profiles').update({ ai_add_on: true }).eq('id', userId)
        } else {
          await supabase
            .from('organisations')
            .update({ plan, seats_max: plan === 'team' ? 5 : 1 })
            .eq('owner_id', userId)
          await supabase.from('profiles').update({ plan }).eq('id', userId)
        }
        break
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        const isBadge = sub.plan_id === process.env.RAZORPAY_PLAN_BADGE
        if (isBadge) {
          await supabase
            .from('contractors')
            .update({ verified: false, badge_active: false })
            .eq('user_id', userId)
          await supabase
            .from('contractors')
            .update({ verified: false, badge_active: false })
            .eq('profile_id', userId)
        } else {
          await supabase
            .from('organisations')
            .update({ plan: 'free', seats_max: 1 })
            .eq('owner_id', userId)
          await supabase.from('profiles').update({ plan: 'free' }).eq('id', userId)
        }
        break
      }
    }
  } catch (err) {
    console.error('Razorpay Webhook parsing error:', err)
    return new Response('Webhook parse error', { status: 400 })
  }

  return new Response('OK')
}
