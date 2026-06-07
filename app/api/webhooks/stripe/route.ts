import { NextRequest } from 'next/server'
import { stripe } from '@/lib/payments/stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (stripe && sig && webhookSecret) {
    try {
      const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
      const sub = event.data.object as any
      const userId = sub.metadata?.user_id

      if (!userId) {
        return new Response('Missing user_id metadata', { status: 200 })
      }

      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createServiceRoleClient()

        if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
          const priceId = sub.items?.data[0]?.price?.id
          const plan = priceId === process.env.STRIPE_PRICE_SOLO ? 'solo' : 'team'
          
          await supabase.from('organisations')
            .update({ plan, seats_max: plan === 'team' ? 5 : 1 })
            .eq('owner_id', userId)
          await supabase.from('users')
            .update({ plan })
            .eq('id', userId)
        } else if (event.type === 'customer.subscription.deleted') {
          await supabase.from('organisations')
            .update({ plan: 'free', seats_max: 1 })
            .eq('owner_id', userId)
          await supabase.from('users')
            .update({ plan: 'free' })
            .eq('id', userId)
        }
      }
    } catch (err) {
      console.error('Stripe webhook error:', err)
      return new Response('Webhook Error', { status: 400 })
    }
  } else {
    console.warn('Stripe Webhook bypass check triggered. Stripe or signing secret missing.')
  }

  return new Response('OK')
}
