import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>

let singleton: BrowserClient | null = null

export function createSupabaseClient(): BrowserClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      '@supabase/ssr: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required',
    )
  }

  // Reuse one browser client per page load (avoids multiple GoTrue clients)
  if (singleton) return singleton
  singleton = createBrowserClient<Database>(url, key)
  return singleton
}

/** Lazy singleton — safe to import during prerender without env vars. */
export const supabaseClient = new Proxy({} as BrowserClient, {
  get(_target, prop, receiver) {
    const client = createSupabaseClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
