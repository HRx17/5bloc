/**
 * Production environment contract.
 * Critical vars must be present in production; recommended vars warn only.
 */

export const isProduction = process.env.NODE_ENV === 'production'

function present(value: string | undefined): boolean {
  const v = value?.trim()
  if (!v) return false
  if (v.startsWith('your_') || v.endsWith('_here')) return false
  return true
}

export type PublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
}

/** Client-safe public env. Throws in production when required vars are missing. */
export function getPublicEnv(): PublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ''

  if (isProduction) {
    if (!present(url) || !present(anon)) {
      throw new Error(
        'App misconfigured: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required in production.',
      )
    }
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
  }
}

const CRITICAL = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const

const RECOMMENDED = [
  'RESEND_API_KEY',
  'ANTHROPIC_API_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'NEXT_PUBLIC_RAZORPAY_KEY_ID',
  'RAZORPAY_WEBHOOK_SECRET',
  'PAYMENT_LINK_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const

function hasR2OrSupabaseStorage(): boolean {
  const hasR2 =
    present(process.env.R2_ACCESS_KEY_ID) &&
    present(process.env.R2_SECRET_ACCESS_KEY) &&
    (present(process.env.CLOUDFLARE_ACCOUNT_ID) || present(process.env.CF_ACCOUNT_ID))
  // Supabase Storage is available when the project URL + service role (or anon) exist
  const hasSupabaseStorage =
    present(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    (present(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
      present(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  return hasR2 || hasSupabaseStorage
}

let asserted = false

/** Validate server env once. In production, missing CRITICAL vars throw. */
export function assertServerEnv(): void {
  if (asserted) return
  asserted = true

  // Skip static `next build` analysis — validate at runtime startup
  if (process.env.NEXT_PHASE === 'phase-production-build') return
  if (!isProduction) return

  const missingCritical = CRITICAL.filter((k) => !present(process.env[k]))
  if (missingCritical.length > 0) {
    const msg = `[env] CRITICAL missing in production: ${missingCritical.join(', ')}`
    console.error(msg)
    throw new Error(msg)
  }

  const missingRecommended = RECOMMENDED.filter((k) => !present(process.env[k]))
  if (missingRecommended.length > 0) {
    console.warn(
      `[env] RECOMMENDED missing: ${missingRecommended.join(', ')} — related features may be disabled.`,
    )
  }

  if (!hasR2OrSupabaseStorage()) {
    console.warn(
      '[env] RECOMMENDED: configure R2_* (CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME) or rely on Supabase storage.',
    )
  }
}
