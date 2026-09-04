/**
 * Transactional email over the Resend HTTP API.
 *
 * Server-only: reads the API key inside the call. Without a key the send is a
 * no-op that reports back as `mock` so callers can carry on.
 */
export const FROM = process.env['RESEND_FROM_EMAIL'] || '5Bloc <no-reply@5bloc.com>'
export const REPLY = 'contact@5bloc.com'

export type SendResult = {
  data: { id: string } | null
  error: unknown | null
  mock?: boolean
}

export async function send(to: string, subject: string, html: string): Promise<SendResult> {
  const apiKey = process.env['RESEND_API_KEY']
  if (!apiKey) {
    console.warn(`[email not configured] would send to ${to}: ${subject}`)
    return { data: { id: `mock_${Date.now()}` }, error: null, mock: true }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env['RESEND_FROM_EMAIL'] || FROM,
        to: [to],
        reply_to: REPLY,
        subject,
        html,
      }),
    })
    const body: any = await res.json().catch(() => null)
    if (!res.ok) return { data: null, error: body ?? { message: `Resend error ${res.status}` }, mock: false }
    return { data: { id: body?.id ?? '' }, error: null, mock: false }
  } catch (error) {
    return { data: null, error, mock: false }
  }
}
