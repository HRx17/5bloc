/**
 * Returns a fresh access token for a provider, refreshing it transparently
 * if it has expired. Saves the new token back to Supabase.
 */
import { getToken, saveToken } from './token-store'
import { refreshGoogleToken } from './google'
import { refreshAutodeskToken } from './autodesk'

export async function getFreshGoogleToken(userId: string): Promise<string | null> {
  const rec = await getToken(userId, 'google')
  if (!rec) return null

  const expiresAt = rec.expires_at ? new Date(rec.expires_at).getTime() : 0
  const needsRefresh = expiresAt - Date.now() < 5 * 60 * 1000 // refresh if <5 min left

  if (!needsRefresh) return rec.access_token

  if (!rec.refresh_token) return null
  try {
    const fresh = await refreshGoogleToken(rec.refresh_token)
    await saveToken(userId, {
      ...rec,
      access_token: fresh.access_token,
      expires_at:   new Date(Date.now() + fresh.expires_in * 1000).toISOString(),
    })
    return fresh.access_token
  } catch {
    return rec.access_token // fall back to existing; let API call fail if truly expired
  }
}

export async function getFreshAutodeskToken(userId: string): Promise<string | null> {
  const rec = await getToken(userId, 'autodesk')
  if (!rec) return null

  const expiresAt = rec.expires_at ? new Date(rec.expires_at).getTime() : 0
  const needsRefresh = expiresAt - Date.now() < 5 * 60 * 1000

  if (!needsRefresh) return rec.access_token

  if (!rec.refresh_token) return null
  try {
    const fresh = await refreshAutodeskToken(rec.refresh_token)
    await saveToken(userId, {
      ...rec,
      access_token: fresh.access_token,
      expires_at:   new Date(Date.now() + fresh.expires_in * 1000).toISOString(),
    })
    return fresh.access_token
  } catch {
    return rec.access_token
  }
}
