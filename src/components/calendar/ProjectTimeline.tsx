import React, { useMemo } from 'react'
import Link from '@/compat/next-link'

export interface TimelineMilestone {
  id: string
  phase: string
  label?: string | null
  date?: string | null
  completion_pct?: number | null
  fee_amount?: number | null
  fee_paid?: boolean | null
}

export interface TimelineProject {
  id: string
  name: string
  phase?: string | null
  status?: string | null
  start_date?: string | null
  estimated_end?: string | null
  milestones: TimelineMilestone[]
}

const PHASE_ORDER = [
  'pre_design',
  'schematic_design',
  'design_development',
  'construction_docs',
  'bidding',
  'permits',
  'construction_admin',
  'complete',
]

const PHASE_LABELS: Record<string, string> = {
  pre_design: 'Pre-design',
  schematic_design: 'Schematic design',
  design_development: 'Design development',
  construction_docs: 'Construction docs',
  bidding: 'Bidding',
  permits: 'Permits',
  construction_admin: 'Construction',
  complete: 'Complete',
}

const PHASE_COLORS: Record<string, string> = {
  pre_design: '#7AB8FF',
  schematic_design: '#7AB8FF',
  design_development: '#A78BFA',
  construction_docs: '#F5A623',
  bidding: '#F5A623',
  permits: '#F5A623',
  construction_admin: '#2ECC8A',
  complete: '#2ECC8A',
}

const MONTH_WIDTH = 92
const ROW_HEIGHT = 34
const LABEL_WIDTH = 190

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function monthsBetween(from: Date, to: Date) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Fractional month offset from the grid origin, so bars land mid-month accurately. */
function monthOffset(origin: Date, date: Date) {
  const whole = monthsBetween(origin, date)
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  return whole + (date.getDate() - 1) / daysInMonth
}

interface Bar {
  key: string
  phase: string
  label: string
  startOffset: number
  endOffset: number
  completion: number
  date: string | null
}

/**
 * Turn a project's phase milestones into contiguous bars. Each milestone date is
 * a phase *end* date, so a phase runs from the previous milestone (or the project
 * start) up to its own date.
 */
function buildBars(project: TimelineProject, origin: Date): Bar[] {
  const dated = project.milestones
    .map((m) => ({ ...m, parsed: parseDate(m.date) }))
    .filter((m) => m.parsed)
    .sort((a, b) => a.parsed!.getTime() - b.parsed!.getTime())

  const projectStart = parseDate(project.start_date)
  const projectEnd = parseDate(project.estimated_end)

  if (dated.length === 0) {
    if (!projectStart || !projectEnd) return []
    return [
      {
        key: `${project.id}-span`,
        phase: project.phase || 'construction_docs',
        label: PHASE_LABELS[project.phase || ''] || 'Project duration',
        startOffset: monthOffset(origin, projectStart),
        endOffset: monthOffset(origin, projectEnd),
        completion: 0,
        date: project.estimated_end || null,
      },
    ]
  }

  const bars: Bar[] = []
  let cursor = projectStart || dated[0].parsed!
  for (const m of dated) {
    const end = m.parsed!
    const start = cursor < end ? cursor : end
    bars.push({
      key: m.id,
      phase: m.phase,
      label: m.label || PHASE_LABELS[m.phase] || m.phase,
      startOffset: monthOffset(origin, start),
      endOffset: monthOffset(origin, end),
      completion: Number(m.completion_pct || 0),
      date: m.date || null,
    })
    cursor = end
  }
  return bars
}

