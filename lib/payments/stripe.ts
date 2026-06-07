import Stripe from 'stripe'

const hasStripe = !!process.env.STRIPE_SECRET_KEY

export const stripe = hasStripe
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-06-20' as any,
    })
  : null

export const STRIPE_PRICES = {
  solo: process.env.STRIPE_PRICE_SOLO || 'price_solo_mock',   // $49/mo
  team: process.env.STRIPE_PRICE_TEAM || 'price_team_mock',   // $129/mo
}
