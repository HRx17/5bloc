/**
 * Cover photos for marketplace cards.
 * Real portfolio / avatar / logo URLs win. Seed paths like `/images/contractors/…`
 * were never shipped as files, so those fall through to a curated architectural set
 * keyed by trade so neighbouring cards do not look identical.
 */

const U = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&h=750&q=80`

const CIVIL = [
  U('photo-1541888946425-d81bb19240f5'),
  U('photo-1504307651254-35680f356dfd'),
  U('photo-1487958449943-2429e8be8624'),
  U('photo-1503387762-592deb58ef4e'),
  U('photo-1486406146926-c627a92ad1ab'),
  U('photo-1511818966892-d7d671e672a2'),
]

const INTERIOR = [
  U('photo-1618221195710-dd6b41faaea6'),
  U('photo-1600210492486-724fe5c67fb0'),
  U('photo-1600607687939-ce8a6c25118c'),
  U('photo-1616486338812-3dadae4b4ace'),
  U('photo-1600585154340-be6161a56a0c'),
]

const MEP = [
  U('photo-1581094794475-ff3e4aa76d68'),
  U('photo-1581092918056-0c4c3acd3789'),
  U('photo-1504328345606-18bbc8c9d7d1'),
  U('photo-1581092160562-40aa08e78837'),
]

const FACADE = [
  U('photo-1486325212027-8081e485255e'),
  U('photo-1479839672679-a46483c0e7c8'),
  U('photo-1448630360428-65456885c650'),
  U('photo-1464146072230-91cabc968266'),
]

const LANDSCAPE = [
  U('photo-1558904541-efa843a96f01'),
  U('photo-1416879595882-3373a0480b5b'),
  U('photo-1585320806297-9794b3e4eeae'),
  U('photo-1466692476866-aef1dfb1e735'),
]

const VENDOR = [
  U('photo-1558618666-fcd25c85cd64'),
  U('photo-1581092160562-40aa08e78837'),
  U('photo-1504328345606-18bbc8c9d7d1'),
  U('photo-1565793298595-6a879b1d9492'),
]

const ARCHITECT = [
  U('photo-1497366216548-37526070297c'),
  U('photo-1497366811353-6870744d04b2'),
  U('photo-1600607687644-c7171b42498b'),
  U('photo-1487958449943-2429e8be8624'),
  U('photo-1503387762-592deb58ef4e'),
]

const PROJECT = [
  U('photo-1541888946425-d81bb19240f5'),
  U('photo-1503387762-592deb58ef4e'),
  U('photo-1486406146926-c627a92ad1ab'),
  U('photo-1511818966892-d7d671e672a2'),
  U('photo-1487958449943-2429e8be8624'),
  U('photo-1504307651254-35680f356dfd'),
]

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

function pick(pool: string[], id: string) {
  return pool[hashId(id) % pool.length]
}

export function isUsablePhotoUrl(url?: string | null): boolean {
  if (!url || !url.trim()) return false
  const value = url.trim()
  if (value.startsWith('/images/contractors/')) return false
  return (
    value.startsWith('https://') ||
    value.startsWith('http://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('/')
  )
}

function firstUsable(urls?: (string | null | undefined)[]): string | null {
  for (const url of urls || []) {
    if (isUsablePhotoUrl(url)) return url!.trim()
  }
  return null
}

function poolForTags(tags: string[]): string[] {
  const hay = tags.join(' ').toLowerCase()
  if (/(interior|woodwork|cabinetry|furniture)/.test(hay)) return INTERIOR
  if (/(mep|electrical|hvac|plumb)/.test(hay)) return MEP
  if (/(facade|glass|glaz)/.test(hay)) return FACADE
  if (/(landscape|garden|turf)/.test(hay)) return LANDSCAPE
  if (/(vendor|supply|material|steel|tile|sanitary)/.test(hay)) return VENDOR
  return CIVIL
}

export function listingCover(listing: {
  id: string
  listing_type?: string
  tags?: string[]
  portfolio_photos?: string[]
}): string {
  const own = firstUsable(listing.portfolio_photos)
  if (own) return own
  const tags = listing.tags || []
  const pool = listing.listing_type === 'vendor' ? VENDOR : poolForTags(tags)
  return pick(pool, listing.id)
}

export function architectCover(architect: {
  id: string
  avatar_url?: string | null
  logo_url?: string | null
}): { cover: string; portrait: string | null } {
  const portrait = firstUsable([architect.avatar_url, architect.logo_url])
  return { cover: pick(ARCHITECT, architect.id), portrait }
}

export function tenderCover(tender: {
  id: string
  services?: string[]
  trade_type?: string | null
}): string {
  const tags = Array.isArray(tender.services) && tender.services.length
    ? tender.services
    : tender.trade_type
      ? [tender.trade_type]
      : []
  const pool = tags.length ? poolForTags(tags) : PROJECT
  return pick(pool.length ? pool : PROJECT, tender.id)
}

export function initialsOf(name?: string | null): string {
  const parts = (name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return '5B'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
