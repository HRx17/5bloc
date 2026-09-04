/**
 * Razorpay helpers over the REST API (no npm SDK — the server runtime bundles
 * everything at build time and the SDK is Node-only).
 * Without keys every call reports "not configured" so the UI can fall back to
 * offline payment instructions.
 */

const API = 'https://api.razorpay.com/v1'

function keys() {
  const id = process.env['RAZORPAY_KEY_ID']?.trim()
  const secret = process.env['RAZORPAY_KEY_SECRET']?.trim()
  if (!id || !secret) return null
  return { id, secret }
}

export function isRazorpayConfigured(): boolean {
  return !!keys()
}

export const PLANS = {
  solo: process.env['RAZORPAY_PLAN_SOLO'] || 'plan_solo_mock',
  team: process.env['RAZORPAY_PLAN_TEAM'] || 'plan_team_mock',
  badge: process.env['RAZORPAY_PLAN_BADGE'] || 'plan_badge_mock',
  ai: process.env['RAZORPAY_PLAN_AI'] || 'plan_ai_mock',
}

async function call<T>(path: string, init?: RequestInit): Promise<T | null> {
  const k = keys()
  if (!k) return null
  const auth = Buffer.from(`${k.id}:${k.secret}`).toString('base64')
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) return null
  return (await res.json()) as T
}

export type RazorpayOrder = { id: string; amount: number; currency: string }

/** One-off order used to collect payment against a client invoice. */
export async function createInvoiceOrder(opts: {
  amountRupees: number
  receipt: string
  notes: Record<string, string>
}): Promise<RazorpayOrder | null> {
  return call<RazorpayOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: Math.round(opts.amountRupees * 100),
      currency: 'INR',
      receipt: opts.receipt.slice(0, 40),
      notes: opts.notes,
    }),
  })
}

export async function createSubscription(planId: string, userId: string) {
  const created = await call<{ id: string; short_url?: string }>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: planId,
      customer_notify: 1,
      total_count: 120,
      notes: { user_id: userId },
    }),
  })
  return created ?? { id: 'sub_mock_' + Date.now(), short_url: '#' }
}

export async function fetchSubscription(subscriptionId: string) {
  if (!subscriptionId || subscriptionId.startsWith('sub_mock_')) return null
  return call<any>(`/subscriptions/${subscriptionId}`)
}

export async function cancelSubscription(subscriptionId: string, atCycleEnd = true) {
  if (!subscriptionId || subscriptionId.startsWith('sub_mock_')) return null
  return call<any>(`/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancel_at_cycle_end: atCycleEnd ? 1 : 0 }),
  })
}

/** Recent invoices raised against a subscription (billing history). */
export async function listSubscriptionInvoices(subscriptionId: string) {
  if (!subscriptionId || subscriptionId.startsWith('sub_mock_')) return []
  const res = await call<{ items?: any[] }>(
    `/invoices?subscription_id=${encodeURIComponent(subscriptionId)}&count=12`,
  )
  return res?.items ?? []
}
