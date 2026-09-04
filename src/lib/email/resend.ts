import { Resend } from 'resend'

const hasResend = !!process.env.RESEND_API_KEY

export const resend = hasResend ? new Resend(process.env.RESEND_API_KEY!) : null
export const FROM = process.env.RESEND_FROM_EMAIL || '5Bloc <no-reply@5bloc.com>'
export const REPLY = 'contact@5bloc.com'

export type SendResult = {
  data: { id: string } | null
  error: unknown | null
  mock?: boolean
}

export async function send(to: string, subject: string, html: string): Promise<SendResult> {
  if (!resend) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[EMAIL NOT CONFIGURED] Would send to ${to}: ${subject}`)
      return {
        data: { id: `dev_mock_${Date.now()}` },
        error: null,
        mock: true,
      }
    }
    return {
      data: null,
      error: { message: 'RESEND_API_KEY is not configured' },
      mock: false,
    }
  }

  try {
    const result = await resend.emails.send({
      from: FROM,
      replyTo: REPLY,
      to,
      subject,
      html,
    })
    return { data: result.data ? { id: result.data.id } : null, error: result.error }
  } catch (err) {
    console.error('Resend email dispatch error:', err)
    return { data: null, error: err }
  }
}
