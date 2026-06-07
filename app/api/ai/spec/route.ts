import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-user'
import { checkAIRateLimit } from '@/lib/rate-limit'
import { generateSpecClause } from '@/lib/ai/spec'

export async function POST(req: NextRequest) {
  try {
    const { profile } = await getAuthUser()

    // Check rate limit
    const limit = await checkAIRateLimit(
      profile.id, 
      'spec', 
      profile.plan, 
      profile.ai_add_on
    )

    if (!limit.allowed) {
      return NextResponse.json({
        error: 'Daily spec clause generation limit reached',
        remaining: 0,
        upgrade_url: '/settings?tab=billing',
      }, { status: 429 })
    }

    const body = await req.json()
    const result = await generateSpecClause(body.material, body.ctx)

    return NextResponse.json({ data: result, remaining: limit.remaining })
  } catch (e) {
    console.error('AI spec API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
