/**
 * Server-side Supabase helpers for the ported API routes.
 *
 * Only imported from server route handlers under `src/routes/api/*`.
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

export function hasValidServiceRoleKey(): boolean {
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']?.trim()
  if (!key) return false
  if (key.startsWith('your_') || key === 'placeholder_service_key') return false
  return true
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env['SUPABASE_URL']?.trim() && process.env['SUPABASE_PUBLISHABLE_KEY']?.trim())
}

function apiKeyFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers)
    if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) {
      headers.delete('Authorization')
    }
    headers.set('apikey', key)
    return fetch(input, { ...init, headers })
  }
}

/** Service-role client. Bypasses row level security — privileged reads/writes only. */
export function createServiceRoleClient() {
  const url = process.env['SUPABASE_URL']
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!url || !key) throw new Error('Service role key is not configured')
  return createClient<Database>(url, key, {
    global: { fetch: apiKeyFetch(key) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  })
}

/** Publishable-key client with no user session; row level security applies as `anon`. */
export function createSupabasePublicClient() {
  const url = process.env['SUPABASE_URL']
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient<Database>(url, key, {
    global: { fetch: apiKeyFetch(key) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Server client for privileged, explicitly user-scoped helpers (OAuth token store).
 * Callers must always filter by `user_id` themselves — this bypasses row level security.
 */
export async function createSupabaseServer() {
  return createServiceRoleClient()
}
