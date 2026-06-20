import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { needsOnboarding } from '@/lib/auth/onboarding'

export async function getAuthUser() {
  const supabase = await createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  let profile = (
    await supabase
      .from('profiles')
      .select('*, organisations!profiles_org_id_fkey(*)')
      .eq('auth_id', user.id)
      .maybeSingle()
  ).data

  if (!profile) {
    const { data: profileId } = await supabase.rpc('my_profile_id')
    if (profileId) {
      const { data: byId } = await supabase
        .from('profiles')
        .select('*, organisations!profiles_org_id_fkey(*)')
        .eq('id', profileId)
        .maybeSingle()
      profile = byId
    }
  }

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
  }
}
