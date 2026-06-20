import { canAccessNav, type UserRole } from '@/lib/roles'

/** First path segment after (app) groups — used for coarse route enforcement. */
export function canAccessRoute(role: string | undefined | null, pathname: string): boolean {
  if (!pathname || pathname === '/dashboard') return canAccessNav(role, '/dashboard')

  const segments = pathname.split('/').filter(Boolean)
  const base = segments[0] ? `/${segments[0]}` : '/dashboard'

  if (base === '/projects' && segments.length >= 2) {
    return canAccessNav(role, '/projects')
  }

  if (base === '/ai') return canAccessNav(role, '/ai/estimate')
  if (base === '/settings') return canAccessNav(role, '/settings')

  return canAccessNav(role, base)
}

export function defaultRouteForRole(role: string | undefined | null): string {
  return '/dashboard'
}

export function roleDisplayName(role: string | undefined | null): string {
  const r = role as UserRole
  if (r === 'interior_designer') return 'Interior Designer'
  return role ?? 'User'
}
