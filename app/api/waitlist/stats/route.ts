import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hasSupabaseEnv } from '@/lib/rbac/mock'
import { hasValidServiceRoleKey } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function relativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.max(1, Math.round(ms / 60000))
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export async function GET() {
  const fallback = {
    last_city: 'Mumbai',
    last_label: 'Someone joined the waitlist recently',
  }

  if (!hasSupabaseEnv()) return NextResponse.json(fallback)

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = hasValidServiceRoleKey()
      ? process.env.SUPABASE_SERVICE_ROLE_KEY!
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(url, key, { auth: { persistSession: false } })
    const { data } = await supabase
      .from('waitlist')
      .select('city, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data?.created_at) return NextResponse.json(fallback)
    const city = (data.city || '').trim() || 'India'
    return NextResponse.json({
      last_city: city,
      last_label: `Last signup from ${city} · ${relativeTime(data.created_at)}`,
    })
  } catch {
    return NextResponse.json(fallback)
  }
}
