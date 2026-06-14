import { NextRequest } from 'next/server'
import { stripe } from '@/lib/payments/stripe'
import { createServiceRoleClient } from '@/lib/supabase/admin'

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

          await (supabase as any).from('organisations')
            .update({ plan })
            .eq('owner_id', userId)
          await supabase.from('profiles').update({ plan }).eq('auth_id', userId)
        } else if (event.type === 'customer.subscription.deleted') {
          await (supabase as any).from('organisations')
            .update({ plan: 'free' })
            .eq('owner_id', userId)
          await supabase.from('profiles').update({ plan: 'free' }).eq('auth_id', userId)
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
