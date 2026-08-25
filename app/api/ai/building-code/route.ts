import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-user'
import { checkAIRateLimit } from '@/lib/rate-limit'
import { checkBuildingCode } from '@/lib/ai/building-code'
import { canUse, type Plan } from '@/lib/payments/gates'

function normalizePlan(raw: unknown): Plan {
  const p = String(raw || 'free').toLowerCase()
  if (p === 'solo' || p === 'team' || p === 'free') return p
  return 'free'
}

export async function POST(req: NextRequest) {
  try {
    const { profile } = await getAuthUser()
    const plan = normalizePlan(profile.plan || profile.organisations?.plan)

    if (!canUse(plan, 'ai_estimator', !!profile.ai_add_on)) {
      return NextResponse.json(
        {
          error: 'AI Building Code Checker requires Solo, Team, or the AI add-on.',
          upgrade_url: '/settings?tab=billing',
        },
        { status: 402 }
      )
    }

    const limit = await checkAIRateLimit(profile.id, 'building_code', plan, profile.ai_add_on)
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: 'Daily building-code check limit reached',
          remaining: 0,
          upgrade_url: '/settings?tab=billing',
        },
        { status: 429 }
      )
    }

    const body = await req.json()
    const result = await checkBuildingCode({
      projectType: body.projectType,
      city: body.city,
      state: body.state,
      plotSqm: body.plotSqm ? Number(body.plotSqm) : undefined,
      builtSqft: body.builtSqft ? Number(body.builtSqft) : undefined,
      floors: body.floors ? Number(body.floors) : undefined,
      heightM: body.heightM ? Number(body.heightM) : undefined,
      notes: body.notes,
    })

    return NextResponse.json({ data: result, remaining: limit.remaining })
  } catch (e) {
    console.error('AI building-code API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
