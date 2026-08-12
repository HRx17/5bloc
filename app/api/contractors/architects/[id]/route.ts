import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { createServiceRoleClient, hasValidServiceRoleKey } from '@/lib/supabase/server'
import { isTestAccount, type ArchitectListing } from '@/lib/marketplace/listings'

type Ctx = { params: Promise<{ id: string }> }

/** One architect plus their firm and the projects they currently have open for bidding. */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!hasSupabaseEnv() || !hasValidServiceRoleKey()) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const db = createServiceRoleClient()
  const { data: profile, error } = await db
    .from('profiles')
    .select('id, full_name, email, phone, avatar_url, role, discipline, org_id, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!profile || profile.role !== 'architect' || isTestAccount(profile.email)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let org: any = null
  if (profile.org_id) {
    const { data } = await db
      .from('organisations')
      .select('id, name, type, city, state, address, phone, gst_number, logo_url, created_at')
      .eq('id', profile.org_id)
      .maybeSingle()
    org = data
  }

  const { data: tenders } = profile.org_id
    ? await db
        .from('tenders')
        .select('id, title, project_name, city, services, trade_type, budget_min, budget_max, deadline, created_at')
        .eq('org_id', profile.org_id)
        .eq('visibility', 'public')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  const openTenders = tenders || []

  // Only the architect themself sees their own contact details here.
  const isSelf = auth.profile.id === profile.id

  const architect: ArchitectListing = {
    id: profile.id,
    full_name: profile.full_name || null,
    email: isSelf ? profile.email : null,
    phone: isSelf ? profile.phone || null : null,
    avatar_url: profile.avatar_url || null,
    discipline: profile.discipline || null,
    role: profile.role,
    created_at: profile.created_at || null,
    firm_name: org?.name?.trim() || null,
    firm_type: org?.type || null,
    city: org?.city || null,
    state: org?.state || null,
    address: org?.address || null,
    firm_phone: org?.phone || null,
    gst_number: org?.gst_number || null,
    logo_url: org?.logo_url || null,
    open_tenders: openTenders.length,
  }

  return NextResponse.json({
    architect,
    tenders: openTenders.map((t: any) => ({
      ...t,
      services: Array.isArray(t.services) && t.services.length ? t.services : t.trade_type ? [t.trade_type] : [],
    })),
  })
}
