import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_CONTRACTORS } from '@/lib/data/mock-store'
import { toListing, withoutContact, type ListingType, type MarketplaceListing } from '@/lib/marketplace/listings'
import { loadSignupIndex } from '@/lib/marketplace/server'

function matchesQuery(listing: MarketplaceListing, q: string) {
  if (!q) return true
  return (
    listing.company_name.toLowerCase().includes(q) ||
    (listing.bio || '').toLowerCase().includes(q) ||
    listing.tags.some((t) => t.toLowerCase().includes(q)) ||
    (listing.city || '').toLowerCase().includes(q)
  )
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').toLowerCase()
  const city = url.searchParams.get('city')
  const spec = url.searchParams.get('spec')
  const verified = url.searchParams.get('verified')
  const mine = url.searchParams.get('mine') === '1'
  const typeParam = url.searchParams.get('type')
  const type: ListingType | null = typeParam === 'vendor' || typeParam === 'contractor' ? typeParam : null

  const auth = await getAuthUserOrNull()
  // Marketplace browse is public to authenticated users
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let rows: any[]

  if (shouldServeMockData(auth)) {
    rows = [...MOCK_CONTRACTORS]
    if (mine) rows = rows.filter((c) => c.user_id === auth.profile.id)
  } else {
    if (!hasSupabaseEnv() || !auth.supabase) {
      return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
    }
    let query = auth.supabase.from('contractors').select('*')
    if (mine) query = query.eq('user_id', auth.profile.id)
    if (verified === '1') query = query.eq('verified', true)
    const { data, error } = await query.order('rating', { ascending: false }).limit(500)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    rows = data || []
  }

  const index = shouldServeMockData(auth) ? undefined : await loadSignupIndex(auth.supabase)
  // Architects are the ones who invite a business into a project, so only they get the contact channel.
  const canSeeContact = auth.profile.role === 'architect' || mine

  let listings = rows.map((row) => {
    const listing = toListing(row, index)
    return canSeeContact ? listing : withoutContact(listing)
  })

  if (type) listings = listings.filter((l) => l.listing_type === type)
  if (verified === '1') listings = listings.filter((l) => l.verified)
  if (city) listings = listings.filter((l) => l.service_cities.includes(city) || l.city === city)
  if (spec) listings = listings.filter((l) => l.tags.includes(spec))
  listings = listings.filter((l) => matchesQuery(l, q))

  listings.sort(
    (a, b) => Number(b.verified) - Number(a.verified) || b.rating - a.rating || a.company_name.localeCompare(b.company_name)
  )

  // `contractors` stays for callers that predate the vendor split.
  return NextResponse.json({ contractors: listings, listings, count: listings.length })
}

export async function POST(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'contractor') {
    return NextResponse.json({ error: 'Only contractors create vendor profiles' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.company_name) {
    return NextResponse.json({ error: 'company_name required' }, { status: 400 })
  }

  if (shouldServeMockData(auth)) {
    const existing = MOCK_CONTRACTORS.find((c) => c.user_id === auth.profile.id)
    if (existing) {
      Object.assign(existing, body)
      return NextResponse.json({ contractor: existing })
    }
    const contractor = {
      id: `ctr-${Date.now()}`,
      user_id: auth.profile.id,
      company_name: body.company_name,
      bio: body.bio || '',
      specializations: body.specializations || [],
      service_cities: body.service_cities || [],
      service_states: body.service_states || [],
      team_size: body.team_size || null,
      years_experience: body.years_experience || null,
      verified: false,
      badge_active: false,
      rating: 0,
      reviews_count: 0,
      jobs_completed: 0,
      gst_number: body.gst_number || null,
      portfolio_photos: [],
    }
    MOCK_CONTRACTORS.unshift(contractor as any)
    return NextResponse.json({ contractor }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const { data, error } = await auth.supabase
    .from('contractors')
    .upsert(
      {
        user_id: auth.profile.id,
        company_name: body.company_name,
        bio: body.bio,
        specializations: body.specializations || [],
        service_cities: body.service_cities || [],
        service_states: body.service_states || [],
        team_size: body.team_size,
        years_experience: body.years_experience,
        website: body.website,
        gst_number: body.gst_number,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contractor: data }, { status: 201 })
}
