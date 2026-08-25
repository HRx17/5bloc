import { NextResponse } from 'next/server'
import { createServiceRoleClient, hasValidServiceRoleKey } from '@/lib/supabase/server'
import { send } from '@/lib/email/resend'
import { ConfirmAccountEmail } from '@/lib/email/templates'
import { checkPublicRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

function appUrl(req: Request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    req.headers.get('origin') ||
    'https://app.5bloc.com'
  ).replace(/\/$/, '')
}

async function generateActionLink(email: string, redirectTo: string) {
  const admin = createServiceRoleClient()
  const magic = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })
  if (magic.data?.properties?.action_link) return magic.data.properties.action_link

  const invite = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo },
  })
  if (invite.data?.properties?.action_link) return invite.data.properties.action_link

  throw new Error(magic.error?.message || invite.error?.message || 'Could not create a confirmation link')
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '')
      .trim()
      .toLowerCase()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }

    const limit = await checkPublicRateLimit(email, 'confirm_email', 6, 3600)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many confirmation emails. Wait a few minutes and try again.' },
        { status: 429 }
      )
    }

    if (!hasValidServiceRoleKey()) {
      return NextResponse.json(
        { error: 'Confirmation mail is not configured on this server', fallback: 'supabase' },
        { status: 503 }
      )
    }

    const origin = appUrl(req)
    const redirectTo =
      typeof body.redirectTo === 'string' && body.redirectTo.startsWith(origin)
        ? body.redirectTo
        : `${origin}/api/auth/callback`

    const link = await generateActionLink(email, redirectTo)
    const result = await send(email, 'Confirm your 5Bloc account', ConfirmAccountEmail(email, link))
    if (result.mock || (result.error && !result.data)) {
      return NextResponse.json(
        { error: 'Resend is not sending yet — falling back to Supabase mail', fallback: 'supabase' },
        { status: 503 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('confirm-email error:', e)
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : 'Could not send confirmation email',
        fallback: 'supabase',
      },
      { status: 500 }
    )
  }
}
