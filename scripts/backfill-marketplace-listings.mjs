/**
 * Backfill marketplace listings from real signups.
 *
 * Sources (all real data — nothing is invented; missing fields stay null):
 *   contractor_signups  -> contractors listing with listing_type = 'contractor'
 *   vendor_signups      -> contractors listing with listing_type = 'vendor'
 *   profiles (contractor/builder) with no listing -> a stub listing from their own profile
 *
 * Idempotent: matches an existing listing on source_signup_id when the column exists,
 * otherwise on a normalized company name, and only fills fields that are still empty.
 * Safe to re-run as more people sign up.
 *
 * Usage:
 *   node scripts/backfill-marketplace-listings.mjs [--dry-run]
 *
 * Requires NODE_TLS_REJECT_UNAUTHORIZED=0 on networks that intercept TLS.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const DRY_RUN = process.argv.includes('--dry-run')

const env = Object.fromEntries(
  fs
    .readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// Mirrors lib/marketplace/listings.ts — keep the two in sync.
const TEST_EMAIL_SUFFIXES = ['@example.com', '@5bloc.test']
const TEST_SOURCES = ['smoke-test', 'verify']

const isTestSignup = (row) => {
  const email = String(row.email || '').toLowerCase()
  if (TEST_EMAIL_SUFFIXES.some((s) => email.endsWith(s))) return true
  return TEST_SOURCES.includes(String(row.source || '').toLowerCase())
}

const listingKey = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const clean = (v) => {
  if (typeof v !== 'string') return v ?? null
  const t = v.trim()
  return t ? t : null
}

const isEmpty = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)

/** Only trust a numeric team size when the signup gave a plain number, never a band like "2-10". */
const numericTeamSize = (label) => {
  const t = String(label ?? '').trim()
  return /^\d+$/.test(t) ? Number(t) : null
}

async function detectColumns() {
  const optional = [
    'listing_type',
    'supply_categories',
    'contact_name',
    'contact_email',
    'phone',
    'city',
    'state',
    'country',
    'team_size_label',
    'source',
    'source_table',
    'source_signup_id',
  ]
  const present = new Set()
  for (const col of optional) {
    const { error } = await db.from('contractors').select(col).limit(1)
    if (!error) present.add(col)
  }
  return present
}

function buildPayload(signup, type, cols) {
  const tags = (type === 'vendor' ? signup.categories : signup.specializations) || []
  const payload = {
    company_name: signup.business_name,
    bio: clean(signup.bio),
    service_cities: signup.city ? [signup.city] : [],
    service_states: signup.state ? [signup.state] : [],
    years_experience: signup.years_experience ?? null,
    team_size: numericTeamSize(signup.team_size),
    website: clean(signup.website),
    portfolio_photos: Array.isArray(signup.photos) ? signup.photos : [],
  }

  if (type === 'vendor' && cols.has('supply_categories')) {
    payload.supply_categories = tags
    payload.specializations = []
  } else {
    // No dedicated column yet — keep the real categories on the row we do have.
    payload.specializations = tags
  }

  if (cols.has('listing_type')) payload.listing_type = type
  if (cols.has('contact_name')) payload.contact_name = clean(signup.contact_name)
  if (cols.has('contact_email')) payload.contact_email = clean(signup.email)
  if (cols.has('phone')) payload.phone = clean(signup.phone)
  if (cols.has('city')) payload.city = clean(signup.city)
  if (cols.has('state')) payload.state = clean(signup.state)
  if (cols.has('country')) payload.country = clean(signup.country)
  if (cols.has('team_size_label')) payload.team_size_label = clean(signup.team_size)
  if (cols.has('source')) payload.source = clean(signup.source)
  if (cols.has('source_table')) payload.source_table = type === 'vendor' ? 'vendor_signups' : 'contractor_signups'
  if (cols.has('source_signup_id')) payload.source_signup_id = signup.id

  return payload
}

