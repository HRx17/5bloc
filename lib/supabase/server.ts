import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { assertServerEnv } from '@/lib/env'

let envChecked = false
function ensureEnvOnce() {
  if (envChecked) return
  envChecked = true
  try {
    assertServerEnv()
  } catch (e) {
    console.error(e)
    if (process.env.NODE_ENV === 'production') throw e
  }
}

export function hasValidServiceRoleKey(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!key) return false
  if (key.startsWith('your_') || key === 'placeholder_service_key') return false
  return true
}

export async function createSupabaseServer() {
  ensureEnvOnce()
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
  ensureEnvOnce()
  if (!hasValidServiceRoleKey()) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
