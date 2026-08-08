import type { UserRole } from '@/lib/roles'
import { USER_ROLES } from '@/lib/roles'

export const DEMO_COOKIE = '5bloc_demo_role'
export const DEMO_STORAGE_KEY = '5bloc_demo_role'

const ROLE_ALIASES: Record<string, UserRole> = {
  architect: 'architect',
  architecture: 'architect',
  client: 'client',
  homeowner: 'client',
  owner: 'client',
  contractor: 'contractor',
  builder: 'contractor',
  vendor: 'vendor',
  supplier: 'vendor',
  consultant: 'consultant',
  engineer: 'consultant',
}

export const DEMO_ROLE_HINTS = [
  'vendor (or supplier)',
  'contractor (or builder)',
  'client (or homeowner)',
  'architect',
  'consultant (or engineer)',
] as const

/**
 * Demo role login (vendor/contractor/…) with no password.
 * On for local `next dev` and Vercel deploys so device testing works without a local install.
 * Turn off for real production auth by setting NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false
 * (or removing the next.config env override).
 */
export function isLocalDemoEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'false') return false
  if (process.env.NODE_ENV === 'development') return true
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true') return true
  // Inlined at build time via next.config (VERCEL_ENV → NEXT_PUBLIC_VERCEL_ENV)
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') return true
  if (process.env.VERCEL_ENV === 'preview') return true
  return false
}

export function isDemoRole(value: string | undefined | null): value is UserRole {
  return !!value && USER_ROLES.some((r) => r.id === value)
}

/**
 * Accepts "vendor", "Vendor", "vendor@local", "supplier", etc.
 */
export function parseDemoRole(input: string): UserRole | null {
  const raw = input.trim().toLowerCase()
  if (!raw) return null
  const key = raw.includes('@') ? raw.split('@')[0]! : raw
  return ROLE_ALIASES[key] ?? null
}

export function demoProfile(role: UserRole) {
  const label = USER_ROLES.find((r) => r.id === role)?.label ?? role
  return {
    id: `demo-${role}`,
    auth_id: `demo-${role}`,
    email: `${role}@local.5bloc`,
    full_name: `Local ${label}`,
    role,
    org_id: `demo-org-${role}`,
    plan: 'free' as const,
    ai_add_on: false,
    avatar_url: null as string | null,
    organisations: { name: `${label} Demo Org` },
  }
}

export function demoUser(role: UserRole) {
  const profile = demoProfile(role)
  return {
    id: profile.auth_id,
    email: profile.email,
    user_metadata: {
      full_name: profile.full_name,
      role,
      onboarding_complete: true,
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  }
}

/** Client-side: clear cookie + localStorage on logout. */
export function clearDemoSessionClient() {
  if (typeof document === 'undefined') return
  document.cookie = `${DEMO_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
  try {
    localStorage.removeItem(DEMO_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
