/**
 * Google OAuth helpers — Drive, Gmail, Calendar
 * Tokens are stored in the Supabase `user_integrations` table.
 */

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar',
  'openid',
  'email',
].join(' ')

export function getGoogleRedirectUri(baseUrl: string) {
  return `${baseUrl}/api/integrations/google/callback`
}

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         GOOGLE_SCOPES,
    access_type:   'offline',
    prompt:        'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google token exchange failed: ${err}`)
  }
  return res.json() as Promise<{
    access_token:  string
    refresh_token: string
    expires_in:    number
    token_type:    string
    scope:         string
  }>
}

export async function refreshGoogleToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type:    'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Google token refresh failed')
  return res.json() as Promise<{ access_token: string; expires_in: number }>
}

export async function getGoogleUserInfo(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.json() as Promise<{ email: string; name: string; picture: string }>
}

// ── Drive ────────────────────────────────────────────────────────────────────

export async function listDriveFiles(accessToken: string, query?: string) {
  const q = query ? encodeURIComponent(query) : ''
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)${q ? `&q=${q}` : ''}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) throw new Error('Drive files fetch failed')
  return res.json() as Promise<{ files: { id: string; name: string; mimeType: string; modifiedTime: string; size: string; webViewLink: string }[] }>
}

export async function uploadToDrive(accessToken: string, filename: string, content: Blob, mimeType: string, folderId?: string) {
  const meta = JSON.stringify({ name: filename, ...(folderId ? { parents: [folderId] } : {}) })
  const form = new FormData()
  form.append('metadata', new Blob([meta], { type: 'application/json' }))
  form.append('file', content, filename)

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })
  if (!res.ok) throw new Error('Drive upload failed')
  return res.json() as Promise<{ id: string; name: string; webViewLink: string }>
}

// ── Gmail ────────────────────────────────────────────────────────────────────

export async function listGmailThreads(accessToken: string, query = '', maxResults = 10) {
  const params = new URLSearchParams({ maxResults: String(maxResults), ...(query ? { q: query } : {}) })
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Gmail threads fetch failed')
  return res.json() as Promise<{ threads?: { id: string; snippet: string }[] }>
}

export async function getGmailMessage(accessToken: string, messageId: string) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject,From,Date`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Gmail message fetch failed')
  return res.json()
}

// ── Calendar ─────────────────────────────────────────────────────────────────

export async function listCalendarEvents(accessToken: string, timeMin?: string, timeMax?: string) {
  const params = new URLSearchParams({
    maxResults: '20',
    singleEvents: 'true',
    orderBy: 'startTime',
    ...(timeMin ? { timeMin } : { timeMin: new Date().toISOString() }),
    ...(timeMax ? { timeMax } : {}),
  })
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Calendar events fetch failed')
  return res.json() as Promise<{ items: { id: string; summary: string; start: { dateTime: string }; end: { dateTime: string }; htmlLink: string }[] }>
}

export async function createCalendarEvent(accessToken: string, event: {
  summary: string
  description?: string
  start: string
  end: string
  attendees?: string[]
}) {
  const body = {
    summary: event.summary,
    description: event.description,
    start: { dateTime: event.start, timeZone: 'Asia/Kolkata' },
    end:   { dateTime: event.end,   timeZone: 'Asia/Kolkata' },
    attendees: event.attendees?.map(email => ({ email })),
  }
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Calendar event creation failed')
  return res.json()
}
