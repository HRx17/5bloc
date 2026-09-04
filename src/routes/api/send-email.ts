import { createFileRoute } from '@tanstack/react-router'
import { send } from '@/lib/email/resend'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

const handlePOST = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { to, subject, htmlContent } = await request.json()

    if (!to || !subject || !htmlContent) {
      return json(
        { error: 'Missing required parameters: to, subject, or htmlContent' },
        { status: 400 }
      )
    }

    // Only architects / org members can send arbitrary mail via this endpoint
    if (!['architect', 'builder'].includes(String(auth.profile.role))) {
      return json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error, mock } = await send(to, subject, htmlContent)

    if (mock || error) {
      return json(
        {
          error: 'Email is not configured. Set RESEND_API_KEY to send mail.',
          mock: !!mock,
        },
        { status: 503 }
      )
    }

    return json({ success: true, messageId: data?.id })
  } catch (err: any) {
    console.error('API send-email error:', err)
    return json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const Route = createFileRoute('/api/send-email')({
  server: {
    handlers: {
        POST: handlePOST,
    },
  },
})
