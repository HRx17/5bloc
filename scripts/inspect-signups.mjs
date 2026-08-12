// Read-only survey of where real signups landed.
// Usage: node scripts/inspect-signups.mjs
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

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

const TABLES = [
  'profiles',
  'users',
  'contractors',
  'organisations',
  'waitlist',
  'vendor_signups',
  'contractor_signups',
  'vendor_catalog_items',
  'tenders',
  'bids',
  'projects',
]

const counts = {}
for (const t of TABLES) {
  const { count, error } = await db.from(t).select('*', { count: 'exact', head: true })
  counts[t] = error ? `ERR: ${error.message}` : count
}
console.log('=== TABLE COUNTS ===')
console.log(JSON.stringify(counts, null, 2))

const { data: profiles } = await db.from('profiles').select('*')
const byRole = {}
for (const p of profiles || []) byRole[p.role || 'null'] = (byRole[p.role || 'null'] || 0) + 1
console.log('\n=== profiles by role ===')
console.log(JSON.stringify(byRole, null, 2))
console.log(
  (profiles || [])
    .map((p) => `  ${p.role.padEnd(12)} ${(p.full_name || '—').padEnd(24)} ${p.email}  org=${p.org_id || '—'} disc=${p.discipline || '—'} phone=${p.phone || '—'}`)
    .join('\n')
)

const { data: orgs } = await db.from('organisations').select('*')
console.log('\n=== organisations ===')
console.log(JSON.stringify(orgs, null, 2))

const { data: contractors } = await db.from('contractors').select('*')
console.log('\n=== contractors ===')
console.log('columns:', Object.keys(contractors?.[0] || {}).join(', '))
console.log(`total=${contractors?.length}  withUserId=${(contractors || []).filter((c) => c.user_id).length}`)
console.log(
  (contractors || [])
    .map(
      (c) =>
        `  ${c.id} user=${c.user_id || '—'} | ${String(c.company_name).padEnd(34)} | specs=${JSON.stringify(c.specializations)} cities=${JSON.stringify(c.service_cities)} verified=${c.verified} website=${c.website || '—'}`
    )
    .join('\n')
)

for (const t of ['vendor_signups', 'contractor_signups', 'waitlist']) {
  const { data, error } = await db.from(t).select('*')
  console.log(`\n=== ${t} ===`)
  if (error) {
    console.log('ERR', error.message)
    continue
  }
  console.log('columns:', Object.keys(data?.[0] || {}).join(', '))
  console.log(JSON.stringify(data, null, 2))
}
