import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getMessagingDb } from '@/lib/messages/server'

export const dynamic = 'force-dynamic'

/**
 * Search registered users by email or name so they can be added to a
 * conversation. Requires auth.
 */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = (req.nextUrl.searchParams.get('q') || '').trim()
  if (q.length < 2) return NextResponse.json({ users: [] })

  const db = getMessagingDb(supabase)
  const escaped = q.replace(/[%_\\]/g, (m) => `\\${m}`)

  const { data: rpcUsers, error: rpcError } = await supabase.rpc('search_messaging_profiles', {
    search_query: escaped,
    result_limit: 10,
  })

  if (!rpcError && rpcUsers) {
    return NextResponse.json({ users: rpcUsers })
  }

  const { data: me } = await db
    .from('profiles')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()

  const { data, error } = await db
    .from('profiles')
    .select('id, full_name, email, role, avatar_url')
    .or(`email.ilike.%${escaped}%,full_name.ilike.%${escaped}%`)
    .limit(10)

  if (error) return NextResponse.json({ error: 'Search failed' }, { status: 500 })

  const users = (data || []).filter((u) => u.id !== me?.id)
  return NextResponse.json({ users })
}
