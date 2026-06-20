import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function parseIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]

  const turnUrl = process.env.TURN_SERVER_URL
  const turnUser = process.env.TURN_SERVER_USERNAME
  const turnCred = process.env.TURN_SERVER_CREDENTIAL

  if (turnUrl && turnUser && turnCred) {
    servers.push({
      urls: turnUrl.split(',').map((u) => u.trim()).filter(Boolean),
      username: turnUser,
      credential: turnCred,
    })
  }

  return servers
}

/** Return ICE server config for authenticated WebRTC calls. */
export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({ iceServers: parseIceServers() })
}
