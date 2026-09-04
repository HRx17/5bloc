import { isPaywallEnforced } from '@/lib/payments/gates'

/**
 * Usage limits backed by your own Upstash Redis (REST API).
 * Falls back to in-process counters when Upstash is not configured.
 */
const isProduction = process.env['NODE_ENV'] === 'production'

const REST_URL = process.env['UPSTASH_REDIS_REST_URL']?.trim()
const REST_TOKEN = process.env['UPSTASH_REDIS_REST_TOKEN']?.trim()

export const hasRedis = !!(REST_URL && REST_TOKEN)

async function upstash(command: (string | number)[]): Promise<any> {
  const res = await fetch(`${REST_URL!.replace(/\/$/, '')}/${command.map((c) => encodeURIComponent(String(c))).join('/')}`, {
    headers: { Authorization: `Bearer ${REST_TOKEN}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Upstash request failed (${res.status})`)
  }
  const data: any = await res.json()
  if (data?.error) throw new Error(String(data.error))
  return data?.result
}

const LIMITS: Record<string, { free: number; paid: number }> = {
  estimate: { free: 3, paid: Infinity },
  contract_scan: { free: 2, paid: Infinity },
  rera: { free: 0, paid: Infinity },
  rfi_draft: { free: 5, paid: Infinity },
  spec: { free: 10, paid: Infinity },
  building_code: { free: 2, paid: Infinity },
}

type MemEntry = { count: number; resetAt: number }
const memoryStore: Record<string, MemEntry> = {}

function memoryIncr(key: string, windowSec: number): number {
  const now = Date.now()
  const entry = memoryStore[key]
  if (!entry || now >= entry.resetAt) {
    memoryStore[key] = { count: 1, resetAt: now + windowSec * 1000 }
    return 1
  }
  entry.count += 1
  return entry.count
}

function fromMemory(key: string, limit: number, windowSec: number) {
  const count = memoryIncr(key, windowSec)
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) }
}

async function redisIncr(key: string, windowSec: number): Promise<number> {
  const count = Number(await upstash(['incr', key]))
  if (count === 1) await upstash(['expire', key, windowSec])
  return count
}

/**
 * Public / unauthenticated endpoint rate limit.
 * Always enforces (memory fallback when Redis is absent).
 * On Redis errors in production: fail closed.
 */
export async function checkPublicRateLimit(
  key: string,
  bucket: string,
  limit: number,
  windowSec = 86400,
): Promise<{ allowed: boolean; remaining: number }> {
  const redisKey = `public:${bucket}:${key}`

  if (!hasRedis) return fromMemory(redisKey, limit, windowSec)

  try {
    const count = await redisIncr(redisKey, windowSec)
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) }
  } catch (e) {
    console.warn('Upstash Redis public rate-limit error:', e)
    if (isProduction) return { allowed: false, remaining: 0 }
    return fromMemory(redisKey, limit, windowSec)
  }
}

export async function checkAIRateLimit(
  userId: string,
  feature: string,
  plan: string,
  hasAIAddon: boolean,
): Promise<{ allowed: boolean; remaining: number }> {
  if (!isPaywallEnforced()) return { allowed: true, remaining: 9999 }
  const cfg = LIMITS[feature]
  if (!cfg) return { allowed: true, remaining: 9999 }
  const limit = plan !== 'free' || hasAIAddon ? cfg.paid : cfg.free

  if (limit === Infinity) return { allowed: true, remaining: 9999 }
  if (limit === 0) return { allowed: false, remaining: 0 }

  const key = `ai:${feature}:${userId}:${new Date().toDateString()}`
  const windowSec = 86400

  if (!hasRedis) return fromMemory(key, limit, windowSec)

  try {
    const count = await redisIncr(key, windowSec)
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) }
  } catch (e) {
    console.warn('Upstash Redis check error:', e)
    // AI: keep memory fallback (do not fail open)
    return fromMemory(key, limit, windowSec)
  }
}
