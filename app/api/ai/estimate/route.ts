import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-user'
import { checkAIRateLimit } from '@/lib/rate-limit'
import { generateEstimate } from '@/lib/ai/estimator'

export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await getAuthUser()

    // Check rate limit
    const limit = await checkAIRateLimit(
      profile.id, 
      'estimate', 
      profile.plan, 
      profile.ai_add_on
    )

    if (!limit.allowed) {
      return NextResponse.json({
        error: 'Daily estimate limit reached',
        remaining: 0,
        upgrade_url: '/settings?tab=billing',
      }, { status: 429 })
    }

    const body = await req.json()
    const result = await generateEstimate(body)

    // Store every estimate for future accuracy tracking (fire-and-forget)
    if (supabase) {
      ;(supabase as any).from('ai_estimates').insert({
        org_id:          profile.org_id,
        user_id:         profile.id,
        project_id:      body.projectId || null,
        project_type:    body.projectType,
        city:            body.city,
        total_sqft:      body.sqft,
        floors:          body.floors,
        spec_level:      body.specLevel,
        estimated_total: result.total_estimate,
        breakdown:       result.line_items,
      }).then(({ error }: { error: any }) => {
        if (error) console.error('Error logging AI estimate to DB:', error)
      })
    }

    return NextResponse.json({ data: result, remaining: limit.remaining })
  } catch (e) {
    console.error('AI estimate API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
