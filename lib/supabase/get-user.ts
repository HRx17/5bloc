import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies, headers } from 'next/headers'
import { getMockProfile, hasSupabaseEnv, isMockAuthEnabled } from '@/lib/rbac/mock'
import type { RoleKey } from '@/lib/rbac/roles'
import { PROFILE_TABLE } from '@/lib/supabase/schema-map'

export type AuthProfile = {
  id: string
  auth_id?: string
  full_name: string | null
  email: string
  phone?: string | null
  avatar_url?: string | null
  role: RoleKey | string
  org_id: string | null
  plan: string
  ai_add_on: boolean
  onboarded_at?: string | null
  organisations?: {
    id: string
    name: string
    plan: string
    owner_id?: string
    city?: string | null
    gst_number?: string | null
    address?: string | null
  } | null
}

async function loadProfile(supabase: any, authUserId: string) {
  const { data: profile, error: profileError } = await supabase
    .from(PROFILE_TABLE)
    .select('*, organisations!profiles_org_id_fkey(*)')
    .eq('auth_id', authUserId)
    .single()

  if (profileError || !profile) {
    const plain = await supabase.from(PROFILE_TABLE).select('*').eq('auth_id', authUserId).single()
    if (plain.error || !plain.data) {
      throw new Response('Profile not found', { status: 404 })
    }
    let organisations = null
    if (plain.data.org_id) {
      const org = await supabase.from('organisations').select('*').eq('id', plain.data.org_id).maybeSingle()
      organisations = org.data
    }
    return { ...plain.data, organisations } as AuthProfile
  }
  return profile as AuthProfile
}

export async function getAuthUser(options?: { roleOverride?: string }) {
  // Explicit mock mode only — never treat missing env as silent mock success
  if (isMockAuthEnabled()) {
    const profile = getMockProfile(options?.roleOverride)
    return {
      user: { id: profile.auth_id, email: profile.email },
      profile,
      supabase: null as any,
      orgId: profile.org_id,
      isMock: true as const,
    }
  }

  if (!hasSupabaseEnv()) {
    throw new Response('Auth not configured', { status: 503 })
  }

  const headerStore = await headers()
  const authHeader = headerStore.get('authorization') || headerStore.get('Authorization')
  const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]

  if (bearer) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    )
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(bearer)
    if (error || !user) throw new Response('Unauthorized', { status: 401 })
    const profile = await loadProfile(supabase, user.id)
    return {
      user,
      profile,
      supabase,
      orgId: profile.org_id as string | null,
      isMock: false as const,
    }
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore if called from a Server Component
          }
        },
      },
    }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const profile = await loadProfile(supabase, user.id)

  return {
    user,
    profile,
    supabase,
    orgId: profile.org_id as string | null,
    isMock: false as const,
  }
}

/** Soft fetch for layouts — returns null instead of throwing. Never invents a mock user when MOCK_AUTH=0. */
export async function getAuthUserOrNull() {
  try {
    return await getAuthUser()
  } catch {
    if (isMockAuthEnabled()) {
      const profile = getMockProfile()
      return {
        user: { id: profile.auth_id, email: profile.email },
        profile,
        supabase: null as any,
        orgId: profile.org_id,
        isMock: true as const,
      }
    }
    return null
  }
}
