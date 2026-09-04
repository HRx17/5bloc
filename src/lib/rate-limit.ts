import { isPaywallEnforced } from '@/lib/payments/gates'

/**
 * In-memory rate limiting. No external cache service is used in this
 * deployment, so counters live in the server process.
 */
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

export async function checkPublicRateLimit(
  key: string,
  bucket: string,
  limit: number,
  windowSec = 86400,
): Promise<{ allowed: boolean; remaining: number }> {
  return fromMemory(`public:${bucket}:${key}`, limit, windowSec)
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
  return fromMemory(key, limit, 86400)
}
