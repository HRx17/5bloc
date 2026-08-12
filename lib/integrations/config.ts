/**
 * Server-side view of which integrations are actually usable in this deployment.
 *
 * Connect buttons are only offered for providers whose credentials are present, so a
 * user never gets bounced through an OAuth redirect that cannot possibly succeed.
 */

export type ProviderId = 'google' | 'autodesk'

export interface ProviderConfig {
  /** Env vars without which the OAuth flow cannot run at all. */
  required: string[]
  /** Env vars that unlock extra capability but are not needed to connect. */
  optional: string[]
}

export const PROVIDER_ENV: Record<ProviderId, ProviderConfig> = {
  google: {
    required: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    // Needed by the Drive Picker so users can pick the folders to expose.
    optional: ['NEXT_PUBLIC_GOOGLE_API_KEY', 'NEXT_PUBLIC_GOOGLE_APP_ID'],
  },
  autodesk: {
    required: ['AUTODESK_CLIENT_ID', 'AUTODESK_CLIENT_SECRET'],
    optional: [],
  },
}

export const PROVIDER_IDS = Object.keys(PROVIDER_ENV) as ProviderId[]

function missing(vars: string[]): string[] {
  return vars.filter((name) => !process.env[name])
}

export interface ProviderStatus {
  configured:   boolean
  missingEnv:   string[]
  missingOptionalEnv: string[]
}

export function getProviderStatus(provider: ProviderId): ProviderStatus {
  const { required, optional } = PROVIDER_ENV[provider]
  const missingEnv = missing(required)
  return {
    configured: missingEnv.length === 0,
    missingEnv,
    missingOptionalEnv: missing(optional),
  }
}

export function getAllProviderStatus(): Record<ProviderId, ProviderStatus> {
  return Object.fromEntries(
    PROVIDER_IDS.map((p) => [p, getProviderStatus(p)])
  ) as Record<ProviderId, ProviderStatus>
}

export function isProviderId(value: string): value is ProviderId {
  return (PROVIDER_IDS as string[]).includes(value)
}
