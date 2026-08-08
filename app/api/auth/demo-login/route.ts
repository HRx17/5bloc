import { NextResponse } from 'next/server'
import { isLocalDemoEnabled, parseDemoRole } from '@/lib/auth/local-demo'
import { clearDemoSession, setDemoSession } from '@/lib/auth/local-demo-server'

export async function POST(request: Request) {
  if (!isLocalDemoEnabled()) {
    return NextResponse.json({ error: 'Demo login is only available in local development.' }, { status: 403 })
  }

  let body: { username?: string; clear?: boolean } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.clear) {
    await clearDemoSession()
    return NextResponse.json({ ok: true })
  }

  const role = parseDemoRole(body.username ?? '')
  if (!role) {
    return NextResponse.json(
      {
        error: 'Unknown demo role. Try: vendor, contractor, client, architect, or consultant.',
      },
      { status: 400 },
    )
  }

  await setDemoSession(role)
  return NextResponse.json({ ok: true, role })
}
