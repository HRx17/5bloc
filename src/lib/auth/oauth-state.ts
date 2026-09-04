import crypto from 'crypto'

export type OAuthStatePayload = {
  userId: string
  origin: string
  ts: number
}

function stateSecret(): string {
  const secret =
    process.env.OAUTH_STATE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  if (!secret) {
    throw new Error('OAUTH_STATE_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is required')
  }
  return secret
}

function sign(data: string): string {
  return crypto.createHmac('sha256', stateSecret()).update(data).digest('base64url')
}

/** Encode + HMAC-sign OAuth state so callbacks cannot be forged. */
export function signOAuthState(payload: { userId: string; origin: string }): string {
  const body: OAuthStatePayload = { ...payload, ts: Date.now() }
  const data = Buffer.from(JSON.stringify(body)).toString('base64url')
  return `${data}.${sign(data)}`
}

/** Verify signed OAuth state. Rejects tampering and expired tokens (default 10m). */
export function verifyOAuthState(
  state: string,
  maxAgeMs = 10 * 60 * 1000,
): OAuthStatePayload {
  const [data, sig] = state.split('.')
  if (!data || !sig) throw new Error('Invalid OAuth state')

  const expected = sign(data)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('Invalid OAuth state signature')
  }

  const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as OAuthStatePayload
  if (!payload?.userId || !payload?.origin || typeof payload.ts !== 'number') {
    throw new Error('Invalid OAuth state payload')
  }
  if (Date.now() - payload.ts > maxAgeMs) {
    throw new Error('OAuth state expired')
  }

  // Origin must be an absolute http(s) URL — used for post-OAuth redirect
  let originUrl: URL
  try {
    originUrl = new URL(payload.origin)
  } catch {
    throw new Error('Invalid OAuth origin')
  }
  if (originUrl.protocol !== 'http:' && originUrl.protocol !== 'https:') {
    throw new Error('Invalid OAuth origin protocol')
  }

  return payload
}
