import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

export function createSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Return empty shell / mock proxies if not set
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
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export const supabaseClient = createSupabaseClient()
