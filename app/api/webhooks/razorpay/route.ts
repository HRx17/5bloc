import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.text()
  const sig  = req.headers.get('x-razorpay-signature')

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (secret) {
    if (!sig) return new Response('Missing signature header', { status: 400 })
    const hmac = crypto.createHmac('sha256', secret).update(body).digest('hex')
    if (hmac !== sig) return new Response('Invalid signature', { status: 401 })
  } else {
    console.warn('RAZORPAY_WEBHOOK_SECRET not configured — bypassing signature check.')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('Supabase service role not configured — skipping webhook db sync.')
    return new Response('OK')
  }

  try {
    const event  = JSON.parse(body)
    const sub    = event.payload?.subscription?.entity
    const userId = sub?.notes?.user_id as string | undefined

    if (!userId) return new Response('No user_id in notes', { status: 200 })

    const supabase = createServiceRoleClient()

    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const plan =
          sub.plan_id === process.env.RAZORPAY_PLAN_AI ? 'ai_addon'
          : sub.plan_id === process.env.RAZORPAY_PLAN_TEAM ? 'team'
          : sub.plan_id === process.env.RAZORPAY_PLAN_SOLO ? 'solo'
          : null

        if (!plan) break

        if (plan === 'ai_addon') {
          await supabase.from('profiles').update({ ai_add_on: true }).eq('auth_id', userId)
        } else {
          await supabase
            .from('organisations')
            .update({ plan })
            .in('id', supabase.from('profiles').select('org_id').eq('auth_id', userId) as any)
          await supabase.from('profiles').update({ plan }).eq('auth_id', userId)
        }
        break
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        await supabase
          .from('organisations')
          .update({ plan: 'free' })
          .in('id', supabase.from('profiles').select('org_id').eq('auth_id', userId) as any)
        await supabase.from('profiles').update({ plan: 'free', ai_add_on: false }).eq('auth_id', userId)
        break
      }
    }
  } catch (err) {
    console.error('Razorpay webhook error:', err)
  }

  return new Response('OK')
}