async function main() {
  const cols = await detectColumns()
  console.log(`Optional columns present: ${cols.size ? [...cols].join(', ') : '(none — run migration 20260812090000)'}`)
  if (DRY_RUN) console.log('DRY RUN — no writes\n')

  const [{ data: contractors }, { data: contractorSignups }, { data: vendorSignups }, { data: profiles }] =
    await Promise.all([
      db.from('contractors').select('*'),
      db.from('contractor_signups').select('*').order('created_at'),
      db.from('vendor_signups').select('*').order('created_at'),
      db.from('profiles').select('id, full_name, email, role, phone'),
    ])

  const existing = contractors || []
  const byKey = new Map()
  const bySignupId = new Map()
  for (const row of existing) {
    const key = listingKey(row.company_name)
    if (key && !byKey.has(key)) byKey.set(key, row)
    if (row.source_signup_id) bySignupId.set(row.source_signup_id, row)
  }

  const stats = { created: 0, updated: 0, unchanged: 0, skippedTest: 0, skippedStatus: 0 }
  const report = []

  const upsertFromSignup = async (signup, type) => {
    if (isTestSignup(signup)) {
      stats.skippedTest++
      return
    }
    if (signup.status && !['pending', 'approved', 'active'].includes(signup.status)) {
      stats.skippedStatus++
      return
    }

    const payload = buildPayload(signup, type, cols)
    const current = bySignupId.get(signup.id) || byKey.get(listingKey(signup.business_name)) || null

    if (!current) {
      if (!DRY_RUN) {
        const { data, error } = await db.from('contractors').insert(payload).select('id').single()
        if (error) {
          report.push(`  FAILED insert ${signup.business_name}: ${error.message}`)
          return
        }
        byKey.set(listingKey(signup.business_name), { ...payload, id: data.id })
      }
      stats.created++
      report.push(`  + created ${type.padEnd(10)} ${signup.business_name}`)
      return
    }

    // Only fill blanks so a business that edited its own listing is never overwritten.
    const patch = {}
    for (const [k, v] of Object.entries(payload)) {
      if (isEmpty(v)) continue
      if (k === 'listing_type') {
        if (current.listing_type !== v) patch[k] = v
        continue
      }
      if (isEmpty(current[k])) patch[k] = v
    }
    if (Object.keys(patch).length === 0) {
      stats.unchanged++
      return
    }
    if (!DRY_RUN) {
      const { error } = await db.from('contractors').update(patch).eq('id', current.id)
      if (error) {
        report.push(`  FAILED update ${signup.business_name}: ${error.message}`)
        return
      }
    }
    stats.updated++
    report.push(`  ~ updated ${type.padEnd(10)} ${signup.business_name} [${Object.keys(patch).join(', ')}]`)
  }

  for (const signup of contractorSignups || []) await upsertFromSignup(signup, 'contractor')
  for (const signup of vendorSignups || []) await upsertFromSignup(signup, 'vendor')

  // Signed-in contractors/builders who never filled a listing form still need a card.
  for (const profile of profiles || []) {
    if (!['contractor', 'builder'].includes(profile.role)) continue
    if (TEST_EMAIL_SUFFIXES.some((s) => String(profile.email || '').toLowerCase().endsWith(s))) {
      stats.skippedTest++
      continue
    }
    if (existing.some((c) => c.user_id === profile.id)) continue
    if (!profile.full_name) {
      report.push(`  ! profile ${profile.email} has role ${profile.role} but no name to list under`)
      continue
    }
    const payload = { company_name: profile.full_name, user_id: profile.id, specializations: [], service_cities: [] }
    if (cols.has('listing_type')) payload.listing_type = 'contractor'
    if (cols.has('contact_email')) payload.contact_email = profile.email
    if (cols.has('phone')) payload.phone = profile.phone || null
    if (cols.has('source')) payload.source = 'profile'
    if (!DRY_RUN) {
      const { error } = await db.from('contractors').insert(payload)
      if (error) {
        report.push(`  FAILED insert profile listing ${profile.email}: ${error.message}`)
        continue
      }
    }
    stats.created++
    report.push(`  + created contractor  ${profile.full_name} (from profile)`)
  }

  // Everything already in the table predates the split and is a trade contractor.
  if (cols.has('listing_type')) {
    const { data: untyped } = await db.from('contractors').select('id').is('listing_type', null)
    if (untyped?.length && !DRY_RUN) {
      await db.from('contractors').update({ listing_type: 'contractor' }).is('listing_type', null)
      report.push(`  ~ defaulted ${untyped.length} legacy rows to listing_type=contractor`)
    }
  }

  console.log(report.join('\n') || '  (nothing to do)')
  console.log('\nSummary:', JSON.stringify(stats))

  const gaps = []
  for (const [table, rows] of [
    ['contractor_signups', contractorSignups || []],
    ['vendor_signups', vendorSignups || []],
  ]) {
    for (const r of rows) {
      if (isTestSignup(r)) continue
      const missing = []
      if (!r.phone) missing.push('phone')
      if (!r.email || r.email === 'no@email.com') missing.push('email')
      if (!r.bio) missing.push('bio')
      if (!r.website) missing.push('website')
      if (r.years_experience == null) missing.push('years_experience')
      if (!Array.isArray(r.photos) || r.photos.length === 0) missing.push('photos')
      if (missing.length) gaps.push(`  ${table}: ${r.business_name} — missing ${missing.join(', ')}`)
    }
  }
  console.log('\nReal signups with missing fields (need a human to chase):')
  console.log(gaps.join('\n') || '  (none)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
