import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
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

const handleGET = async ({ request }: any) => {
  const url = new URL(request.url)
  const q = (url.searchParams.get('q') || '').toLowerCase()
  const city = url.searchParams.get('city')
  const spec = url.searchParams.get('spec')
  const verified = url.searchParams.get('verified')
  const mine = url.searchParams.get('mine') === '1'
  const typeParam = url.searchParams.get('type')
  const type: ListingType | null = typeParam === 'vendor' || typeParam === 'contractor' ? typeParam : null

  const auth = await getAuthUserOrNull(request)
  // Marketplace browse is public to authenticated users
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  let rows: any[]
 else {
    let query = auth.supabase.from('contractors').select('*')
    if (mine) query = query.eq('user_id', auth.profile.id)
    if (verified === '1') query = query.eq('verified', true)
    const { data, error } = await query.order('rating', { ascending: false }).limit(500)
    if (error) return json({ error: error.message }, { status: 500 })
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
  return json({ contractors: listings, listings, count: listings.length })
}

const handlePOST = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'contractor') {
    return json({ error: 'Only contractors create vendor profiles' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.company_name) {
    return json({ error: 'company_name required' }, { status: 400 })
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

  if (error) return json({ error: error.message }, { status: 500 })
  return json({ contractor: data }, { status: 201 })
}

export const Route = createFileRoute('/api/contractors')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
    },
  },
})
