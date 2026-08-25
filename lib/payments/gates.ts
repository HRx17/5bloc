export type Plan = 'free' | 'solo' | 'team'

/**
 * Test release: paid features stay unlocked until production.
 * Set PAYWALL_ENFORCED=1 and NEXT_PUBLIC_PAYWALL_ENFORCED=1 to turn billing back on.
 */
export function isPaywallEnforced(): boolean {
  const v = process.env.NEXT_PUBLIC_PAYWALL_ENFORCED ?? process.env.PAYWALL_ENFORCED
  return v === '1' || v === 'true'
}

export function isTestPeriod(): boolean {
  return !isPaywallEnforced()
}

export const PLAN_FEATURES: Record<Plan, string[]> = {
  free: [
    'projects:3', 'documents', 'rfis', 'team:5',
    'client_portal', 'invoices:5',
  ],
  solo: [
    'projects:unlimited', 'documents', 'rfis', 'submittals',
    'team:unlimited', 'client_portal', 'invoices:unlimited',
    'ai_estimator', 'marketplace', 'tenders', 'site_visits',
  ],
  team: [
    'projects:unlimited', 'documents', 'rfis', 'submittals',
    'team:5_users', 'client_portal', 'invoices:unlimited',
    'ai_estimator', 'marketplace', 'tenders', 'site_visits',
    'analytics', 'custom_roles', 'api_access',
  ],
}

export function canUse(plan: Plan, feature: string, hasAIAddon = false): boolean {
  if (!isPaywallEnforced()) return true
  if (hasAIAddon && (feature.startsWith('ai_') || feature === 'rera')) return true
  return PLAN_FEATURES[plan]?.includes(feature) ?? false
}
