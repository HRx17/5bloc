import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { needsOnboarding } from '@/lib/auth/onboarding'
import {
  DEMO_COOKIE,
  demoProfile,
  demoUser,
  isDemoRole,
  isLocalDemoEnabled,
} from '@/lib/auth/local-demo'
import { isSupabaseConfigured, createSupabaseServer } from '@/lib/supabase/server'

export async function getAuthUser() {
  // Local demo login (role cookie) — development only
  if (isLocalDemoEnabled()) {
    const jar = await cookies()
    const role = jar.get(DEMO_COOKIE)?.value
    if (isDemoRole(role)) {
      const profile = demoProfile(role)
      return {
        user: demoUser(role) as never,
        profile,
        supabase: null as never,
        orgId: profile.org_id,
        needsOnboarding: false,
        isDemo: true as const,
      }
    }
  }

  if (!isSupabaseConfigured()) {
    redirect('/login')
  }

  const supabase = await createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organisations(*)')
    .eq('auth_id', user.id)
    .maybeSingle()

  const orgId = profile?.org_id ?? null

  const resolvedProfile = profile ?? {
    id: user.id,
    auth_id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
    role: (user.user_metadata?.role as string) ?? 'architect',
    org_id: null,
    plan: 'free',
    ai_add_on: false,
    avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    organisations: null,
  }

  return {
    user,
    profile: resolvedProfile,
    supabase,
    orgId,
    needsOnboarding: needsOnboarding(user, orgId),
    isDemo: false as const,
  }
}
