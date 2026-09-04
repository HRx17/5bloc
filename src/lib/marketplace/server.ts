import { createServiceRoleClient, hasValidServiceRoleKey } from '@/lib/supabase/server'
import { buildSignupIndex, isTestSignup, type SignupIndex, type SignupRow } from './listings'

/**
 * Load the public signup rows a listing can be enriched from.
 *
 * Prefers the service role so the join works regardless of who is browsing; falls back to the
 * caller's client, which RLS allows to read these tables. Returns an empty index rather than
 * throwing so a directory never fails because of the enrichment step.
 */
export async function loadSignupIndex(fallbackClient?: any): Promise<SignupIndex> {
  let db = fallbackClient
  if (hasValidServiceRoleKey()) {
    try {
      db = createServiceRoleClient()
    } catch {
      // keep the fallback
    }
  }
  if (!db) return buildSignupIndex([], [])

  try {
    const [contractorRes, vendorRes] = await Promise.all([
      db.from('contractor_signups').select('*'),
      db.from('vendor_signups').select('*'),
    ])
    const contractorSignups = ((contractorRes.data || []) as SignupRow[]).filter((r) => !isTestSignup(r))
    const vendorSignups = ((vendorRes.data || []) as SignupRow[]).filter((r) => !isTestSignup(r))
    return buildSignupIndex(contractorSignups, vendorSignups)
  } catch {
    return buildSignupIndex([], [])
  }
}
