export type UserRole = 'architect' | 'client' | 'contractor' | 'vendor' | 'consultant'

export interface RoleConfig {
  id: UserRole
  label: string
  tagline: string
  icon: string
  color: string
  signupDesc: string
  onboardingTitle: string
  orgLabel: string
  orgPlaceholder: string
}

export const USER_ROLES: RoleConfig[] = [
  {
    id: 'architect',
    label: 'Architect',
    tagline: 'Design & manage projects',
    icon: 'architecture',
    color: 'var(--amber)',
    signupDesc: 'Run your firm, manage drawings, RFIs, invoices and client coordination.',
    onboardingTitle: 'Set up your architecture firm',
    orgLabel: 'Firm name',
    orgPlaceholder: 'e.g. Apex Design Architects',
  },
  {
    id: 'client',
    label: 'Client / Homeowner',
    tagline: 'Hire & track your project',
    icon: 'home_work',
    color: 'var(--blue)',
    signupDesc: 'Follow your home or commercial build, approve drawings and stay in the loop.',
    onboardingTitle: 'Tell us about your project',
    orgLabel: 'Project / company name',
    orgPlaceholder: 'e.g. Shah Residence',
  },
  {
    id: 'contractor',
    label: 'Contractor',
    tagline: 'Execute on site',
    icon: 'construction',
    color: 'var(--success)',
    signupDesc: 'Access site docs, RFIs, submittals and coordinate with the design team.',
    onboardingTitle: 'Set up your contracting business',
    orgLabel: 'Company name',
    orgPlaceholder: 'e.g. BuildRight Contractors',
  },
  {
    id: 'vendor',
    label: 'Vendor / Supplier',
    tagline: 'Supply materials & specs',
    icon: 'inventory_2',
    color: 'var(--purple)',
    signupDesc: 'Share catalogues, respond to RFQs and deliver on project schedules.',
    onboardingTitle: 'Set up your vendor profile',
    orgLabel: 'Business name',
    orgPlaceholder: 'e.g. SteelCraft Supplies',
  },
  {
    id: 'consultant',
    label: 'Consultant',
    tagline: 'Specialist advisory',
    icon: 'engineering',
    color: 'var(--blue-lt)',
    signupDesc: 'Collaborate on structural, MEP, landscape and specialist reviews.',
    onboardingTitle: 'Set up your consultancy',
    orgLabel: 'Consultancy name',
    orgPlaceholder: 'e.g. Structura Engineers',
  },
]

export function getRoleConfig(role: string | undefined | null): RoleConfig {
  return USER_ROLES.find((r) => r.id === role) ?? USER_ROLES[0]
}

/** Sidebar nav paths allowed per role */
export const ROLE_NAV: Record<UserRole, string[]> = {
  architect: ['*'],
  client: [
    '/dashboard', '/projects', '/coordination', '/messages', '/documents', '/cad',
    '/projects/new', '/settings',
  ],
  contractor: [
    '/dashboard', '/projects', '/coordination', '/messages', '/documents', '/cad',
    '/marketplace', '/settings',
  ],
  vendor: [
    '/dashboard', '/projects', '/coordination', '/messages', '/documents',
    '/marketplace', '/settings',
  ],
  consultant: [
    '/dashboard', '/projects', '/coordination', '/messages', '/documents', '/cad',
    '/marketplace', '/ai/estimate', '/settings',
  ],
}

export function canAccessNav(role: string | undefined | null, path: string): boolean {
  const r = (role ?? 'architect') as UserRole
  const allowed = ROLE_NAV[r] ?? ROLE_NAV.architect
  if (allowed.includes('*')) return true
  return allowed.some((p) => path === p || path.startsWith(p + '/'))
}

export function roleLabel(role: string | undefined | null): string {
  return getRoleConfig(role).label
}
