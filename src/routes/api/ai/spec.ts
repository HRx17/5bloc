import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { checkAIRateLimit } from '@/lib/rate-limit'
import { generateSpecClause } from '@/lib/ai/spec'

const handlePOST = async ({ request }: any) => {
  try {
    const auth = await getAuthUserOrNull(request)
    if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
    const { profile } = auth

    // Check rate limit
    const limit = await checkAIRateLimit(
      profile.id, 
      'spec', 
      profile.plan, 
      !!profile.ai_add_on
    )

    if (!limit.allowed) {
      return json({
        error: 'Daily spec clause generation limit reached',
        remaining: 0,
        upgrade_url: '/settings?tab=billing',
      }, { status: 429 })
    }

    const body = await request.json()
    const result = await generateSpecClause(body.material, body.ctx)

    return json({ data: result, remaining: limit.remaining })
  } catch (e) {
    console.error('AI spec API error:', e)
    return json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const Route = createFileRoute('/api/ai/spec')({
  server: {
    handlers: {
        POST: handlePOST,
    },
  },
})
