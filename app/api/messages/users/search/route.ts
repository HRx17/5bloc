import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Search registered users by email or name so they can be added to a
 * conversation. Requires auth. Uses the service role to look up profiles
 * across organisations (collaboration is cross-org by design).
 */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = (req.nextUrl.searchParams.get('q') || '').trim()
  if (q.length < 2) return NextResponse.json({ users: [] })

  const admin = createServiceRoleClient()

  const { data: me } = await admin
    .from('profiles')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()

  const escaped = q.replace(/[%_,]/g, (m) => `\\${m}`)
  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, email, role, avatar_url')
    .or(`email.ilike.%${escaped}%,full_name.ilike.%${escaped}%`)
    .limit(8)

  if (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }

  const users = (data || []).filter((u) => u.id !== me?.id)
  return NextResponse.json({ users })
}
