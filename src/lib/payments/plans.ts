import type { RoleKey } from '@/lib/rbac/roles'

export type CheckoutPlan = 'solo' | 'team' | 'ai' | 'badge'

export type PlanCard = {
  key: string
  name: string
  price: string
  term: string
  checkout?: CheckoutPlan
}

export type RoleBilling = {
  /** Whether this role has any subscription surface at all */
  showsPlans: boolean
  heading: string
  blurb: string
  plans: PlanCard[]
  addOns: PlanCard[]
}

const ARCHITECT_PLANS: PlanCard[] = [
  { key: 'free', name: 'Free', price: '₹0', term: '3 projects, 5 users' },
  {
    key: 'solo',
    name: 'Solo Architect',
    price: '₹2,999',
    term: '/ month · Unlimited projects, AI, invoicing',
    checkout: 'solo',
  },
  {
    key: 'team',
    name: 'Team Architect',
    price: '₹7,999',
    term: '/ month · Solo + 5 users + analytics',
    checkout: 'team',
  },
]

const ARCHITECT_ADDONS: PlanCard[] = [
  {
    key: 'ai',
    name: 'AI Assistant Add-On',
    price: '₹1,499',
    term: '/ month · Unlimited quantity estimator & RERA helper',
    checkout: 'ai',
  },
]

const CONTRACTOR_PLANS: PlanCard[] = [
  { key: 'free', name: 'Marketplace listing', price: '₹0', term: 'Browse open projects and submit bids' },
  {
    key: 'badge',
    name: 'Verified Vendor Badge',
    price: '₹999',
    term: '/ month · Verified badge, higher ranking in the directory',
    checkout: 'badge',
  },
]

/** Billing surface per role. Clients never get a billing surface at all. */
export function billingForRole(role: RoleKey): RoleBilling {
  switch (role) {
    case 'architect':
      return {
        showsPlans: true,
        heading: 'Firm plan',
        blurb: 'Your firm subscription covers every project and co-worker in this workspace.',
        plans: ARCHITECT_PLANS,
        addOns: ARCHITECT_ADDONS,
      }
    case 'contractor':
      return {
        showsPlans: true,
        heading: 'Vendor plan',
        blurb: 'Bidding is free. Upgrade only if you want the verified badge on your marketplace profile.',
        plans: CONTRACTOR_PLANS,
        addOns: [],
      }
    case 'builder':
      return {
        showsPlans: false,
        heading: 'Builder access',
        blurb:
          'Builder access is included through the architect who invited you — there is no builder subscription. Payment methods below are used for project invoices.',
        plans: [],
        addOns: [],
      }
    case 'consultant':
      return {
        showsPlans: false,
        heading: 'Consultant access',
        blurb:
          'Consultant access is included through the architect who invited you — there is no consultant subscription. Payment methods below are used for consultant payouts and invoices.',
        plans: [],
        addOns: [],
      }
    default:
      return { showsPlans: false, heading: '', blurb: '', plans: [], addOns: [] }
  }
}

export const BILLING_ROLES: RoleKey[] = ['architect', 'contractor', 'builder', 'consultant']
