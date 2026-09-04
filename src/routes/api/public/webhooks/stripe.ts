import { createFileRoute } from '@tanstack/react-router'
import { getStripe } from '@/lib/payments/stripe'
import { createServiceRoleClient, hasValidServiceRoleKey, isSupabaseConfigured } from '@/lib/supabase/server'
import { analytics, resolveAuthUserId } from '@/lib/analytics/heycatch'

export const dynamic = 'force-dynamic'

const handlePOST = async ({ request }: any) => {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET']
  const stripe = getStripe()

  if (!stripe || !webhookSecret) {
    return new Response(JSON.stringify({ error: 'Stripe webhook is not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!sig) return new Response('Missing stripe-signature', { status: 400 })

  try {
    const event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret)
    const sub = event.data.object as any
    const userId = sub.metadata?.user_id
    if (!userId) return new Response('Missing user_id metadata', { status: 200 })

    if (!isSupabaseConfigured() || !hasValidServiceRoleKey()) {
      return new Response(
        JSON.stringify({ ok: false, skipped: true, reason: 'Service role is not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createServiceRoleClient()

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const priceId = sub.items?.data?.[0]?.price?.id
      const plan = priceId === process.env['STRIPE_PRICE_SOLO'] ? 'solo' : 'team'

      await supabase
        .from('organisations')
        .update({ plan, seats_max: plan === 'team' ? 5 : 1 })
        .eq('owner_id', userId)
      await supabase.from('profiles').update({ plan }).eq('id', userId)

      const personId = await resolveAuthUserId(supabase as any, userId)
      await analytics.setIdentity(personId, { plan })
      await analytics.trackEvent(
        event.type === 'customer.subscription.created' ? 'subscription_started' : 'subscription_updated',
        { plan },
        { userId: personId },
      )
    } else if (event.type === 'customer.subscription.deleted') {
      await supabase
        .from('organisations')
        .update({ plan: 'free', seats_max: 1 })
        .eq('owner_id', userId)
      await supabase.from('profiles').update({ plan: 'free' }).eq('id', userId)

      const personId = await resolveAuthUserId(supabase as any, userId)
      await analytics.setIdentity(personId, { plan: 'free' })
      await analytics.trackEvent('subscription_cancelled', { plan: 'free' }, { userId: personId })
    }
  } catch (err) {
    console.error('Stripe webhook error:', err)
    return new Response('Webhook Error', { status: 400 })
  }

  return new Response('OK')
}

export const Route = createFileRoute('/api/public/webhooks/stripe')({
  server: {
    handlers: {
      POST: handlePOST,
    },
  },
})
