import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-user'
import { checkAIRateLimit } from '@/lib/rate-limit'
import { generateReraReport } from '@/lib/ai/rera'

export async function POST(req: NextRequest) {
  try {
    const { profile } = await getAuthUser()

    // Check rate limit
    const limit = await checkAIRateLimit(
      profile.id, 
      'rera', 
      profile.plan, 
      profile.ai_add_on
    )

    if (!limit.allowed) {
      return NextResponse.json({
        error: 'RERA report generator requires an active solo/team plan or AI add-on.',
        remaining: 0,
        upgrade_url: '/settings?tab=billing',
      }, { status: 429 })
    }

    const body = await req.json()
    const result = await generateReraReport(body.project, body.milestones, profile.organisations || {})

    return NextResponse.json({ data: result, remaining: limit.remaining })
  } catch (e) {
    console.error('AI RERA report API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
