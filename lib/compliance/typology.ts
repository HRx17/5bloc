export type ProjectTypology =
  | 'residential'
  | 'commercial'
  | 'institutional'
  | 'industrial'
  | 'mixed'
  | 'interior'
  | 'landscape'

export const TYPOLOGY_OPTIONS: { value: ProjectTypology; label: string }[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'institutional', label: 'Institutional' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'mixed', label: 'Mixed Use' },
  { value: 'interior', label: 'Interior Fit-out' },
  { value: 'landscape', label: 'Landscape' },
]

export function typologyLabel(type?: string | null): string {
  const match = TYPOLOGY_OPTIONS.find((t) => t.value === type)
  return match?.label || 'Residential'
}

export function normalizeTypology(type?: string | null): ProjectTypology {
  const value = (type || '').toLowerCase() as ProjectTypology
  return TYPOLOGY_OPTIONS.some((t) => t.value === value) ? value : 'residential'
}

/**
 * Cost multiplier relative to a residential build of the same area. Commercial and
 * institutional work carries heavier services, higher occupancy loads and stricter
 * finishes; interior fit-outs exclude structure entirely.
 */
export function typologyCostFactor(type?: string | null): number {
  switch (normalizeTypology(type)) {
    case 'commercial': return 1.25
    case 'institutional': return 1.15
    case 'industrial': return 0.85
    case 'mixed': return 1.18
    case 'interior': return 0.55
    case 'landscape': return 0.35
    default: return 1.0
  }
}

/** Typical architect fee band as a percentage of construction cost, by typology. */
export function typologyFeeRange(type?: string | null): { min: number; max: number; typical: number } {
  switch (normalizeTypology(type)) {
    case 'commercial': return { min: 4, max: 7, typical: 5 }
    case 'institutional': return { min: 5, max: 8, typical: 6 }
    case 'industrial': return { min: 3, max: 5, typical: 4 }
    case 'mixed': return { min: 5, max: 8, typical: 6 }
    case 'interior': return { min: 8, max: 15, typical: 10 }
    case 'landscape': return { min: 8, max: 12, typical: 10 }
    default: return { min: 6, max: 10, typical: 8 }
  }
}

export interface PermitDefault {
  approval_name: string
  authority: string
  notes?: string
}

/** Clearances almost every Indian project needs, whatever the typology. */
const COMMON_PERMITS: PermitDefault[] = [
  {
    approval_name: 'Municipal Building Sanction (IOD)',
    authority: 'Local Municipal Corporation',
    notes: 'Intimation of Disapproval — the base sanction before any work starts.',
  },
  {
    approval_name: 'Commencement Certificate (CC)',
    authority: 'Local Municipal Corporation',
    notes: 'Required before mobilising site. Issued after IOD conditions are met.',
  },
  {
    approval_name: 'Final Occupancy Certificate (OC)',
    authority: 'Municipal Commissioner',
    notes: 'Handover blocker — no legal occupation without it.',
  },
]

