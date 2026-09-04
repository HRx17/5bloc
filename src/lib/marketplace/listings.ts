/**
 * Marketplace listing model.
 *
 * `contractors` is the single listing table for two different kinds of business:
 *  - contractor: sells services / trades (specializations)
 *  - vendor:     sells supplies / materials (supply categories)
 *
 * The `listing_type` column (migration 20260812090000) is the source of truth. Until that
 * migration is applied everywhere, the type and the contact details are recovered by joining
 * the listing back to the public signup row it came from, so nothing here is ever invented.
 */

export type ListingType = 'contractor' | 'vendor'

export type MarketplaceListing = {
  id: string
  listing_type: ListingType
  company_name: string
  bio: string | null
  /** Trades a contractor performs. */
  specializations: string[]
  /** Material categories a vendor supplies. */
  supply_categories: string[]
  /** Whichever of the two applies to this listing — what cards and filters use. */
  tags: string[]
  service_cities: string[]
  service_states: string[]
  city: string | null
  state: string | null
  country: string | null
  years_experience: number | null
  team_size: number | null
  team_size_label: string | null
  website: string | null
  gst_number: string | null
  verified: boolean
  badge_active: boolean
  rating: number
  reviews_count: number
  jobs_completed: number
  portfolio_photos: string[]
  contact_name: string | null
  contact_email: string | null
  phone: string | null
  source: string | null
  user_id: string | null
  created_at: string | null
}

export type SignupRow = {
  id: string
  business_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  country: string | null
  city: string | null
  state: string | null
  specializations?: string[] | null
  categories?: string[] | null
  team_size: string | null
  years_experience: number | null
  website: string | null
  bio: string | null
  photos?: string[] | null
  status?: string | null
  source?: string | null
  created_at?: string | null
}

/** Addresses used by the automated smoke/verification suites, never by a real person. */
const TEST_EMAIL_SUFFIXES = ['@example.com', '@5bloc.test']
const TEST_SOURCES = ['smoke-test', 'verify']
/** Operators typed this in when a business gave no email. */
const PLACEHOLDER_EMAILS = ['no@email.com', 'na@na.com', 'none@none.com']

export function isTestSignup(row: { email?: string | null; source?: string | null }): boolean {
  const email = (row.email || '').toLowerCase()
  if (TEST_EMAIL_SUFFIXES.some((s) => email.endsWith(s))) return true
  return TEST_SOURCES.includes((row.source || '').toLowerCase())
}

export function isPlaceholderEmail(email?: string | null): boolean {
  return !email || PLACEHOLDER_EMAILS.includes(email.trim().toLowerCase())
}

/** Stable join key for matching a listing to the signup it was created from. */
export function listingKey(name?: string | null): string {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Signup forms accept bare hosts and dashes; only return something linkable. */
export function normalizeWebsite(raw?: string | null): string | null {
  const value = (raw || '').trim()
  if (!value || value === '-' || value === '—' || value.toLowerCase() === 'na') return null
  if (!value.includes('.')) return null
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

function arr(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && !!v.trim()) : []
}

function firstOrNull(list: string[]): string | null {
  return list.length ? list[0] : null
}

export type SignupIndex = {
  byKey: Map<string, { row: SignupRow; type: ListingType }>
  byId: Map<string, { row: SignupRow; type: ListingType }>
}

export function buildSignupIndex(
  contractorSignups: SignupRow[],
  vendorSignups: SignupRow[]
): SignupIndex {
  const byKey = new Map<string, { row: SignupRow; type: ListingType }>()
  const byId = new Map<string, { row: SignupRow; type: ListingType }>()
  const add = (row: SignupRow, type: ListingType) => {
    const entry = { row, type }
    byId.set(row.id, entry)
    const key = listingKey(row.business_name)
    if (key && !byKey.has(key)) byKey.set(key, entry)
  }
  contractorSignups.forEach((r) => add(r, 'contractor'))
  // Vendor signups win a name collision: the vendor path is the more specific signal.
  vendorSignups.forEach((r) => add(r, 'vendor'))
  return { byKey, byId }
}

/** Normalize a `contractors` row into a listing, filling gaps from its signup row. */
export function toListing(row: Record<string, any>, index?: SignupIndex): MarketplaceListing {
  const match =
    (row.source_signup_id && index?.byId.get(row.source_signup_id)) ||
    index?.byKey.get(listingKey(row.company_name)) ||
    null
  const signup = match?.row

  const listingType: ListingType =
    row.listing_type === 'vendor' || row.listing_type === 'contractor'
      ? row.listing_type
      : (match?.type ?? 'contractor')

  const dbSupply = arr(row.supply_categories)
  const dbSpecs = arr(row.specializations)
  const signupTags = arr(signup?.categories) .length ? arr(signup?.categories) : arr(signup?.specializations)

  const supply = listingType === 'vendor' ? (dbSupply.length ? dbSupply : dbSpecs.length ? dbSpecs : signupTags) : dbSupply
  const specializations = listingType === 'vendor' ? [] : dbSpecs.length ? dbSpecs : signupTags

  const cities = arr(row.service_cities)
  const states = arr(row.service_states)
  const contactEmail = row.contact_email || signup?.email || null

  return {
    id: row.id,
    listing_type: listingType,
    company_name: row.company_name || signup?.business_name || 'Unnamed business',
    bio: row.bio || signup?.bio || null,
    specializations,
    supply_categories: supply,
    tags: listingType === 'vendor' ? supply : specializations,
    service_cities: cities.length ? cities : signup?.city ? [signup.city] : [],
    service_states: states.length ? states : signup?.state ? [signup.state] : [],
    city: row.city || firstOrNull(cities) || signup?.city || null,
    state: row.state || firstOrNull(states) || signup?.state || null,
    country: row.country || signup?.country || null,
    years_experience: row.years_experience ?? signup?.years_experience ?? null,
    team_size: typeof row.team_size === 'number' ? row.team_size : null,
    team_size_label: row.team_size_label || signup?.team_size || null,
    website: normalizeWebsite(row.website || signup?.website),
    gst_number: row.gst_number || null,
    verified: !!row.verified,
    badge_active: !!row.badge_active,
    rating: Number(row.rating || 0),
    reviews_count: Number(row.reviews_count || 0),
    jobs_completed: Number(row.jobs_completed || 0),
    portfolio_photos: arr(row.portfolio_photos).length ? arr(row.portfolio_photos) : arr(signup?.photos),
    contact_name: row.contact_name || signup?.contact_name || null,
    contact_email: isPlaceholderEmail(contactEmail) ? null : contactEmail,
    phone: row.phone || signup?.phone || null,
    source: row.source || signup?.source || null,
    user_id: row.user_id || null,
    created_at: row.created_at || null,
  }
}

/** Strip the contact channel from a listing for viewers who should not see it. */
export function withoutContact(listing: MarketplaceListing): MarketplaceListing {
  return { ...listing, contact_email: null, phone: null }
}

export type ArchitectListing = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  discipline: string | null
  role: string
  created_at: string | null
  firm_name: string | null
  firm_type: string | null
  city: string | null
  state: string | null
  address: string | null
  firm_phone: string | null
  gst_number: string | null
  logo_url: string | null
  /** Public projects this architect currently has open for bidding. */
  open_tenders: number
}

export function isTestAccount(email?: string | null): boolean {
  const value = (email || '').toLowerCase()
  return TEST_EMAIL_SUFFIXES.some((s) => value.endsWith(s))
}
