export type RoleKey = 'architect' | 'contractor' | 'builder' | 'consultant' | 'client'

export type RoleDef = {
  key: RoleKey
  label: string
  shortLabel: string
  tagline: string
  invitedOnly: boolean
  canSelfRegister: boolean
  createsOrg: boolean
  homePath: string
}

export const ROLES: Record<RoleKey, RoleDef> = {
  architect: {
    key: 'architect',
    label: 'Architect',
    shortLabel: 'Architect',
    tagline: 'Run the office. Lead the design. One workspace.',
    invitedOnly: false,
    canSelfRegister: true,
    createsOrg: true,
    homePath: '/dashboard',
  },
  contractor: {
    key: 'contractor',
    label: 'Contractor / Vendor',
    shortLabel: 'Contractor',
    tagline: 'Win work. Submit cleanly. Get paid faster.',
    invitedOnly: false,
    canSelfRegister: true,
    createsOrg: false,
    homePath: '/contractor',
  },
  builder: {
    key: 'builder',
    label: 'Builder / Developer',
    shortLabel: 'Builder',
    tagline: 'All your projects, all your architects. One feed.',
    invitedOnly: true,
    canSelfRegister: false,
    createsOrg: false,
    homePath: '/builder',
  },
  consultant: {
    key: 'consultant',
    label: 'Consultant',
    shortLabel: 'Consultant',
    tagline: 'Discipline-scoped collaboration without the chaos.',
    invitedOnly: true,
    canSelfRegister: false,
    createsOrg: false,
    homePath: '/consultant',
  },
  client: {
    key: 'client',
    label: 'Client',
    shortLabel: 'Client',
    tagline: 'Know what\'s happening — without learning the software.',
    invitedOnly: true,
    canSelfRegister: false,
    createsOrg: false,
    homePath: '/projects',
  },
}

export const SELF_REGISTER_ROLES: RoleKey[] = ['architect', 'contractor']

export const PROJECT_MEMBER_ROLES: RoleKey[] = [
  'architect',
  'contractor',
  'builder',
  'consultant',
  'client',
]

export function isRoleKey(value: string | null | undefined): value is RoleKey {
  return !!value && value in ROLES
}

export function homeForRole(role: RoleKey | string | null | undefined): string {
  if (isRoleKey(role)) return ROLES[role].homePath
  return '/dashboard'
}