const TYPOLOGY_PERMITS: Record<ProjectTypology, PermitDefault[]> = {
  residential: [
    { approval_name: 'Fire Department NOC', authority: 'State Fire Services', notes: 'Mandatory above 15m building height.' },
    { approval_name: 'RERA Promoter Registration', authority: 'State RERA', notes: 'Required for 8+ units or plots over 500 sqm.' },
    { approval_name: 'Environmental Clearance', authority: 'SEIAA', notes: 'Triggered above 20,000 sqm built-up area.' },
  ],
  commercial: [
    { approval_name: 'Fire Department NOC (High Occupancy)', authority: 'State Fire Services', notes: 'Stricter refuge area and sprinkler norms than residential.' },
    { approval_name: 'Shops & Establishments Registration', authority: 'State Labour Department', notes: 'Required before commercial operation begins.' },
    { approval_name: 'Parking & Traffic NOC', authority: 'Traffic Police / Planning Authority', notes: 'Commercial parking ratios are assessed separately.' },
    { approval_name: 'Lift & Escalator Licence', authority: 'State Lift Inspectorate', notes: 'Per-installation licence, renewed periodically.' },
    { approval_name: 'Environmental Clearance', authority: 'SEIAA', notes: 'Triggered above 20,000 sqm built-up area.' },
  ],
  institutional: [
    { approval_name: 'Fire Department NOC (Institutional)', authority: 'State Fire Services', notes: 'Assembly and evacuation norms apply for schools and hospitals.' },
    { approval_name: 'Change of Land Use (Institutional)', authority: 'Town Planning Department', notes: 'Institutional plots need explicit land-use sanction.' },
    { approval_name: 'Sector Regulator Approval', authority: 'AICTE / MCI / State Education Board / Health Dept',
      notes: 'Schools, colleges and hospitals need their own regulator sign-off on the layout.' },
    { approval_name: 'Barrier-Free Access Certificate', authority: 'Municipal Corporation', notes: 'Accessibility compliance is enforced for public buildings.' },
    { approval_name: 'Environmental Clearance', authority: 'SEIAA', notes: 'Triggered above 20,000 sqm built-up area.' },
  ],
  industrial: [
    { approval_name: 'Factory Plan Approval', authority: 'Directorate of Industrial Safety & Health', notes: 'Layout approval before construction under the Factories Act.' },
    { approval_name: 'Consent to Establish', authority: 'State Pollution Control Board', notes: 'Needed before construction; Consent to Operate follows.' },
    { approval_name: 'Consent to Operate', authority: 'State Pollution Control Board', notes: 'Required before production starts.' },
    { approval_name: 'Fire Department NOC (Industrial)', authority: 'State Fire Services', notes: 'Hazard category drives the requirement.' },
    { approval_name: 'Hazardous Waste Authorisation', authority: 'State Pollution Control Board', notes: 'Only where hazardous material is stored or generated.' },
  ],
  mixed: [
    { approval_name: 'Fire Department NOC (Mixed Occupancy)', authority: 'State Fire Services', notes: 'Mixed occupancy needs separated escape routes.' },
    { approval_name: 'RERA Promoter Registration', authority: 'State RERA', notes: 'Applies to the residential component.' },
    { approval_name: 'Shops & Establishments Registration', authority: 'State Labour Department', notes: 'Applies to the commercial component.' },
    { approval_name: 'Environmental Clearance', authority: 'SEIAA', notes: 'Triggered above 20,000 sqm built-up area.' },
  ],
  interior: [
    { approval_name: 'Society / Landlord Fit-out NOC', authority: 'Building Society or Landlord', notes: 'Usually the first blocker on a fit-out.' },
    { approval_name: 'Fire Safety Fit-out Clearance', authority: 'State Fire Services', notes: 'Needed when partitions or the sprinkler layout change.' },
    { approval_name: 'Debris Removal Permission', authority: 'Municipal Corporation', notes: 'Some corporations charge a refundable debris deposit.' },
  ],
  landscape: [
    { approval_name: 'Tree Authority Permission', authority: 'Municipal Tree Authority', notes: 'Required for any cutting, pruning or transplanting.' },
    { approval_name: 'Rainwater Harvesting Approval', authority: 'Municipal Corporation', notes: 'Mandatory on most plots above 500 sqm.' },
    { approval_name: 'Water Connection / Borewell Permission', authority: 'Municipal Water Department', notes: 'Irrigation supply needs a sanctioned source.' },
  ],
}

/** Default clearance checklist to seed for a project of this typology. */
export function defaultPermitsFor(type?: string | null): PermitDefault[] {
  const typology = normalizeTypology(type)
  return [...COMMON_PERMITS, ...TYPOLOGY_PERMITS[typology]]
}

