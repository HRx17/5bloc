import { Redis } from '@upstash/redis'

const hasRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
)

export const redis = hasRedis
  ? new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

const LIMITS: Record<string, { free: number; paid: number }> = {
  estimate:  { free: 3,  paid: Infinity },
  rera:      { free: 0,  paid: Infinity },  // paid/add-on only
  rfi_draft: { free: 5,  paid: Infinity },
  spec:      { free: 10, paid: Infinity },
}

// In-memory rate limiting cache fallback for local development
const memoryCache: Record<string, number> = {}

export async function checkAIRateLimit(
  userId: string,
  feature: string,
  plan: string,
  hasAIAddon: boolean
): Promise<{ allowed: boolean; remaining: number }> {
  const cfg   = LIMITS[feature]
  const limit = (plan !== 'free' || hasAIAddon) ? cfg.paid : cfg.free

  if (limit === Infinity) return { allowed: true, remaining: 9999 }
  if (limit === 0)        return { allowed: false, remaining: 0 }

  const key   = `ai:${feature}:${userId}:${new Date().toDateString()}`

  if (!redis) {
    // Local memory cache rate limiting fallback
    if (memoryCache[key] === undefined) {
      memoryCache[key] = 0
    }
    memoryCache[key]++
    const count = memoryCache[key]
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) }
  }

  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, 86400) // 1 day expire
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) }
  } catch (e) {
    console.warn('Upstash Redis check error:', e)
    // Fall back to allow request in case of redis connection problems
    return { allowed: true, remaining: 1 }
  }
}
