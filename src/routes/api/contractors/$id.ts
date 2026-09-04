import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { toListing, withoutContact } from '@/lib/marketplace/listings'
import { loadSignupIndex } from '@/lib/marketplace/server'

type Ctx = { params: Promise<{ id: string }> }

const handleGET = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  let row: any = null
 else {
    const { data, error } = await auth.supabase.from('contractors').select('*').eq('id', id).maybeSingle()
    if (error) return json({ error: error.message }, { status: 500 })
    if (!data) return json({ error: 'Not found' }, { status: 404 })
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

  return json({
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

export const Route = createFileRoute('/api/contractors/$id')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})
