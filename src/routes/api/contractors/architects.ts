import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { createServiceRoleClient, hasValidServiceRoleKey } from '@/lib/supabase/server'
import { isTestAccount, type ArchitectListing } from '@/lib/marketplace/listings'

/**
 * Directory of architects and their firms, assembled from `profiles` + `organisations`.
 *
 * Read with the service role because profile RLS is scoped to your own org — a directory has to
 * see across orgs. Only the fields an architect would expect to be discoverable are returned;
 * personal email and phone are deliberately withheld. Contractors reach architects by bidding on
 * the projects they post, which is why open tender counts are included.
 */
const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const q = (url.searchParams.get('q') || '').toLowerCase()
  const city = url.searchParams.get('city')
  const discipline = url.searchParams.get('discipline')


  const db = createServiceRoleClient()

  const [profileRes, orgRes, tenderRes] = await Promise.all([
    db
      .from('profiles')
      .select('id, full_name, email, phone, avatar_url, role, discipline, org_id, created_at')
      .eq('role', 'architect')
      .order('created_at', { ascending: true }),
    db.from('organisations').select('id, name, type, city, state, address, phone, gst_number, logo_url'),
    db.from('tenders').select('org_id').eq('visibility', 'public').eq('status', 'open'),
  ])

  if (profileRes.error) {
    return json({ error: profileRes.error.message }, { status: 500 })
  }

  const orgs = new Map((orgRes.data || []).map((o: any) => [o.id, o]))
  const openByOrg = new Map<string, number>()
  for (const t of tenderRes.data || []) {
    if (!t.org_id) continue
    openByOrg.set(t.org_id, (openByOrg.get(t.org_id) || 0) + 1)
  }

  let architects: ArchitectListing[] = (profileRes.data || [])
    .filter((p: any) => !isTestAccount(p.email))
    .map((p: any) => {
      const org = p.org_id ? orgs.get(p.org_id) : null
      return {
        id: p.id,
        full_name: p.full_name || null,
        // Withheld from the directory — architects did not list themselves for cold outreach.
        email: null,
        phone: null,
        avatar_url: p.avatar_url || null,
        discipline: p.discipline || null,
        role: p.role,
        created_at: p.created_at || null,
        firm_name: org?.name?.trim() || null,
        firm_type: org?.type || null,
        city: org?.city || null,
        state: org?.state || null,
        address: org?.address || null,
        firm_phone: org?.phone || null,
        gst_number: org?.gst_number || null,
        logo_url: org?.logo_url || null,
        open_tenders: p.org_id ? openByOrg.get(p.org_id) || 0 : 0,
      }
    })

  if (city) architects = architects.filter((a) => a.city === city)
  if (discipline) architects = architects.filter((a) => a.discipline === discipline)
  if (q) {
    architects = architects.filter(
      (a) =>
        (a.full_name || '').toLowerCase().includes(q) ||
        (a.firm_name || '').toLowerCase().includes(q) ||
        (a.city || '').toLowerCase().includes(q) ||
        (a.discipline || '').toLowerCase().includes(q)
    )
  }

  architects.sort(
    (a, b) => b.open_tenders - a.open_tenders || (a.full_name || '').localeCompare(b.full_name || '')
  )

  return json({ architects, count: architects.length })
}

export const Route = createFileRoute('/api/contractors/architects')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})
