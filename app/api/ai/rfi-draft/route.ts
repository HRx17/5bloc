import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-user'
import { checkAIRateLimit } from '@/lib/rate-limit'
import { draftRFIResponse } from '@/lib/ai/rfi'

export async function POST(req: NextRequest) {
  try {
    const { profile } = await getAuthUser()

    // Check rate limit
    const limit = await checkAIRateLimit(
      profile.id, 
      'rfi_draft', 
      profile.plan, 
      profile.ai_add_on
    )

    if (!limit.allowed) {
      return NextResponse.json({
        error: 'Daily RFI draft limit reached',
        remaining: 0,
        upgrade_url: '/settings?tab=billing',
      }, { status: 429 })
    }

    const body = await req.json()
    const result = await draftRFIResponse(body.rfi, body.ctx)

    return NextResponse.json({ data: result, remaining: limit.remaining })
  } catch (e) {
    console.error('AI RFI draft API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
