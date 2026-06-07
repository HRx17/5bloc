import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function getAuthUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Mock user for local development and testing when Supabase keys are not set yet
    return {
      user: { id: 'mock-user-id', email: 'architect@5bloc.com' },
      profile: {
        id: 'mock-profile-id',
        full_name: 'Parth (Mock Architect)',
        email: 'architect@5bloc.com',
        role: 'architect',
        org_id: 'mock-org-id',
        plan: 'team',
        ai_add_on: true,
        organisations: {
          id: 'mock-org-id',
          name: 'Apex Architects',
          plan: 'team',
          owner_id: 'mock-profile-id'
        }
      },
      supabase: null as any,
      orgId: 'mock-org-id'
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
            // Ignore error if set from Server Component
          }
        },
      },
    }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, organisations(*)')
    .eq('auth_id', user.id)
    .single()

  if (!profile) {
    throw new Response('Profile not found', { status: 404 })
  }

  return { user, profile, supabase, orgId: profile.org_id }
}
