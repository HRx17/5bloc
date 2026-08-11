/** Shared trade / service labels for open bidding marketplace */
export const MARKETPLACE_SERVICES = [
  'Civil',
  'RCC / Structure',
  'MEP',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Facade',
  'Interior',
  'Finishing',
  'Landscaping',
  'Supply / Vendor',
] as const

export type MarketplaceService = (typeof MARKETPLACE_SERVICES)[number]
