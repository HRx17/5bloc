import { createHmac, timingSafeEqual } from 'node:crypto'

function signingSecret(): string | null {
  const secret =
    process.env.PAYMENT_LINK_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  return secret?.trim() || null
}

/** Signed, shareable token for a client invoice pay link. */
export function signInvoicePayToken(invoiceId: string): string | null {
  const secret = signingSecret()
  if (!secret || !invoiceId) return null
  const idPart = Buffer.from(invoiceId, 'utf8').toString('base64url')
  const sig = createHmac('sha256', secret).update(`invoice:${invoiceId}`).digest('base64url')
  return `${idPart}.${sig}`
}

/** Returns the invoice id when the token is valid, otherwise null. */
export function verifyInvoicePayToken(token: string): string | null {
  const secret = signingSecret()
  if (!secret || !token) return null
  const [idPart, sig] = token.split('.')
  if (!idPart || !sig) return null
  let invoiceId = ''
  try {
    invoiceId = Buffer.from(idPart, 'base64url').toString('utf8')
  } catch {
    return null
  }
  if (!invoiceId) return null
  const expected = createHmac('sha256', secret).update(`invoice:${invoiceId}`).digest('base64url')
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  return invoiceId
}

export function canSignInvoicePayLinks(): boolean {
  return !!signingSecret()
}