/** Indicative bye-law figures shown in the zoning panel. Reference only. */
export function byeLawsFor(type?: string | null): { label: string; value: string }[] {
  const typology = normalizeTypology(type)
  switch (typology) {
    case 'commercial':
      return [
        { label: 'Front Margin Space', value: 'Min 6.0 meters' },
        { label: 'Permissible FSI Limit', value: '2.0 base + paid TDR' },
        { label: 'Parking Requirement', value: '1 bay per 50–75 sqm' },
        { label: 'Maximum Height', value: 'Above 24m needs fire NOC' },
      ]
    case 'institutional':
      return [
        { label: 'Front Margin Space', value: 'Min 6.0 meters' },
        { label: 'Permissible FSI Limit', value: '1.5–2.0 (use specific)' },
        { label: 'Barrier-Free Access', value: 'Mandatory for public use' },
        { label: 'Assembly Egress', value: 'Two escape routes minimum' },
      ]
    case 'industrial':
      return [
        { label: 'Front Margin Space', value: 'Min 9.0 meters' },
        { label: 'Permissible FSI Limit', value: '1.0 typical' },
        { label: 'Green Belt', value: '15–33% of plot area' },
        { label: 'Pollution Consent', value: 'Required before build' },
      ]
    case 'mixed':
      return [
        { label: 'Front Margin Space', value: 'Min 6.0 meters' },
        { label: 'Permissible FSI Limit', value: '1.33–2.0 by component' },
        { label: 'Occupancy Separation', value: 'Separate escape routes' },
        { label: 'Rainwater Harvesting', value: 'Mandatory for >500 sqm' },
      ]
    case 'interior':
      return [
        { label: 'Structural Changes', value: 'No load-bearing alteration' },
        { label: 'Fire Sprinkler Layout', value: 'Re-approval on relayout' },
        { label: 'Working Hours', value: 'Society / municipal limits' },
        { label: 'Debris Disposal', value: 'Authorised site only' },
      ]
    case 'landscape':
      return [
        { label: 'Tree Cover', value: '1 tree per 80 sqm typical' },
        { label: 'Permeable Area', value: 'Min 10–20% of plot' },
        { label: 'Rainwater Harvesting', value: 'Mandatory for >500 sqm' },
        { label: 'Tree Cutting', value: 'Tree Authority permission' },
      ]
    default:
      return [
        { label: 'Front Margin Space', value: 'Min 4.5 meters' },
        { label: 'Permissible FSI Limit', value: '1.33 base + 0.5 paid TDR' },
        { label: 'Maximum Height', value: 'IS 24m fire safety limit' },
        { label: 'Rainwater Harvesting', value: 'Mandatory for >500 sqm' },
      ]
  }
}

/** Bullet-point compliance reminders shown in the quick-check panel. */
export function complianceNotesFor(type?: string | null): string[] {
  const typology = normalizeTypology(type)
  switch (typology) {
    case 'commercial':
      return [
        'Parking count is the most common commercial sanction rejection — verify the bay ratio early',
        'Refuge floors are typically required every 24m of height',
        'Signage and facade projections usually need separate municipal permission',
        'Consent to Operate from the pollution board applies to food and F&B tenants',
      ]
    case 'institutional':
      return [
        'The sector regulator (education board, health department) approves the layout separately from the municipality',
        'Barrier-free access is audited on public buildings — ramps, lifts and toilets',
        'Assembly occupancy needs two independent escape routes',
        'Playground or open-space ratios apply to schools in most states',
      ]
    case 'industrial':
      return [
        'Consent to Establish must precede construction, not follow it',
        'Green belt of 15–33% of plot area is typically enforced',
        'Effluent and hazardous waste handling needs its own authorisation',
        'Factory layout approval is separate from the building sanction',
      ]
    case 'mixed':
      return [
        'Residential and commercial components are assessed under different FSI and parking rules',
        'Occupancy separation walls and independent escape routes are mandatory',
        'RERA applies to the residential component even in a mixed development',
        'Common area cost allocation between components should be documented early',
      ]
    case 'interior':
      return [
        'Society or landlord NOC is usually the first blocker — get it in writing',
        'Any change to the sprinkler or smoke detection layout needs fire re-approval',
        'Confirm working hours and lift usage restrictions before scheduling',
        'Debris must go to an authorised disposal site, often against a deposit',
      ]
    case 'landscape':
      return [
        'Tree cutting, pruning or transplanting all need Tree Authority permission',
        'Permeable surface ratio is checked against the plot area',
        'Irrigation source must be sanctioned — borewells need separate permission',
        'Rainwater harvesting is commonly mandatory above a 500 sqm plot',
      ]
    default:
      return [
        'Front margin: typically ≥ 4.5m under most municipal bye-laws',
        'Base FSI often ~1.33, plus paid TDR where the authority allows it',
        'Height usually capped near 24m without a special fire NOC',
        'Rainwater harvesting commonly mandatory above a ~500 sqm plot',
      ]
  }
}
