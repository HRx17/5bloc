import { stripe } from '@/lib/payments/stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !webhookSecret) {
    console.error('Stripe webhook rejected: Stripe or STRIPE_WEBHOOK_SECRET not configured')
    return new Response('Webhook not configured', { status: 503 })
  }

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  try {
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    const sub = event.data.object as {
      metadata?: { user_id?: string }
      items?: { data?: Array<{ price?: { id?: string } }> }
    }
    const userId = sub.metadata?.user_id

    if (!userId) {
      return new Response('Missing user_id metadata', { status: 200 })
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createServiceRoleClient()

      if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
        const priceId = sub.items?.data?.[0]?.price?.id
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

  return new Response('OK')
}
