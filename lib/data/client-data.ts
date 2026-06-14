import { supabaseClient } from '@/lib/supabase/client'

/**
 * Resolves the current user's organisation id (needed when inserting rows).
 * Reads rely on RLS, which returns the user's own-org rows plus any
 * `is_template = true` rows, so most SELECTs don't need this.
 */
export async function getMyOrgId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) return null
    const { data } = await supabaseClient
      .from('profiles')
      .select('org_id')
      .eq('auth_id', user.id)
      .maybeSingle()
    return data?.org_id ?? null
  } catch {
    return null
  }
}

export function hasSupabaseEnv(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

/** Numeric phase (1-7) used by the DB <-> string phase key used by the UI. */
export const PHASE_KEYS = [
  'pre_design',
  'schematic_design',
  'design_development',
  'construction_docs',
  'bidding',
  'permits',
  'construction_admin',
  'complete',
] as const

export function phaseKeyFromNumber(n: number | null | undefined): string {
  if (!n || n < 1) return 'pre_design'
  return PHASE_KEYS[Math.min(n - 1, PHASE_KEYS.length - 1)]
}

export function phaseNumberFromKey(key: string | null | undefined): number {
  const idx = PHASE_KEYS.indexOf((key ?? 'pre_design') as (typeof PHASE_KEYS)[number])
  return idx < 0 ? 1 : idx + 1
}
