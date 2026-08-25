export const STUDIO_PROJECT_NAME = '5Bloc Studio'

export const STUDIO_PHASES: Array<{
  phase: string
  label: string
  offsetDays: number
  completion: number
}> = [
  { phase: 'pre_design', label: 'Brand & product brief', offsetDays: 0, completion: 55 },
  { phase: 'schematic_design', label: 'App information architecture', offsetDays: 21, completion: 30 },
  { phase: 'design_development', label: 'Core modules', offsetDays: 56, completion: 15 },
  { phase: 'construction_docs', label: 'Production hardening', offsetDays: 98, completion: 0 },
  { phase: 'bidding', label: 'Partner onboarding', offsetDays: 140, completion: 0 },
  { phase: 'permits', label: 'Compliance & legal', offsetDays: 168, completion: 0 },
  { phase: 'construction_admin', label: 'Public launch', offsetDays: 210, completion: 0 },
]

export function studioDates(from = new Date()) {
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const plus = (days: number) => {
    const d = new Date(start)
    d.setUTCDate(d.getUTCDate() + days)
    return iso(d)
  }
  return {
    start_date: iso(start),
    estimated_end: plus(300),
    phases: STUDIO_PHASES.map((p) => ({
      ...p,
      milestone_date: plus(p.offsetDays),
    })),
  }
}

export function isStudioProjectName(name?: string | null) {
  return (name || '').trim().toLowerCase() === STUDIO_PROJECT_NAME.toLowerCase()
}
