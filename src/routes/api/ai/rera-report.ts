import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { checkAIRateLimit } from '@/lib/rate-limit'
import { generateReraReport } from '@/lib/ai/rera'

const handlePOST = async ({ request }: any) => {
  try {
    const auth = await getAuthUserOrNull(request)
    if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
    const { profile } = auth

    // Check rate limit
    const limit = await checkAIRateLimit(
      profile.id, 
      'rera', 
      profile.plan, 
      !!profile.ai_add_on
    )

    if (!limit.allowed) {
      return json({
        error: 'RERA report generator requires an active solo/team plan or AI add-on.',
        remaining: 0,
        upgrade_url: '/settings?tab=billing',
      }, { status: 429 })
    }

    const body = await request.json()
    const result = await generateReraReport(body.project, body.milestones, profile.organisations || {})

    return json({ data: result, remaining: limit.remaining })
  } catch (e) {
    console.error('AI RERA report API error:', e)
    return json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const Route = createFileRoute('/api/ai/rera-report')({
  server: {
    handlers: {
        POST: handlePOST,
    },
  },
})
