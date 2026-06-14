import { Resend } from 'resend'

const hasResend = !!process.env.RESEND_API_KEY

export const resend  = hasResend ? new Resend(process.env.RESEND_API_KEY!) : null
const fromEmail = process.env.RESEND_FROM_EMAIL || 'contact@5bloc.com'
export const FROM    = `5Bloc <${fromEmail}>`
export const REPLY   = fromEmail

export async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[MOCK EMAIL SENT] To: ${to} | Subject: ${subject}`);
    // Simulate successful API response
    return { data: { id: 'mock_email_id_' + Date.now() }, error: null }
  }
  
  try {
    return await resend.emails.send({
      from: FROM,
      replyTo: REPLY,
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error('Resend email dispatch error:', err)
    return { data: null, error: err }
  }
}
