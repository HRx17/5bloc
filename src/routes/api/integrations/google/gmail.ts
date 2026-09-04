import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { getFreshGoogleToken } from '@/lib/integrations/token-refresh'

export const dynamic = 'force-dynamic'

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  const user = auth?.user ?? null
  const supabase = auth?.supabase as any
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getFreshGoogleToken(user.id)
  if (!token) return json({ notConnected: true, threads: [] })

  const query      = new URL(request.url).searchParams.get('q') ?? ''
  const maxResults = new URL(request.url).searchParams.get('max') ?? '20'
  const threadId   = new URL(request.url).searchParams.get('threadId')

  try {
    // Fetch a single thread's full messages
    if (threadId) {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=metadata&metadataHeaders=Subject,From,Date,To`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) return json({ error: 'Gmail API error' }, { status: 502 })
      const data = await res.json()
      // Parse each message into readable shape
      const messages = (data.messages ?? []).map((m: any) => {
        const headers: Record<string, string> = {}
        for (const h of (m.payload?.headers ?? [])) headers[h.name] = h.value
        const body = extractBody(m.payload)
        return {
          id:      m.id,
          subject: headers['Subject'] ?? '(no subject)',
          from:    headers['From']    ?? '',
          to:      headers['To']      ?? '',
          date:    headers['Date']    ?? '',
          snippet: m.snippet ?? '',
          body,
          labelIds: m.labelIds ?? [],
        }
      })
      return json({ messages })
    }

    // List threads
    const params = new URLSearchParams({ maxResults, ...(query ? { q: query } : {}) })
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/threads?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!listRes.ok) {
      const errBody = await listRes.text()
      console.error('Gmail list error:', listRes.status, errBody)
      return json({ error: `Gmail API error ${listRes.status}`, detail: errBody }, { status: 502 })
    }
    const listData = await listRes.json()
    const rawThreads = listData.threads ?? []

    // Hydrate each thread with metadata from first message
    const threads = await Promise.all(
      rawThreads.slice(0, 15).map(async (t: any) => {
        const tRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads/${t.id}?format=metadata&metadataHeaders=Subject,From,Date`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (!tRes.ok) return { id: t.id, snippet: t.snippet, subject: '(no subject)', from: '', date: '', unread: false }
        const tData = await tRes.json()
        const first = tData.messages?.[0]
        const headers: Record<string, string> = {}
        for (const h of (first?.payload?.headers ?? [])) headers[h.name] = h.value
        const unread = (first?.labelIds ?? []).includes('UNREAD')
        return {
          id:           t.id,
          subject:      headers['Subject'] ?? '(no subject)',
          from:         headers['From']    ?? '',
          date:         headers['Date']    ?? '',
          snippet:      first?.snippet     ?? '',
          messageCount: tData.messages?.length ?? 1,
          unread,
        }
      })
    )

    return json({ threads })
  } catch (e) {
    console.error('Gmail route error:', e)
    return json({ error: 'Internal error' }, { status: 500 })
  }
}

function extractBody(payload: any): string {
  if (!payload) return ''
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8')
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const found = extractBody(part)
      if (found) return found
    }
  }
  return ''
}

export const Route = createFileRoute('/api/integrations/google/gmail')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})
