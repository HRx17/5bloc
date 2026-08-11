/**
 * Smoke role aliases for the /admin login window.
 * Not exposed on public /login.
 */

export const SMOKE_PASSWORD = 'SmokeTest123!'

export const SMOKE_PORTAL_TOKEN =
  'fb732e7a6f69a795f3de513d5e61210b967c89ffed1ec2e9'

type AliasTarget =
  | { kind: 'auth'; email: string; label: string }
  | { kind: 'portal'; path: string; label: string }

const ALIASES: Record<string, AliasTarget> = {
  architect: { kind: 'auth', email: 'smoke.architect@5bloc.test', label: 'Architect' },
  vendor: { kind: 'auth', email: 'smoke.vendor@5bloc.test', label: 'Vendor' },
  contractor: { kind: 'auth', email: 'smoke.vendor@5bloc.test', label: 'Contractor' },
  builder: { kind: 'auth', email: 'smoke.builder@5bloc.test', label: 'Builder' },
  consultant: { kind: 'auth', email: 'smoke.consultant@5bloc.test', label: 'Consultant' },
  orgmember: { kind: 'auth', email: 'smoke.orgmember@5bloc.test', label: 'Org member' },
  client: {
    kind: 'portal',
    path: `/portal/${SMOKE_PORTAL_TOKEN}`,
    label: 'Client portal',
  },
}

export function resolveRoleAliasLogin(raw: string): AliasTarget | null {
  const key = raw.trim().toLowerCase()
  if (!key || key.includes('@')) return null
  return ALIASES[key] ?? null
}

export function adminRoleLoginHint(): string {
  return 'Admin: type architect, vendor, contractor, builder, consultant, orgmember, or client'
}

/** Quick-pick buttons for /admin */
export function adminRoleAliasKeys(): string[] {
  return Object.keys(ALIASES)
}