export default function ProjectTimeline({
  projects,
  loading,
}: {
  projects: TimelineProject[]
  loading?: boolean
}) {
  const { origin, monthCount, months } = useMemo(() => {
    const dates: Date[] = [new Date()]
    for (const p of projects) {
      const s = parseDate(p.start_date)
      const e = parseDate(p.estimated_end)
      if (s) dates.push(s)
      if (e) dates.push(e)
      for (const m of p.milestones) {
        const d = parseDate(m.date)
        if (d) dates.push(d)
      }
    }
    const min = startOfMonth(new Date(Math.min(...dates.map((d) => d.getTime()))))
    const max = startOfMonth(new Date(Math.max(...dates.map((d) => d.getTime()))))
    // One month of breathing room on each side
    const gridOrigin = new Date(min.getFullYear(), min.getMonth() - 1, 1)
    const count = Math.max(6, monthsBetween(gridOrigin, max) + 2)
    const list = Array.from({ length: count }, (_, i) => {
      const d = new Date(gridOrigin.getFullYear(), gridOrigin.getMonth() + i, 1)
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: d.toLocaleString('en-IN', { month: 'short' }),
        year: d.getFullYear(),
        isFirstOfYear: d.getMonth() === 0 || i === 0,
      }
    })
    return { origin: gridOrigin, monthCount: count, months: list }
  }, [projects])

  const todayOffset = useMemo(() => monthOffset(origin, new Date()), [origin])
  const gridWidth = monthCount * MONTH_WIDTH

  if (loading) {
    return (
      <div className="card-5bloc">
        <div className="h-[320px] animate-pulse rounded" style={{ background: 'var(--overlay-hover)' }} />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="card-5bloc text-center py-12">
        <span className="material-icons-outlined text-[32px] text-stone">timeline</span>
        <p className="text-sm font-semibold text-white mt-2">No projects to plot yet</p>
        <p className="text-xs text-stone mt-1">
          Create a project and set phase target dates to see it on the timeline.
        </p>
      </div>
    )
  }

  const withDates = projects.filter((p) => buildBars(p, origin).length > 0)
  const withoutDates = projects.filter((p) => buildBars(p, origin).length === 0)

  return (
    <div className="card-5bloc space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Project timeline</h2>
          <p className="text-[11px] text-stone mt-0.5">
            Every phase across all projects. The amber line is today.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {PHASE_ORDER.filter((p) => p !== 'complete').map((phase) => (
            <span key={phase} className="flex items-center gap-1.5 text-[10px] text-stone">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: PHASE_COLORS[phase] }}
              />
              {PHASE_LABELS[phase]}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: LABEL_WIDTH + gridWidth }}>
          {/* Month header */}
          <div className="flex sticky top-0 z-10" style={{ background: 'var(--surface-container)' }}>
            <div style={{ width: LABEL_WIDTH }} className="shrink-0" />
            <div className="flex">
              {months.map((m) => (
                <div
                  key={m.key}
                  className="text-center py-1.5 border-l"
                  style={{ width: MONTH_WIDTH, borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="text-[10px] font-mono uppercase text-stone">{m.month}</div>
                  {m.isFirstOfYear && (
                    <div className="text-[9px] font-mono text-stone/60">{m.year}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {/* Today marker */}
            {todayOffset >= 0 && todayOffset <= monthCount && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{
                  left: LABEL_WIDTH + todayOffset * MONTH_WIDTH,
                  width: 2,
                  background: 'var(--amber)',
                }}
              >
                <span
                  className="absolute -top-0.5 -translate-x-1/2 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded"
                  style={{ background: 'var(--amber)', color: 'var(--ink-black)' }}
                >
                  TODAY
                </span>
              </div>
            )}

            {withDates.map((project) => {
              const bars = buildBars(project, origin)
              return (
                <div key={project.id} className="flex border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div
                    style={{ width: LABEL_WIDTH }}
                    className="shrink-0 py-2 pr-3 flex items-start"
                  >
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-[12px] font-semibold text-white hover:text-amber transition-colors leading-snug line-clamp-2"
                    >
                      {project.name}
                    </Link>
                  </div>
                  <div
                    className="relative py-1.5"
                    style={{ width: gridWidth, minHeight: bars.length * ROW_HEIGHT + 8 }}
                  >
                    {/* Month gridlines */}
                    {months.map((m, i) => (
                      <div
                        key={m.key}
                        className="absolute top-0 bottom-0 border-l"
                        style={{ left: i * MONTH_WIDTH, borderColor: 'rgba(255,255,255,0.04)' }}
                      />
                    ))}
                    {bars.map((bar, i) => {
                      const left = bar.startOffset * MONTH_WIDTH
                      const width = Math.max(28, (bar.endOffset - bar.startOffset) * MONTH_WIDTH)
                      const color = PHASE_COLORS[bar.phase] || '#F5A623'
                      return (
                        <div
                          key={bar.key}
                          className="absolute rounded-sm flex items-center px-2 overflow-hidden"
                          title={`${bar.label}${bar.date ? ` · due ${bar.date}` : ''} · ${bar.completion}% complete`}
                          style={{
                            left,
                            width,
                            top: i * ROW_HEIGHT + 4,
                            height: ROW_HEIGHT - 10,
                            background: `${color}33`,
                            borderLeft: `3px solid ${color}`,
                          }}
                        >
                          {/* Completion fill */}
                          <div
                            className="absolute inset-y-0 left-0 pointer-events-none"
                            style={{ width: `${Math.min(100, bar.completion)}%`, background: `${color}55` }}
                          />
                          <span className="relative text-[10px] font-medium text-white truncate">
                            {bar.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {withoutDates.length > 0 && (
        <div className="border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-[11px] text-stone">
            Not on the timeline yet — add phase target dates or a start and end date to{' '}
            {withoutDates.map((p, i) => (
              <React.Fragment key={p.id}>
                {i > 0 && ', '}
                <Link href={`/projects/${p.id}`} className="text-amber hover:underline">
                  {p.name}
                </Link>
              </React.Fragment>
            ))}
            .
          </p>
        </div>
      )}
    </div>
  )
}
