import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
type Ctx = { params: Promise<{ id: string }> }

const MOCK_MESSAGES: Record<string, any[]> = {}

function mockKey(projectId: string, channel: string) {
  return `${projectId}:${channel}`
}

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const channel = (url.searchParams.get('channel') || 'general').toLowerCase()

  if (shouldServeMockData(auth)) {
    const messages = MOCK_MESSAGES[mockKey(id, channel)] || []
    return NextResponse.json({ channel, messages })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase.rpc('list_project_channel_messages', {
    p_project_id: id,
    p_channel: channel,
    p_limit: 200,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || { channel, messages: [] })
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const channel = String(body.channel || 'general').toLowerCase()
  const text = String(body.text || body.body || '').trim()
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

  if (shouldServeMockData(auth)) {
    const msg = {
      id: `msg-${Date.now()}`,
      text,
      sender: auth.profile.full_name || 'You',
      role: auth.profile.role || 'member',
      created_at: new Date().toISOString(),
      channel,
      sender_id: auth.profile.id,
    }
    const key = mockKey(id, channel)
    MOCK_MESSAGES[key] = [...(MOCK_MESSAGES[key] || []), msg]
    return NextResponse.json({ message: msg }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase.rpc('post_project_channel_message', {
    p_project_id: id,
    p_channel: channel,
    p_body: text,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data }, { status: 201 })
}
