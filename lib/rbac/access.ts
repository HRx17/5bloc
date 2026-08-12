import type { RoleKey } from './roles'

/**
 * Routes that carry a genuine privacy or entitlement boundary.
 *
 * This is deny-by-exception, NOT an allowlist: a path with no entry here is
 * reachable by every signed-in role, and the page or its API is responsible for
 * scoping what it shows. Only add a prefix when a role would otherwise see
 * another tenant's records or a surface they cannot legitimately act on —
 * everything else stays reachable so real screens are not silently removed.
 *
 * Longest matching prefix wins, so `/projects/new` can be stricter than `/projects`.
 */
const RESTRICTED_ROUTES: Array<{ prefix: string; roles: RoleKey[] }> = [
  // Firm-private: other clients' CRM records, firm revenue, firm invoicing
  { prefix: '/dashboard', roles: ['architect'] },
  { prefix: '/clients', roles: ['architect'] },
  { prefix: '/invoices', roles: ['architect'] },

  // Only architects own projects, so only they can open one
  { prefix: '/projects/new', roles: ['architect'] },

  // Paid architect capability — matches `can('ai.use')`
  { prefix: '/ai', roles: ['architect'] },

  // Personal role home dashboards, keyed to the signed-in user
  { prefix: '/contractor', roles: ['contractor'] },
  { prefix: '/builder', roles: ['builder'] },
  { prefix: '/consultant', roles: ['consultant'] },
  { prefix: '/client', roles: ['client'] },
]

export function allowedRolesForPath(pathname: string): RoleKey[] | null {
  let match: { prefix: string; roles: RoleKey[] } | null = null
  for (const rule of RESTRICTED_ROUTES) {
    const hit = pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
    if (!hit) continue
    if (!match || rule.prefix.length > match.prefix.length) match = rule
  }
  return match ? match.roles : null
}

export function canRoleAccessPath(role: RoleKey, pathname: string): boolean {
  const allowed = allowedRolesForPath(pathname)
  return !allowed || allowed.includes(role)
}
