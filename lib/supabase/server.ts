import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function createSupabaseServer() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Return mock proxy for offline local development
    return new Proxy({}, {
      get: () => {
        return () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
            order: () => Promise.resolve({ data: [], error: null }),
          }),
          insert: () => Promise.resolve({ data: null, error: null }),
          update: () => ({
            eq: () => Promise.resolve({ data: null, error: null })
          }),
        })
      }
    }) as any
  }
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
}

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_key'
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
