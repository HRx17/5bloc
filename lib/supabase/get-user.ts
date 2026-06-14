import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getAuthUser() {
  const supabase = await createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organisations(*)')
    .eq('auth_id', user.id)
    .single()

  return {
    user,
    profile: profile ?? {
      id: user.id,
      auth_id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
      role: (user.user_metadata?.role as string) ?? 'architect',
      org_id: null,
      plan: 'free',
      ai_add_on: false,
      organisations: null,
    },
    supabase,
    orgId: profile?.org_id ?? null,
  }
}
