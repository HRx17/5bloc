import { createFileRoute } from '@tanstack/react-router'
import crypto from 'crypto'
import { createServiceRoleClient, hasValidServiceRoleKey, isSupabaseConfigured } from '@/lib/supabase/server'
import { analytics, resolveAuthUserId } from '@/lib/analytics/heycatch'

export const dynamic = 'force-dynamic'

const handlePOST = async ({ request }: any) => {
  const body = await request.text()
  const sig = request.headers.get('x-razorpay-signature')
  const secret = process.env['RAZORPAY_WEBHOOK_SECRET']

  if (!secret) {
    console.error('RAZORPAY_WEBHOOK_SECRET missing — rejecting webhook')
    return new Response(JSON.stringify({ error: 'RAZORPAY_WEBHOOK_SECRET is not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!sig) return new Response('Missing signature header', { status: 400 })
  const hmac = crypto.createHmac('sha256', secret).update(body).digest('hex')
  if (hmac !== sig) return new Response('Invalid signature', { status: 401 })

  try {
    const event = JSON.parse(body)
    const sub = event.payload?.subscription?.entity
    const payment = event.payload?.payment?.entity
    const userId = sub?.notes?.user_id
    const invoiceId = payment?.notes?.invoice_id

    if (!userId && !invoiceId) {
      return new Response('No user_id or invoice_id found in metadata notes', { status: 200 })
    }

    if (!isSupabaseConfigured() || !hasValidServiceRoleKey()) {
      return new Response(
        JSON.stringify({ ok: false, skipped: true, reason: 'Service role is not configured — plan not activated' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const supabase: any = createServiceRoleClient()

    if (invoiceId && (event.event === 'payment.captured' || event.event === 'order.paid')) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, status')
        .eq('id', invoiceId)
        .maybeSingle()

      if (invoice && invoice.status !== 'paid') {
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            razorpay_payment_id: payment.id,
          })
          .eq('id', invoiceId)
      }
      return new Response('OK')
    }

    if (!userId) return new Response('OK')

    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const plan =
          sub.plan_id === process.env['RAZORPAY_PLAN_SOLO']
            ? 'solo'
            : sub.plan_id === process.env['RAZORPAY_PLAN_TEAM']
              ? 'team'
              : sub.plan_id === process.env['RAZORPAY_PLAN_AI']
                ? 'ai_addon'
                : 'badge'

        if (plan === 'badge') {
          await supabase.from('contractors').update({ verified: true, badge_active: true }).eq('user_id', userId)
          await supabase.from('contractors').update({ verified: true, badge_active: true }).eq('profile_id', userId)
        } else if (plan === 'ai_addon') {
          await supabase.from('profiles').update({ ai_add_on: true }).eq('id', userId)
        } else {
          await supabase
            .from('organisations')
            .update({ plan, seats_max: plan === 'team' ? 5 : 1 })
            .eq('owner_id', userId)
          await supabase.from('profiles').update({ plan }).eq('id', userId)
        }

        const personId = await resolveAuthUserId(supabase as any, userId)
        await analytics.setIdentity(personId, { plan })
        await analytics.trackEvent(
          event.event === 'subscription.activated' ? 'subscription_started' : 'subscription_renewed',
          { plan },
          { userId: personId },
        )
        break
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        const isBadge = sub.plan_id === process.env['RAZORPAY_PLAN_BADGE']
        if (isBadge) {
          await supabase.from('contractors').update({ verified: false, badge_active: false }).eq('user_id', userId)
          await supabase.from('contractors').update({ verified: false, badge_active: false }).eq('profile_id', userId)
        } else {
          await supabase
            .from('organisations')
            .update({ plan: 'free', seats_max: 1 })
            .eq('owner_id', userId)
          await supabase.from('profiles').update({ plan: 'free' }).eq('id', userId)
        }

        const personId = await resolveAuthUserId(supabase as any, userId)
        await analytics.setIdentity(personId, { plan: 'free' })
        await analytics.trackEvent('subscription_cancelled', { plan: 'free' }, { userId: personId })
        break
      }
    }
  } catch (err) {
    console.error('Razorpay Webhook parsing error:', err)
    return new Response('Webhook parse error', { status: 400 })
  }

  return new Response('OK')
}

export const Route = createFileRoute('/api/public/webhooks/razorpay')({
  server: {
    handlers: {
      POST: handlePOST,
    },
  },
})
