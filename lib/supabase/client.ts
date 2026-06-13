import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

export function createSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton for use in client components
export const supabaseClient = createSupabaseClient()
