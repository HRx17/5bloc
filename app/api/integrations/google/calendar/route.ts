import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getFreshGoogleToken } from '@/lib/integrations/token-refresh'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getFreshGoogleToken(user.id)
  if (!token) return NextResponse.json({ notConnected: true, events: [] })

  try {
    const now    = new Date()
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    const params = new URLSearchParams({
      maxResults:   '20',
      singleEvents: 'true',
      orderBy:      'startTime',
      timeMin:      now.toISOString(),
      timeMax:      future.toISOString(),
    })

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) {
      const errBody = await res.text()
      console.error('Calendar API error:', res.status, errBody)
      return NextResponse.json({ error: `Calendar API error ${res.status}`, detail: errBody }, { status: 502 })
    }
    const data = await res.json()

    const events = (data.items ?? []).map((e: any) => ({
      id:          e.id,
      summary:     e.summary ?? '(no title)',
      start:       e.start?.dateTime ?? e.start?.date,
      end:         e.end?.dateTime   ?? e.end?.date,
      location:    e.location ?? null,
      description: e.description ?? null,
      htmlLink:    e.htmlLink,
      attendees:   (e.attendees ?? []).map((a: any) => ({ email: a.email, name: a.displayName, self: a.self })),
      allDay:      !e.start?.dateTime,
    }))

    return NextResponse.json({ events })
  } catch (e) {
    console.error('Calendar route error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getFreshGoogleToken(user.id)
  if (!token) return NextResponse.json({ error: 'Not connected' }, { status: 403 })

  try {
    const body = await req.json()
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    if (!res.ok) {
      const errBody = await res.text()
      console.error('Calendar create error:', res.status, errBody)
      return NextResponse.json({ error: `Calendar create failed ${res.status}` }, { status: 502 })
    }
    return NextResponse.json(await res.json())
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
