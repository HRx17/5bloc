export type Plan = 'free' | 'solo' | 'team'

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
  if (hasAIAddon && (feature.startsWith('ai_') || feature === 'rera')) return true
  return PLAN_FEATURES[plan]?.includes(feature) ?? false
}
