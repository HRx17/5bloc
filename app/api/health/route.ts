import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { createClient } from '@supabase/supabase-js'
import { hasValidServiceRoleKey } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type CheckStatus = 'up' | 'down' | 'skipped'

async function checkSupabase(): Promise<CheckStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) return 'down'

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/health`, {
      headers: { apikey: key },
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (res.ok) return 'up'

    // Fallback: lightweight anon query against a public-facing table
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error } = await supabase.from('organisations').select('id').limit(1)
    return error ? 'down' : 'up'
  } catch {
    clearTimeout(timer)
    return 'down'
  }
}

async function checkStorage(): Promise<CheckStatus> {
  if (!hasValidServiceRoleKey()) return 'skipped'
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim()

  try {
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data, error } = await supabase.storage.getBucket('documents')
    if (error || !data) return 'down'
    return 'up'
  } catch {
    return 'down'
  }
}

async function checkRedis(): Promise<CheckStatus> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!redisUrl || !redisToken) return 'skipped'

  try {
    const redis = new Redis({ url: redisUrl, token: redisToken })
    const pong = await redis.ping()
    return pong === 'PONG' ? 'up' : 'down'
  } catch {
    return 'down'
  }
}

export async function GET() {
  const [supabase, storage, redis] = await Promise.all([
    checkSupabase(),
    checkStorage(),
    checkRedis(),
  ])

  const ok = supabase === 'up'
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    process.env.npm_package_version ||
    undefined

  return NextResponse.json(
    {
      ok,
      checks: { supabase, storage, redis },
      ...(version ? { version } : {}),
    },
    { status: ok ? 200 : 503 }
  )
}
