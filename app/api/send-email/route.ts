import { NextResponse } from 'next/server'
import { send } from '@/lib/email/resend'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'

export async function POST(request: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { to, subject, htmlContent } = await request.json()

    if (!to || !subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Missing required parameters: to, subject, or htmlContent' },
        { status: 400 }
      )
    }

    // Only architects / org members can send arbitrary mail via this endpoint
    if (!['architect', 'builder'].includes(String(auth.profile.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error, mock } = await send(to, subject, htmlContent)

    if (mock || error) {
      return NextResponse.json(
        {
          error: 'Email is not configured. Set RESEND_API_KEY to send mail.',
          mock: !!mock,
        },
        { status: 503 }
      )
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (err: any) {
    console.error('API send-email error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
