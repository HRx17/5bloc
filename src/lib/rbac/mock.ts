import type { RoleKey } from './roles'

/** Mock auth is not used in this build — real accounts always go through the backend. */
export function isMockAuthEnabled(): boolean {
  return false
}

export function hasSupabaseEnv(): boolean {
  return !!(
    import.meta.env['VITE_SUPABASE_URL'] && import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']
  )
}

export type MockProfile = {
  id: string
  auth_id: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  role: RoleKey
  org_id: string | null
  plan: 'free' | 'solo' | 'team'
  ai_add_on: boolean
  onboarded_at: string | null
  organisations: {
    id: string
    name: string
    plan: 'free' | 'solo' | 'team'
    owner_id: string
    city?: string
    gst_number?: string
  } | null
}

const MOCK_PROFILES: Record<RoleKey, MockProfile> = {
  architect: {
    id: 'mock-architect-id',
    auth_id: 'mock-auth-architect',
    full_name: 'Parth Patel',
    email: 'architect@5bloc.com',
    phone: '+91 98765 43210',
    avatar_url: null,
    role: 'architect',
    org_id: 'mock-org-id',
    plan: 'team',
    ai_add_on: true,
    onboarded_at: '2026-01-01T00:00:00Z',
    organisations: {
      id: 'mock-org-id',
      name: 'Apex Architects',
      plan: 'team',
      owner_id: 'mock-architect-id',
      city: 'Mumbai',
      gst_number: '27AAAAA0000A1Z5',
    },
  },
  contractor: {
    id: 'mock-contractor-id',
    auth_id: 'mock-auth-contractor',
    full_name: 'Ravi Desai',
    email: 'contractor@5bloc.com',
    phone: '+91 90000 11111',
    avatar_url: null,
    role: 'contractor',
    org_id: null,
    plan: 'free',
    ai_add_on: false,
    onboarded_at: '2026-01-01T00:00:00Z',
    organisations: null,
  },
  builder: {
    id: 'mock-builder-id',
    auth_id: 'mock-auth-builder',
    full_name: 'Meera Shah',
    email: 'builder@5bloc.com',
    phone: null,
    avatar_url: null,
    role: 'builder',
    org_id: null,
    plan: 'free',
    ai_add_on: false,
    onboarded_at: '2026-01-01T00:00:00Z',
    organisations: null,
  },
  consultant: {
    id: 'mock-consultant-id',
    auth_id: 'mock-auth-consultant',
    full_name: 'Amit Sharma',
    email: 'consultant@5bloc.com',
    phone: null,
    avatar_url: null,
    role: 'consultant',
    org_id: null,
    plan: 'free',
    ai_add_on: false,
    onboarded_at: '2026-01-01T00:00:00Z',
    organisations: null,
  },
  client: {
    id: 'mock-client-id',
    auth_id: 'mock-auth-client',
    full_name: 'Wadhwa Group',
    email: 'client@5bloc.com',
    phone: null,
    avatar_url: null,
    role: 'client',
    org_id: null,
    plan: 'free',
    ai_add_on: false,
    onboarded_at: '2026-01-01T00:00:00Z',
    organisations: null,
  },
}

export function getMockProfile(role?: string | null): MockProfile {
  if (role && role in MOCK_PROFILES) return MOCK_PROFILES[role as RoleKey]
  return MOCK_PROFILES.architect
}
