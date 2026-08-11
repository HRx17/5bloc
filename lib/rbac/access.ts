import type { RoleKey } from './roles'

/**
 * Route-level role access. A path with no entry is open to every signed-in role.
 * Longest matching prefix wins, so `/projects/new` can be stricter than `/projects`.
 */
const ROUTE_ROLES: Array<{ prefix: string; roles: RoleKey[] }> = [
  // Architect firm operations
  { prefix: '/dashboard', roles: ['architect'] },
  { prefix: '/clients', roles: ['architect'] },
  { prefix: '/invoices', roles: ['architect'] },
  { prefix: '/ai', roles: ['architect'] },
  { prefix: '/integrations', roles: ['architect'] },
  { prefix: '/coordination', roles: ['architect'] },
  { prefix: '/documents', roles: ['architect'] },
  { prefix: '/projects/new', roles: ['architect'] },

  // Shared tools
  { prefix: '/cad', roles: ['architect', 'consultant'] },
  { prefix: '/catalog', roles: ['architect', 'contractor'] },
  { prefix: '/messages', roles: ['architect', 'contractor', 'consultant'] },
  { prefix: '/marketplace', roles: ['architect', 'contractor', 'builder'] },

  // Role workspaces
  { prefix: '/contractor', roles: ['contractor'] },
  { prefix: '/builder', roles: ['builder'] },
  { prefix: '/consultant', roles: ['consultant'] },
]

export function allowedRolesForPath(pathname: string): RoleKey[] | null {
  let match: { prefix: string; roles: RoleKey[] } | null = null
  for (const rule of ROUTE_ROLES) {
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
