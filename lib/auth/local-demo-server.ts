import { cookies } from 'next/headers'
import type { UserRole } from '@/lib/roles'
import { DEMO_COOKIE } from '@/lib/auth/local-demo'

const COOKIE_OPTS = {
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
  sameSite: 'lax' as const,
  httpOnly: false,
}

/** Server: set demo role cookie (Route Handler / Server Action). */
export async function setDemoSession(role: UserRole) {
  const jar = await cookies()
  jar.set(DEMO_COOKIE, role, COOKIE_OPTS)
}

/** Server: clear demo role cookie. */
export async function clearDemoSession() {
  const jar = await cookies()
  jar.set(DEMO_COOKIE, '', { ...COOKIE_OPTS, maxAge: 0 })
}
