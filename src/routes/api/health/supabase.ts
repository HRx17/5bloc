import { createFileRoute } from '@tanstack/react-router'
import { json } from '@/lib/api/get-user.server'


/** Lightweight probe so we can tell if Supabase DNS/API is reachable. */
const handleGET = async ({ request }: any) => {
  const url = process.env['SUPABASE_URL']
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']
  if (!url || !key) {
    return json({ ok: false, error: 'Missing Supabase env' }, { status: 500 })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/health`, {
      headers: { apikey: key },
      signal: controller.signal,
    })
    clearTimeout(timer)
    const text = await res.text().catch(() => '')
    return json({
      ok: res.ok,
      status: res.status,
      host: new URL(url).host,
      body: text.slice(0, 200),
    }, { status: res.ok ? 200 : 502 })
  } catch (e: unknown) {
    clearTimeout(timer)
    const message = e instanceof Error ? e.message : 'unreachable'
    return json({
      ok: false,
      host: (() => { try { return new URL(url).host } catch { return url } })(),
      error: message,
      hint: 'If NXDOMAIN/ENOTFOUND, resume or recreate the Supabase project, then run supabase/migrations/20250623_signup_roles_and_partner_tables.sql',
    }, { status: 502 })
  }
}

export const Route = createFileRoute('/api/health/supabase')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})
