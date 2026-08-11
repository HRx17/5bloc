import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Lightweight probe so we can tell if Supabase DNS/API is reachable. */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: 'Missing Supabase env' }, { status: 500 })
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
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      host: new URL(url).host,
      body: text.slice(0, 200),
    }, { status: res.ok ? 200 : 502 })
  } catch (e: unknown) {
    clearTimeout(timer)
    const message = e instanceof Error ? e.message : 'unreachable'
    return NextResponse.json({
      ok: false,
      host: (() => { try { return new URL(url).host } catch { return url } })(),
      error: message,
      hint: 'If NXDOMAIN/ENOTFOUND, resume or recreate the Supabase project, then run supabase/migrations/20250623_signup_roles_and_partner_tables.sql',
    }, { status: 502 })
  }
}
