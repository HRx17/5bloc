/**
 * Autodesk Platform Services (APS/Forge) helpers
 * Used for DWG viewing, 3D model translation and clash detection.
 */

const CLIENT_ID     = process.env.AUTODESK_CLIENT_ID!
const CLIENT_SECRET = process.env.AUTODESK_CLIENT_SECRET!
const APS_BASE      = 'https://developer.api.autodesk.com'

export const AUTODESK_SCOPES = 'data:read data:write data:create bucket:read bucket:create viewables:read'

export function getAutodeskRedirectUri(baseUrl: string) {
  return `${baseUrl}/api/integrations/autodesk/callback`
}

export function buildAutodeskAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     CLIENT_ID,
    redirect_uri:  redirectUri,
    scope:         AUTODESK_SCOPES,
    state,
  })
  return `https://developer.api.autodesk.com/authentication/v2/authorize?${params}`
}

export async function exchangeAutodeskCode(code: string, redirectUri: string) {
  const res = await fetch(`${APS_BASE}/authentication/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  redirectUri,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Autodesk token exchange failed: ${err}`)
  }
  return res.json() as Promise<{
    access_token:  string
    refresh_token: string
    expires_in:    number
    token_type:    string
  }>
}

export async function refreshAutodeskToken(refreshToken: string) {
  const res = await fetch(`${APS_BASE}/authentication/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope:         AUTODESK_SCOPES,
    }),
  })
  if (!res.ok) throw new Error('Autodesk token refresh failed')
  return res.json() as Promise<{ access_token: string; expires_in: number }>
}

export async function getAutodeskUserProfile(accessToken: string) {
  const res = await fetch(`${APS_BASE}/userprofile/v1/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.json() as Promise<{ userId: string; userName: string; emailId: string; profileImages: { sizeX40: string } }>
}

/** Get a 2-legged app token for server-side model translation */
export async function getAppToken(): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(`${APS_BASE}/authentication/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope:         'data:read data:write data:create bucket:read bucket:create viewables:read',
    }),
  })
  if (!res.ok) throw new Error('Autodesk app token failed')
  return res.json() as Promise<{ access_token: string; expires_in: number }>
}

/** Ensure OSS bucket exists for the app */
export async function ensureBucket(appToken: string, bucketKey: string) {
  const res = await fetch(`${APS_BASE}/oss/v2/buckets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${appToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketKey, policyKey: 'persistent' }),
  })
  if (res.status === 409) return // already exists
  if (!res.ok) throw new Error('Bucket creation failed')
}

/** Upload a DWG/model file to OSS */
export async function uploadToOSS(appToken: string, bucketKey: string, objectKey: string, buffer: Uint8Array, contentType = 'application/octet-stream') {
  const res = await fetch(`${APS_BASE}/oss/v2/buckets/${bucketKey}/objects/${encodeURIComponent(objectKey)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${appToken}`, 'Content-Type': contentType },
    body: buffer as BodyInit,
  })
  if (!res.ok) throw new Error('OSS upload failed')
  return res.json() as Promise<{ objectId: string; objectKey: string }>
}

/** Convert an OSS objectId into the URL-safe base64 URN used by the viewer + derivative API */
export function toUrn(objectId: string): string {
  return Buffer.from(objectId).toString('base64url')
}

/** Kick off Model Derivative translation (DWG/RVT → SVF2 for viewer). `urn` is the base64url URN. */
export async function translateModel(appToken: string, urn: string) {
  const body = {
    input:  { urn },
    output: { formats: [{ type: 'svf2', views: ['2d', '3d'] }] },
  }
  const res = await fetch(`${APS_BASE}/modelderivative/v2/designdata/job`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${appToken}`, 'Content-Type': 'application/json', 'x-ads-force': 'true' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Model translation failed: ${err}`)
  }
  return res.json()
}

/** Check translation status. `urn` is the base64url URN. */
export async function getTranslationStatus(appToken: string, urn: string) {
  const res = await fetch(`${APS_BASE}/modelderivative/v2/designdata/${urn}/manifest`, {
    headers: { Authorization: `Bearer ${appToken}` },
  })
  if (!res.ok) throw new Error('Translation status fetch failed')
  return res.json() as Promise<{ status: string; progress: string; derivatives?: any[] }>
}
