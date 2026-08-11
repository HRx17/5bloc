import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-user'
import { checkAIRateLimit } from '@/lib/rate-limit'
import { generateEstimate } from '@/lib/ai/estimator'
import { canUse, type Plan } from '@/lib/payments/gates'

function normalizePlan(raw: unknown): Plan {
  const p = String(raw || 'free').toLowerCase()
  if (p === 'solo' || p === 'team' || p === 'free') return p
  return 'free'
}

export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await getAuthUser()
    const plan = normalizePlan(profile.plan || profile.organisations?.plan)

    if (!canUse(plan, 'ai_estimator', !!profile.ai_add_on)) {
      return NextResponse.json(
        {
          error: 'AI Cost Estimator requires Solo, Team, or the AI add-on.',
          upgrade_url: '/settings?tab=billing',
        },
        { status: 402 }
      )
    }

    // Check rate limit
    const limit = await checkAIRateLimit(
      profile.id,
      'estimate',
      plan,
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

    // Store every estimate for future accuracy tracking
    if (supabase) {
      supabase
        .from('ai_estimates')
        .insert({
          org_id: profile.org_id,
          profile_id: profile.id,
          user_id: profile.id,
          project_id: body.projectId || null,
          project_type: body.projectType,
          city: body.city,
          total_sqft: body.sqft,
          floors: body.floors,
          spec_level: body.specLevel,
          estimated_total: result.total_estimate,
          breakdown: result.line_items,
          input: body,
          result,
        })
        .then(({ error }: { error: any }) => {
          if (error) console.error('Error logging AI estimate to DB:', error)
        })
    }

    return NextResponse.json({ data: result, remaining: limit.remaining })
  } catch (e) {
    console.error('AI estimate API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
