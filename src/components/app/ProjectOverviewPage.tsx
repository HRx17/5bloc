import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from '@/compat/next-navigation'
import Link from '@/compat/next-link'
import { useToast } from '@/components/ui5/Toast'
import { ErrorState } from '@/components/ui5/ErrorState'
import { Skeleton } from '@/components/ui5/Skeleton'
import { useLiveReload } from '@/lib/live/useLiveReload'

const PHASE_LABELS: Record<string, string> = {
  pre_design: 'Pre-Design',
  schematic_design: 'Schematic Design',
  design_development: 'Design Development',
  construction_docs: 'Construction Docs',
  bidding: 'Bidding & Tender',
  permits: 'Permits & Approvals',
  construction_admin: 'Construction Admin',
  complete: 'Close Out & Handover',
}

const FIRST_STEPS_DISMISS_KEY = (id: string) => `project_first_steps_dismissed_${id}`

interface PhaseMilestone {
  id?: string
  phase: string
  label: string
  date: string
  completion: number
  fee: number
  paid: boolean
  reraCertified: boolean
  notes: string
}

type FirstStep = {
  id: string
  title: string
  href: string
}

export default function ProjectOverviewPage() {
  const params = useParams()
  const projectId = params.id as string
  const { toast } = useToast()

  const [projectStats, setProjectStats] = useState({
    sqft: 0,
    floors: 0,
    cost: 0,
    feePercent: 0,
    feeAmount: 0,
    startDate: '',
    endDate: '',
    brief: '',
    name: '',
    phase: '',
    city: '',
    state: '',
    portalEnabled: false,
  })
  const [documentCount, setDocumentCount] = useState(0)
  const [memberCount, setMemberCount] = useState(0)
  const [role, setRole] = useState<string | null>(null)
  const [firstStepsDismissed, setFirstStepsDismissed] = useState(true)
  const [milestones, setMilestones] = useState<PhaseMilestone[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingPhase, setSavingPhase] = useState<string | null>(null)
  const [savingSpecs, setSavingSpecs] = useState(false)
  const [editingSpecs, setEditingSpecs] = useState(false)
  // A fee is quoted either as a percentage of construction cost or as a lump sum — never both
  const [feeMode, setFeeMode] = useState<'percent' | 'amount'>('amount')
  const [loadError, setLoadError] = useState<unknown>(null)

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true)
      setLoadError(null)
    }
    try {
      const [projRes, actRes, membersRes, meRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/activity?project_id=${projectId}&limit=8`),
        fetch(`/api/projects/${projectId}/members`),
        fetch('/api/me'),
      ])
      const projData = await projRes.json()
      const actData = await actRes.json()
      if (!projRes.ok) throw new Error(projData.error || 'Failed to load this project')

      const p = projData.project
      const docs = projData.documents || []
      setDocumentCount(docs.length)
      setProjectStats({
        sqft: Number(p.total_sqft || 0),
        floors: Number(p.floors || 0),
        cost: Number(p.construction_cost || 0),
        feePercent: Number(p.architect_fee_pct || 0),
        feeAmount: Number(p.architect_fee || 0),
        startDate: p.start_date || '',
        endDate: p.estimated_end || '',
        brief: p.brief || '',
        name: p.name || '',
        phase: p.phase || '',
        city: p.city || '',
        state: p.state || '',
        portalEnabled: !!p.portal_enabled,
      })
      setFeeMode(Number(p.architect_fee_pct || 0) > 0 ? 'percent' : 'amount')

      if (membersRes.ok) {
        const membersData = await membersRes.json()
        setMemberCount((membersData.members || []).length)
      } else {
        setMemberCount(0)
      }

      if (meRes.ok) {
        const meData = await meRes.json()
        setRole(meData.profile?.role || null)
      }

      const ms = (projData.milestones || []).map((m: any) => ({
        id: m.id,
        phase: m.phase,
        label: PHASE_LABELS[m.phase] || m.phase,
        date: m.milestone_date || '',
        completion: m.completion_pct ?? 0,
        fee: Number(m.fee_amount || 0),
        paid: !!m.fee_paid,
        reraCertified: !!m.rera_certified,
        notes: m.notes || '',
      }))
      // Ensure all standard phases exist in UI
      const phases = Object.keys(PHASE_LABELS)
      const merged = phases.map((phase) => {
        const found = ms.find((m: PhaseMilestone) => m.phase === phase)
        return (
          found || {
            phase,
            label: PHASE_LABELS[phase],
            date: '',
            completion: 0,
            fee: 0,
            paid: false,
            reraCertified: false,
            notes: '',
          }
        )
      })
      setMilestones(merged)
      setExpandedPhase(p.phase || merged.find((m) => m.completion < 100)?.phase || merged[0]?.phase)
      setActivity(actRes.ok ? actData.activity || [] : [])
    } catch (e) {
      if (!opts?.quiet) setLoadError(e)
    } finally {
      if (!opts?.quiet) setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  useLiveReload(load, ['projects', 'documents', 'rfis'])

  useEffect(() => {
    try {
      setFirstStepsDismissed(localStorage.getItem(FIRST_STEPS_DISMISS_KEY(projectId)) === 'true')
    } catch {
      setFirstStepsDismissed(false)
    }
  }, [projectId])

  const firstSteps = useMemo((): FirstStep[] => {
    const steps: FirstStep[] = []
    if (memberCount <= 1) {
      steps.push({
        id: 'invite',
        title: 'Invite team',
        href: `/projects/${projectId}/team`,
      })
    }
    if (!projectStats.portalEnabled) {
      steps.push({
        id: 'portal',
        title: 'Enable portal',
        href: `/projects/${projectId}/portal`,
      })
    }
    if (documentCount === 0) {
      steps.push({
        id: 'drawings',
        title: 'Upload drawings',
        href: `/projects/${projectId}/documents`,
      })
    }
    // Post for bids when early / bidding phases and project is still thin
    const phase = projectStats.phase
    const bidPhases = new Set([
      'pre_design',
      'schematic_design',
      'design_development',
      'construction_docs',
      'bidding',
      '',
    ])
    if (bidPhases.has(phase) && (memberCount <= 1 || documentCount === 0 || !projectStats.portalEnabled)) {
      steps.push({
        id: 'bids',
        title: 'Post for bids',
        href: `#post-tender`,
      })
    }
    return steps
  }, [memberCount, projectStats.portalEnabled, projectStats.phase, documentCount, projectId])

  const showFirstSteps =
    role === 'architect' && !firstStepsDismissed && firstSteps.length > 0 && !loading && !loadError

  const dismissFirstSteps = () => {
    setFirstStepsDismissed(true)
    try {
      localStorage.setItem(FIRST_STEPS_DISMISS_KEY(projectId), 'true')
    } catch {
      /* ignore */
    }
  }

  const handleMilestoneFieldChange = (phase: string, field: keyof PhaseMilestone, value: any) => {
    setMilestones((prev) =>
      prev.map((m) => (m.phase === phase ? { ...m, [field]: value } : m))
    )
  }

  const saveMilestone = async (phase: string) => {
    const milestone = milestones.find((m) => m.phase === phase)
    if (!milestone || savingPhase) return
    setSavingPhase(phase)
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase,
          milestone_date: milestone.date || null,
          completion_pct: milestone.completion,
          fee_amount: milestone.fee,
          fee_paid: milestone.paid,
          notes: milestone.notes,
          rera_certified: milestone.reraCertified,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || `Could not save ${milestone.label}`, 'error')
        return
      }
      toast(`${milestone.label} saved`, 'success')
    } catch (err: any) {
      toast(err?.message || `Could not save ${milestone.label}`, 'error')
    } finally {
      setSavingPhase(null)
    }
  }

  const derivedFeeAmount =
    feeMode === 'percent'
      ? Math.round((projectStats.cost * projectStats.feePercent) / 100)
      : projectStats.feeAmount

  const saveSpecs = async () => {
    if (savingSpecs) return
    setSavingSpecs(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_sqft: projectStats.sqft || null,
          floors: projectStats.floors || null,
          construction_cost: projectStats.cost || null,
          // Whichever basis is not selected is cleared so the two can never disagree
          architect_fee: derivedFeeAmount || null,
          architect_fee_pct: feeMode === 'percent' ? projectStats.feePercent || null : null,
          start_date: projectStats.startDate || null,
          estimated_end: projectStats.endDate || null,
          brief: projectStats.brief || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || 'Failed to save the project specs', 'error')
        return
      }
      setProjectStats((prev) => ({
        ...prev,
        feeAmount: derivedFeeAmount,
        feePercent: feeMode === 'percent' ? prev.feePercent : 0,
      }))
      setEditingSpecs(false)
      toast('Project specs saved', 'success')
    } catch (err: any) {
      toast(err?.message || 'Failed to save the project specs', 'error')
    } finally {
      setSavingSpecs(false)
    }
  }

  const exportMilestonesToCSV = () => {
    const headers = ['Phase', 'Target Date', 'Completion %', 'Fee Amount (INR)', 'Paid Status', 'Notes']
    const rows = milestones.map((m) => [
      m.label,
      m.date,
      `${m.completion}%`,
      m.fee,
      m.paid ? 'PAID' : 'UNPAID',
      m.notes.replace(/"/g, '""'),
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((val) => `"${val}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `milestones_schedule_${projectId}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast('Milestone schedule exported as CSV', 'success')
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-56 w-full md:col-span-2" />
          <Skeleton className="h-56 w-full" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <ErrorState
        title="Could not load this project"
        description="The overview, milestones and recent activity could not be fetched."
        error={loadError}
        onRetry={load}
      />
    )
  }

  return (
    <div className="space-y-8 max-h-full font-body select-none">
      {showFirstSteps && (
        <section
          className="rounded-2xl p-4 md:p-5 space-y-3"
          style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-2)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Get this project running</h3>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--stone)' }}>
                A few setup steps so the team, client portal, and bidding can work.
              </p>
            </div>
            <button
              type="button"
              className="text-[11px] shrink-0"
              style={{ color: 'var(--stone)' }}
              onClick={dismissFirstSteps}
            >
              Dismiss
            </button>
          </div>
          <ul className="flex flex-wrap gap-2">
            {firstSteps.map((step, i) => (
              <li key={step.id}>
                <Link
                  href={step.href}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium"
                  style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
                >
                  <span style={{ color: 'var(--amber)' }}>{i + 1}.</span>
                  {step.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-5bloc space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-amber">Project Specifications</h3>
            <div className="flex gap-2">
              {editingSpecs ? (
                <>
                  <button
                    type="button"
                    className="btn-secondary text-[11px]"
                    onClick={() => setEditingSpecs(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary text-[11px]"
                    disabled={savingSpecs}
                    onClick={saveSpecs}
                  >
                    {savingSpecs ? 'Saving…' : 'Save specs'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-secondary text-[11px]"
                  onClick={() => setEditingSpecs(true)}
                >
                  Edit
                </button>
              )}
            </div>
          </div>
          {editingSpecs ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1.5">
              <div className="col-span-2 sm:col-span-3 border rounded-md p-3 space-y-2.5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="text-[11px] font-medium text-stone">Architect fee basis</span>
                  {(
                    [
                      ['amount', 'Lump sum (₹)'],
                      ['percent', '% of construction cost'],
                    ] as const
                  ).map(([mode, label]) => (
                    <label key={mode} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="feeMode"
                        checked={feeMode === mode}
                        onChange={() => setFeeMode(mode)}
                      />
                      <span className="text-[11px]">{label}</span>
                    </label>
                  ))}
                </div>
                {feeMode === 'percent' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-stone">Fee %</label>
                      <input
                        type="number"
                        step="0.1"
                        className="input-5bloc mt-1 py-1.5 text-xs"
                        value={projectStats.feePercent || ''}
                        onChange={(e) =>
                          setProjectStats((prev) => ({
                            ...prev,
                            feePercent: Number(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-stone">Works out to</label>
                      <p className="mt-1 py-1.5 text-xs font-semibold">
                        ₹{derivedFeeAmount.toLocaleString()}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--stone)' }}>
                        {projectStats.cost
                          ? `${projectStats.feePercent}% of ₹${projectStats.cost.toLocaleString()}`
                          : 'Set a target cost to calculate the amount'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-medium text-stone">Architect fee (₹)</label>
                    <input
                      type="number"
                      className="input-5bloc mt-1 py-1.5 text-xs"
                      value={projectStats.feeAmount || ''}
                      onChange={(e) =>
                        setProjectStats((prev) => ({
                          ...prev,
                          feeAmount: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                )}
              </div>
              {(
                [
                  ['sqft', 'Built area (sqft)', 'number'],
                  ['floors', 'Floors', 'number'],
                  ['cost', 'Target cost (₹)', 'number'],
                  ['startDate', 'Start date', 'date'],
                  ['endDate', 'Target end', 'date'],
                ] as const
              ).map(([key, label, type]) => (
                <div key={key}>
                  <label className="text-[11px] font-medium text-stone">{label}</label>
                  <input
                    type={type}
                    className="input-5bloc mt-1 py-1.5 text-xs"
                    value={(projectStats as any)[key] ?? ''}
                    onChange={(e) =>
                      setProjectStats((prev) => ({
                        ...prev,
                        [key]:
                          type === 'number'
                            ? Number(e.target.value) || 0
                            : e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
              <div className="sm:col-span-3">
                <label className="text-[11px] font-medium text-stone">Brief</label>
                <textarea
                  className="input-5bloc mt-1 text-xs resize-none"
                  rows={3}
                  value={projectStats.brief}
                  onChange={(e) => setProjectStats((prev) => ({ ...prev, brief: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1.5">
                <div>
                  <p className="text-[11px] font-medium text-stone">Total Built Area</p>
                  <h4 className="text-base font-semibold mt-1">{projectStats.sqft.toLocaleString()} sqft</h4>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-stone">Floors</p>
                  <h4 className="text-base font-semibold mt-1">{projectStats.floors}</h4>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-stone">Target Cost</p>
                  <h4 className="text-base font-semibold mt-1">
                    ₹{(projectStats.cost / 10000000).toFixed(2)} Cr
                  </h4>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-stone">Architect Fee</p>
                  <h4 className="text-base font-semibold mt-1">
                    ₹{projectStats.feeAmount.toLocaleString()}
                  </h4>
                  <p className="text-[10px]" style={{ color: 'var(--stone)' }}>
                    {projectStats.feePercent
                      ? `${projectStats.feePercent}% of construction cost`
                      : 'Lump sum'}
                  </p>
                </div>
              </div>
              <div className="pt-2 grid sm:grid-cols-2 gap-3 text-[12px]" style={{ color: 'var(--stone)' }}>
                <p>Start: {projectStats.startDate || '—'}</p>
                <p>Target end: {projectStats.endDate || '—'}</p>
              </div>
              {projectStats.brief && (
                <p className="text-sm pt-2" style={{ color: 'var(--on-surface-variant)' }}>
                  {projectStats.brief}
                </p>
              )}
            </>
          )}
        </div>

        <div className="card-5bloc space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-amber">Recent activity</h3>
            <Link href={`/projects/${projectId}/rfis`} className="text-[11px]" style={{ color: 'var(--amber)' }}>
              RFIs
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-[12px]" style={{ color: 'var(--stone)' }}>
              Nothing has happened on this project yet. Uploads, RFIs and approvals show up here as the team works.
            </p>
          ) : (
            <ul className="space-y-2">
              {activity.map((a) => (
                <li key={a.id} className="text-[12px]">
                  <span style={{ color: 'var(--on-surface)' }}>{a.entity_name || a.action}</span>
                  <span className="block" style={{ color: 'var(--stone)' }}>
                    {a.action} · {a.created_at?.slice(0, 10)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <PostTenderButton
            projectId={projectId}
            projectName={projectStats.name}
            city={projectStats.city}
            state={projectStats.state}
          />
        </div>
      </div>

      <div className="card-5bloc">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Phase milestones</h3>
          <button type="button" className="btn-secondary text-[11px]" onClick={exportMilestonesToCSV}>
            Export CSV
          </button>
        </div>

        <div className="space-y-2">
          {milestones.map((m) => {
            const open = expandedPhase === m.phase
            return (
              <div key={m.phase} className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-container-low)' }}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  onClick={() => setExpandedPhase(open ? null : m.phase)}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-icons-outlined text-[18px]" style={{ color: 'var(--amber)' }}>
                      {open ? 'expand_less' : 'expand_more'}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{m.label}</p>
                      <p className="text-[11px]" style={{ color: 'var(--stone)' }}>
                        {m.completion}% · {m.paid ? 'Fee paid' : 'Fee unpaid'} · {m.date || 'No date'}
                      </p>
                    </div>
                  </div>
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(159,142,122,0.2)' }}>
                    <div className="h-full" style={{ width: `${m.completion}%`, background: 'var(--amber)' }} />
                  </div>
                </button>

                {open && (
                  <div className="px-4 pb-4 grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-stone">Target date</label>
                      <input
                        type="date"
                        className="input-5bloc mt-1"
                        value={m.date}
                        onChange={(e) => handleMilestoneFieldChange(m.phase, 'date', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-stone">Completion %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="input-5bloc mt-1"
                        value={m.completion}
                        onChange={(e) =>
                          handleMilestoneFieldChange(m.phase, 'completion', Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-stone">Fee (₹)</label>
                      <input
                        type="number"
                        className="input-5bloc mt-1"
                        value={m.fee}
                        onChange={(e) => handleMilestoneFieldChange(m.phase, 'fee', Number(e.target.value))}
                      />
                    </div>
                    <div className="flex items-end gap-4 pb-2">
                      <label className="flex items-center gap-2 text-[12px]">
                        <input
                          type="checkbox"
                          checked={m.paid}
                          onChange={(e) => handleMilestoneFieldChange(m.phase, 'paid', e.target.checked)}
                        />
                        Fee paid
                      </label>
                      <label className="flex items-center gap-2 text-[12px]">
                        <input
                          type="checkbox"
                          checked={m.reraCertified}
                          onChange={(e) =>
                            handleMilestoneFieldChange(m.phase, 'reraCertified', e.target.checked)
                          }
                        />
                        RERA certified
                      </label>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-stone">Notes</label>
                      <textarea
                        className="input-5bloc mt-1 min-h-[70px]"
                        value={m.notes}
                        onChange={(e) => handleMilestoneFieldChange(m.phase, 'notes', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="button"
                        className="btn-primary text-[12px]"
                        disabled={savingPhase === m.phase}
                        onClick={() => saveMilestone(m.phase)}
                      >
                        {savingPhase === m.phase ? 'Saving…' : 'Save milestone'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PostTenderButton({
  projectId,
  projectName,
  city,
  state,
}: {
  projectId: string
  projectName: string
  city: string
  state?: string
}) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [trade, setTrade] = useState('Civil')
  const [posting, setPosting] = useState(false)

  const submit = async () => {
    if (posting) return
    setPosting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/tenders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          trade_type: trade,
          project_name: projectName,
          city: city || undefined,
          state: state || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || 'Could not post the tender', 'error')
        return
      }
      setOpen(false)
      setTitle('')
      toast('Tender posted to the marketplace', 'success')
    } catch (err: any) {
      toast(err?.message || 'Could not post the tender', 'error')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div id="post-tender" className="pt-3" style={{ boxShadow: '0 -1px 0 rgba(159,142,122,0.1)' }}>
      <button type="button" className="btn-secondary text-[11px] w-full" onClick={() => setOpen(true)}>
        Post tender
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl space-y-3" style={{ background: 'var(--surface-container-high)' }}>
            <h3 className="font-semibold">Post open tender</h3>
            <input className="input-5bloc" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select className="input-5bloc" value={trade} onChange={(e) => setTrade(e.target.value)}>
              {['Civil', 'RCC', 'MEP', 'Facade', 'Interior'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)} disabled={posting}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={submit} disabled={!title || posting}>
                {posting ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
