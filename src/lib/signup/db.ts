import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createServiceRoleClient,
  createSupabasePublicClient,
  hasValidServiceRoleKey,
} from '@/lib/supabase/server'

/** Prefer service role for public signup inserts so row level security never blocks waitlists. */
export function getSignupDb(): SupabaseClient {
  if (hasValidServiceRoleKey()) return createServiceRoleClient() as unknown as SupabaseClient
  return createSupabasePublicClient() as unknown as SupabaseClient
}

export function isDbUnreachableError(
  err: { message?: string; code?: string } | null | undefined
): boolean {
  if (!err?.message) return false
  const m = err.message.toLowerCase()
  return (
    m.includes('fetch failed') ||
    m.includes('failed to fetch') ||
    m.includes('enotfound') ||
    m.includes('econnrefused') ||
    m.includes('econnreset') ||
    m.includes('network') ||
    m.includes('getaddrinfo') ||
    m.includes('timeout') ||
    m.includes('aborted')
  )
}

export function friendlySignupDbError(
  err: { message?: string } | null | undefined,
  kind: string
): string {
  if (isDbUnreachableError(err)) {
    return 'Our database is temporarily unreachable. We still emailed your details to the 5Bloc team — we will follow up shortly.'
  }
  if (err?.message?.includes('relation') || err?.message?.includes('does not exist')) {
    return `${kind} is not set up yet. Please contact support.`
  }
  return err?.message || `Could not save ${kind.toLowerCase()}`
}
