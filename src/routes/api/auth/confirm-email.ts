import { createFileRoute } from '@tanstack/react-router'
import { createServiceRoleClient, hasValidServiceRoleKey } from '@/lib/supabase/server'
import { send } from '@/lib/email/resend'
import { ConfirmAccountEmail } from '@/lib/email/templates'
import { checkPublicRateLimit } from '@/lib/rate-limit'
import { json } from '@/lib/api/get-user.server'

function appUrl(request: Request) {
  return (
    process.env['VITE_APP_URL'] ||
    request.headers.get('origin') ||
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

const handlePOST = async ({ request }: any) => {
  try {
    const body = await request.json().catch(() => ({}))
    const email = String(body.email || '')
      .trim()
      .toLowerCase()
    if (!email || !email.includes('@')) {
      return json({ error: 'A valid email is required' }, { status: 400 })
    }

    const limit = await checkPublicRateLimit(email, 'confirm_email', 6, 3600)
    if (!limit.allowed) {
      return json(
        { error: 'Too many confirmation emails. Wait a few minutes and try again.' },
        { status: 429 }
      )
    }

    if (!hasValidServiceRoleKey()) {
      return json(
        { error: 'Confirmation mail is not configured on this server', fallback: 'supabase' },
        { status: 503 }
      )
    }

    const origin = appUrl(request)
    const redirectTo =
      typeof body.redirectTo === 'string' && body.redirectTo.startsWith(origin)
        ? body.redirectTo
        : `${origin}/auth/callback`

    const link = await generateActionLink(email, redirectTo)
    const result = await send(email, 'Confirm your 5Bloc account', ConfirmAccountEmail(email, link))
    if (result.mock || (result.error && !result.data)) {
      return json(
        { error: 'Resend is not sending yet — falling back to Supabase mail', fallback: 'supabase' },
        { status: 503 }
      )
    }

    return json({ ok: true })
  } catch (e) {
    console.error('confirm-email error:', e)
    return json(
      {
        error: e instanceof Error ? e.message : 'Could not send confirmation email',
        fallback: 'supabase',
      },
      { status: 500 }
    )
  }
}

export const Route = createFileRoute('/api/auth/confirm-email')({
  server: {
    handlers: {
      POST: handlePOST,
    },
  },
})
