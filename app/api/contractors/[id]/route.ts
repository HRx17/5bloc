import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_CONTRACTORS } from '@/lib/data/mock-store'
import { toListing, withoutContact } from '@/lib/marketplace/listings'
import { loadSignupIndex } from '@/lib/marketplace/server'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let row: any = null

  if (shouldServeMockData(auth)) {
    row = MOCK_CONTRACTORS.find((c) => c.id === id) || null
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } else {
    if (!hasSupabaseEnv() || !auth.supabase) {
      return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
    }
    const { data, error } = await auth.supabase.from('contractors').select('*').eq('id', id).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    row = data
  }

  const index = shouldServeMockData(auth) ? undefined : await loadSignupIndex(auth.supabase)
  let listing = toListing(row, index)

  // Architects need a contact address to send a project invitation; the owner sees their own.
  const isOwner = !!listing.user_id && listing.user_id === auth.profile.id
  if (auth.profile.role !== 'architect' && !isOwner) {
    listing = withoutContact(listing)
  }

  // A listing owner who signed in gets the address on their profile rather than the signup one.
  if (auth.profile.role === 'architect' && !listing.contact_email && row.user_id && auth.supabase) {
    const { data: owner } = await auth.supabase.from('profiles').select('email').eq('id', row.user_id).maybeSingle()
    if (owner?.email) listing = { ...listing, contact_email: owner.email }
  }

  let reviews: any[] = []
  if (!shouldServeMockData(auth) && auth.supabase) {
    const { data } = await auth.supabase
      .from('contractor_reviews')
      .select('rating, review_text, created_at')
      .eq('contractor_id', id)
      .order('created_at', { ascending: false })
      .limit(20)
    reviews = data || []
  }

  return NextResponse.json({
    listing,
    // Legacy shape for callers still expecting `contractor`.
    contractor: {
      ...listing,
      portfolio: listing.portfolio_photos.map((url, i) => ({ title: `Project ${i + 1}`, image: url })),
      reviews,
    },
    reviews,
  })
}
