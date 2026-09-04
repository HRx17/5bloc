import Stripe from 'stripe'

export function getStripe(): Stripe | null {
  const key = process.env['STRIPE_SECRET_KEY']
  if (!key) return null
  return new Stripe(key, { apiVersion: '2024-06-20' as any })
}

export function stripePrices() {
  return {
    solo: process.env['STRIPE_PRICE_SOLO'] || 'price_solo_mock', // $49/mo
    team: process.env['STRIPE_PRICE_TEAM'] || 'price_team_mock', // $129/mo
  }
}
