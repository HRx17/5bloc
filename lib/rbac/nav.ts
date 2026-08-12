import type { RoleKey } from './roles'
import { projectTabsForRole, type ProjectTabKey } from './permissions'

export type NavItem = {
  name: string
  path: string
  icon: string
  /** Live counter rendered next to the entry, when the shell can supply one. */
  badge?: 'unreadMessages'
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

const MESSAGES: NavItem = { name: 'Messages', path: '/messages', icon: 'chat', badge: 'unreadMessages' }
const DOCUMENTS: NavItem = { name: 'Documents', path: '/documents', icon: 'folder_shared' }
const COORDINATION: NavItem = { name: 'Coordination', path: '/coordination', icon: 'hub' }
const CAD_VIEWER: NavItem = { name: 'CAD Viewer', path: '/cad', icon: 'view_in_ar' }
const MARKETPLACE: NavItem = { name: 'Marketplace', path: '/marketplace', icon: 'storefront' }
const SETTINGS_GROUP: NavGroup = {
  label: 'Account',
  items: [{ name: 'Settings', path: '/settings', icon: 'settings' }],
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
    label: 'Coordinate',
    items: [MESSAGES, COORDINATION, DOCUMENTS],
  },
  {
    label: 'Tools',
    items: [
      MARKETPLACE,
      CAD_VIEWER,
      { name: 'AI Cost Estimator', path: '/ai/estimate', icon: 'auto_awesome' },
      { name: 'AI Contract Scan', path: '/ai/contract-scan', icon: 'gavel' },
      { name: 'Integrations', path: '/integrations', icon: 'extension' },
    ],
  },
  SETTINGS_GROUP,
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
    label: 'Coordinate',
    items: [MESSAGES, COORDINATION, DOCUMENTS],
  },
  {
    label: 'Tools',
    items: [MARKETPLACE, { name: 'My Catalog', path: '/catalog', icon: 'inventory_2' }],
  },
  SETTINGS_GROUP,
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
    label: 'Coordinate',
    items: [MESSAGES, COORDINATION, DOCUMENTS],
  },
  {
    label: 'Tools',
    items: [MARKETPLACE],
  },
  SETTINGS_GROUP,
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
    label: 'Coordinate',
    items: [MESSAGES, COORDINATION, DOCUMENTS],
  },
  {
    label: 'Tools',
    items: [CAD_VIEWER, MARKETPLACE, { name: 'Integrations', path: '/integrations', icon: 'extension' }],
  },
  SETTINGS_GROUP,
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
    label: 'Coordinate',
    items: [MESSAGES],
  },
  SETTINGS_GROUP,
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
