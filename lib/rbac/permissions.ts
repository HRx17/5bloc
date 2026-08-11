import type { RoleKey } from './roles'

export type ProjectCaps = {
  can_upload?: boolean
  can_comment?: boolean
  can_approve?: boolean
}

export type PermissionContext = {
  userRole: RoleKey
  memberRole?: RoleKey | null
  caps?: ProjectCaps
  isOrgMember?: boolean
  isProjectMember?: boolean
}

export type Action =
  | 'org.create'
  | 'project.create'
  | 'project.archive'
  | 'crm.manage'
  | 'invoice.manage'
  | 'marketplace.browse'
  | 'tender.create'
  | 'tender.bid'
  | 'document.upload'
  | 'document.approve'
  | 'rfi.create'
  | 'rfi.respond'
  | 'submittal.create'
  | 'submittal.review'
  | 'portal.configure'
  | 'portal.view'
  | 'team.invite'
  | 'ai.use'
  | 'finance.full'
  | 'finance.budget_view'
  | 'messages.whatsapp_logs'
  | 'builder.recommend_vendor'
  | 'consultant.discipline_filter'

const ARCHITECT_ACTIONS: Action[] = [
  'org.create',
  'project.create',
  'project.archive',
  'crm.manage',
  'invoice.manage',
  'marketplace.browse',
  'tender.create',
  'document.upload',
  'document.approve',
  'rfi.create',
  'rfi.respond',
  'submittal.review',
  'portal.configure',
  'team.invite',
  'ai.use',
  'finance.full',
  'messages.whatsapp_logs',
]

const CONTRACTOR_ACTIONS: Action[] = [
  'marketplace.browse',
  'tender.bid',
  'document.upload',
  'rfi.create',
  'rfi.respond',
  'submittal.create',
]

const BUILDER_ACTIONS: Action[] = [
  'document.approve',
  'finance.budget_view',
  'builder.recommend_vendor',
  'marketplace.browse',
]

const CONSULTANT_ACTIONS: Action[] = [
  'document.upload',
  'document.approve',
  'rfi.respond',
  'submittal.review',
  'consultant.discipline_filter',
]

const CLIENT_ACTIONS: Action[] = ['portal.view', 'document.approve']

const ROLE_ACTIONS: Record<RoleKey, Action[]> = {
  architect: ARCHITECT_ACTIONS,
  contractor: CONTRACTOR_ACTIONS,
  builder: BUILDER_ACTIONS,
  consultant: CONSULTANT_ACTIONS,
  client: CLIENT_ACTIONS,
}

/** Effective role inside a project prefers membership role. */
export function effectiveProjectRole(ctx: PermissionContext): RoleKey {
  return ctx.memberRole || ctx.userRole
}

export function can(action: Action, ctx: PermissionContext): boolean {
  const role = effectiveProjectRole(ctx)

  // Capability overrides from project_members
  if (action === 'document.upload' && ctx.caps?.can_upload === false) return false
  if (action === 'rfi.create' && ctx.caps?.can_comment === false) return false
  if (
    (action === 'document.approve' || action === 'submittal.review') &&
    ctx.caps?.can_approve === false &&
    role !== 'architect'
  ) {
    return false
  }

  // Portal configure only for org architects
  if (action === 'portal.configure') {
    return ctx.userRole === 'architect' && (ctx.isOrgMember !== false)
  }

  // Project create / CRM / firm invoices: global architect only
  if (
    action === 'org.create' ||
    action === 'project.create' ||
    action === 'crm.manage' ||
    action === 'invoice.manage' ||
    action === 'ai.use' ||
    action === 'tender.create'
  ) {
    return ctx.userRole === 'architect'
  }

  if (action === 'tender.bid') {
    return ctx.userRole === 'contractor'
  }

  // Project-scoped actions require membership (when context provided)
  const projectScoped: Action[] = [
    'document.upload',
    'document.approve',
    'rfi.create',
    'rfi.respond',
    'submittal.create',
    'submittal.review',
    'team.invite',
    'project.archive',
    'finance.full',
    'finance.budget_view',
    'messages.whatsapp_logs',
  ]
  if (projectScoped.includes(action) && ctx.isProjectMember === false) {
    return false
  }

  return ROLE_ACTIONS[role]?.includes(action) ?? false
}

export type ProjectTabKey =
  | 'overview'
  | 'documents'
  | 'rfis'
  | 'submittals'
  | 'messages'
  | 'meetings'
  | 'issues'
  | 'site'
  | 'permits'
  | 'transmittals'
  | 'invoices'
  | 'team'
  | 'portal'
  | 'settings'

const TABS_BY_ROLE: Record<RoleKey, ProjectTabKey[]> = {
  architect: [
    'overview',
    'documents',
    'rfis',
    'submittals',
    'messages',
    'meetings',
    'issues',
    'site',
    'permits',
    'transmittals',
    'invoices',
    'team',
    'portal',
    'settings',
  ],
  contractor: ['overview', 'documents', 'rfis', 'submittals', 'messages', 'meetings', 'issues', 'site'],
  builder: ['overview', 'documents', 'rfis', 'issues', 'site', 'invoices'],
  consultant: ['overview', 'documents', 'rfis', 'submittals', 'messages', 'issues'],
  client: ['overview', 'documents'],
}

export function projectTabsForRole(role: RoleKey): ProjectTabKey[] {
  return TABS_BY_ROLE[role] ?? TABS_BY_ROLE.architect
}
