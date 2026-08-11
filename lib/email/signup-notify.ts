import { send } from '@/lib/email/resend'
import { WelcomeEmail, WaitlistConfirmEmail, PartnerSignupConfirmEmail, SignupTeamNotifyEmail } from '@/lib/email/templates'
import { ROLES, isRoleKey } from '@/lib/rbac/roles'

function roleLabel(role: string | undefined | null): string {
  if (!role) return 'member'
  if (isRoleKey(role)) return ROLES[role].label
  if (role === 'contractor_listing') return 'Contractor listing'
  if (role === 'vendor_listing') return 'Vendor listing'
  return role.replace(/_/g, ' ')
}

const TEAM_INBOX = process.env.SIGNUP_NOTIFY_EMAIL || process.env.RESEND_FROM_EMAIL || 'contact@5bloc.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.5bloc.com'

export type SignupKind = 'app_account' | 'waitlist' | 'contractor_listing' | 'vendor_listing'

function safeSend(to: string, subject: string, html: string) {
  const timeout = new Promise<{ data: null; error: Error; mocked?: boolean }>((resolve) => {
    setTimeout(() => resolve({ data: null, error: new Error('Email send timed out') }), 8000)
  })
  return Promise.race([
    // Dev mock returns { mocked: true, error: null } — never blocks signup
    send(to, subject, html).catch((err) => {
      console.error('Signup email failed:', to, subject, err)
      return { data: null, error: err as Error }
    }),
    timeout,
  ])
}

/** Confirmation to the user + forward copy to the team inbox. Non-blocking for callers that void this. */
export async function notifySignup(opts: {
  kind: SignupKind
  email: string
  name?: string | null
  role?: string | null
  firm?: string | null
  city?: string | null
  country?: string | null
  extras?: string | null
}) {
  if (!opts.email) return

  const name = (opts.name || opts.email.split('@')[0] || 'there').trim()
  const role = opts.role ? roleLabel(opts.role) : opts.kind.replace(/_/g, ' ')
  const dashboardUrl = `${APP_URL.replace(/\/$/, '')}/dashboard`
  const signupUrl = `${APP_URL.replace(/\/$/, '')}/signup${opts.role ? `?role=${encodeURIComponent(opts.role)}` : ''}`

  const userJobs: Promise<unknown>[] = []

  if (opts.kind === 'app_account') {
    userJobs.push(safeSend(opts.email, 'Welcome to 5Bloc', WelcomeEmail(name, role, dashboardUrl)))
  } else if (opts.kind === 'waitlist') {
    userJobs.push(safeSend(opts.email, 'You’re on the 5Bloc waitlist', WaitlistConfirmEmail(name, role, signupUrl)))
  } else {
    const listingType = opts.kind === 'contractor_listing' ? 'contractor' : 'vendor'
    userJobs.push(
      safeSend(
        opts.email,
        `Your ${listingType} listing is registered`,
        PartnerSignupConfirmEmail(name, listingType, opts.firm || 'your business', signupUrl),
      ),
    )
  }

  userJobs.push(
    safeSend(
      TEAM_INBOX,
      `[5Bloc] New ${opts.kind.replace(/_/g, ' ')}: ${opts.email}`,
      SignupTeamNotifyEmail({
        kind: opts.kind,
        name,
        email: opts.email,
        role,
        firm: opts.firm,
        city: opts.city,
        country: opts.country,
        extras: opts.extras,
      }),
    ),
  )

  await Promise.allSettled(userJobs)
}
