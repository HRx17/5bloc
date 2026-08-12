import type { RoleKey } from './roles'
import { projectTabsForRole, type ProjectTabKey } from './permissions'

export type NavItem = {
  name: string
  path: string
  icon: string
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

const ARCHITECT_NAV: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      { name: 'Projects', path: '/projects', icon: 'space_dashboard' },
      { name: 'Clients', path: '/clients', icon: 'contacts' },
      { name: 'Invoices', path: '/invoices', icon: 'receipt_long' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { name: 'Marketplace', path: '/marketplace', icon: 'storefront' },
      { name: 'AI Cost Estimator', path: '/ai/estimate', icon: 'auto_awesome' },
      { name: 'AI Contract Scan', path: '/ai/contract-scan', icon: 'gavel' },
      { name: 'Integrations', path: '/integrations', icon: 'extension' },
    ],
  },
  {
    label: 'Account',
    items: [{ name: 'Settings', path: '/settings', icon: 'settings' }],
  },
]

const CONTRACTOR_NAV: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { name: 'Dashboard', path: '/contractor', icon: 'dashboard' },
      { name: 'My Bids', path: '/contractor/bids', icon: 'gavel' },
      { name: 'Projects', path: '/projects', icon: 'space_dashboard' },
      { name: 'Profile', path: '/contractor/profile', icon: 'badge' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { name: 'Marketplace', path: '/marketplace', icon: 'storefront' },
    ],
  },
  {
    label: 'Account',
    items: [{ name: 'Settings', path: '/settings', icon: 'settings' }],
  },
]

const BUILDER_NAV: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { name: 'Portfolio', path: '/builder', icon: 'apartment' },
      { name: 'Approvals', path: '/builder/approvals', icon: 'fact_check' },
      { name: 'Projects', path: '/projects', icon: 'space_dashboard' },
    ],
  },
  {
    label: 'Account',
    items: [{ name: 'Settings', path: '/settings', icon: 'settings' }],
  },
]

const CONSULTANT_NAV: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { name: 'Dashboard', path: '/consultant', icon: 'engineering' },
      { name: 'Projects', path: '/projects', icon: 'space_dashboard' },
    ],
  },
  {
    label: 'Account',
    items: [{ name: 'Settings', path: '/settings', icon: 'settings' }],
  },
]

const CLIENT_NAV: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { name: 'Home', path: '/client', icon: 'home' },
      { name: 'Projects', path: '/projects', icon: 'space_dashboard' },
    ],
  },
  {
    label: 'Account',
    items: [{ name: 'Settings', path: '/settings', icon: 'settings' }],
  },
]

const NAV_BY_ROLE: Record<RoleKey, NavGroup[]> = {
  architect: ARCHITECT_NAV,
  contractor: CONTRACTOR_NAV,
  builder: BUILDER_NAV,
  consultant: CONSULTANT_NAV,
  client: CLIENT_NAV,
}

export function getNavForRole(role: RoleKey | string | null | undefined): NavGroup[] {
  if (role && role in NAV_BY_ROLE) return NAV_BY_ROLE[role as RoleKey]
  return ARCHITECT_NAV
}

export const PROJECT_TAB_META: Record<
  ProjectTabKey,
  { name: string; suffix: string }
> = {
  overview: { name: 'Overview', suffix: '' },
  documents: { name: 'Documents', suffix: '/documents' },
  rfis: { name: 'RFIs', suffix: '/rfis' },
  submittals: { name: 'Submittals', suffix: '/submittals' },
  messages: { name: 'Messages', suffix: '/messages' },
  meetings: { name: 'Meetings', suffix: '/meetings' },
  issues: { name: 'Issues', suffix: '/issues' },
  site: { name: 'Site', suffix: '/site' },
  permits: { name: 'Permits', suffix: '/permits' },
  transmittals: { name: 'Transmittals', suffix: '/transmittals' },
  invoices: { name: 'Invoices', suffix: '/invoices' },
  team: { name: 'Team', suffix: '/team' },
  portal: { name: 'Client Portal', suffix: '/portal' },
  settings: { name: 'Settings', suffix: '/settings' },
}

export function getProjectTabs(
  projectId: string,
  role: RoleKey | string | null | undefined
) {
  const key = (role && role in NAV_BY_ROLE ? role : 'architect') as RoleKey
  return projectTabsForRole(key).map((tab) => ({
    key: tab,
    name: PROJECT_TAB_META[tab].name,
    path: `/projects/${projectId}${PROJECT_TAB_META[tab].suffix}`,
  }))
}
