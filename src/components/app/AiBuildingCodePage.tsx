import React, { useEffect, useState } from 'react'
import { UpgradePrompt } from '@/components/payments/UpgradePrompt'
import { useToast } from '@/components/ui5/Toast'
import { isTestPeriod } from '@/lib/payments/gates'
import { TYPOLOGY_OPTIONS, normalizeTypology, typologyLabel } from '@/lib/compliance/typology'
import type { BuildingCodeFinding, BuildingCodeResult } from '@/lib/ai/building-code'

interface ProjectOption {
  id: string
  name: string
  type?: string | null
  city?: string | null
  state?: string | null
  total_sqft?: number | null
  floors?: number | null
}

function normalizePlan(raw: unknown): 'free' | 'solo' | 'team' {
  const p = String(raw || 'free').toLowerCase()
  if (p === 'solo' || p === 'team' || p === 'free') return p
  return 'free'
}

const SEVERITY: Record<BuildingCodeFinding['severity'], { label: string; chipClass: string }> = {
  blocker: { label: 'Blocker', chipClass: 'chip-m-red' },
  warning: { label: 'Check', chipClass: 'chip-m-amber' },
  note: { label: 'Note', chipClass: 'chip-m-blue' },
}

export default function AiBuildingCodePage() {
  const { toast } = useToast()
  const [form, setForm] = useState({
    projectType: 'residential',
    city: 'Mumbai',
    state: 'Maharashtra',
    plotSqm: '',
    builtSqft: '',
    floors: '',
    heightM: '',
    notes: '',
    projectId: '',
  })
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState<BuildingCodeResult | null>(null)
  const [planGateLoading, setPlanGateLoading] = useState(true)
  const [needsUpgrade, setNeedsUpgrade] = useState(false)
  const [remainingCalls, setRemainingCalls] = useState(2)
  const [seedingPermits, setSeedingPermits] = useState(false)

  const loadingMessages = [
    'Reading typology against NBC 2016…',
    'Checking FSI, setbacks and height caps…',
    'Matching fire, RERA and sector-regulator triggers…',
    'Drafting the clearance list…',
  ]

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) =>
        setProjects(
          (d.projects || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            city: p.city,
            state: p.state,
            total_sqft: p.total_sqft,
            floors: p.floors,
          }))
        )
      )
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        const profile = d.profile || {}
        const plan = normalizePlan(profile.plan || profile.organisations?.plan)
        setNeedsUpgrade(!isTestPeriod() && plan === 'free' && !profile.ai_add_on)
      })
      .catch(() => setNeedsUpgrade(false))
      .finally(() => setPlanGateLoading(false))
  }, [])

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0)
      return
    }
    const interval = setInterval(() => {
      setLoadingStep((s) => (s + 1) % loadingMessages.length)
    }, 1200)
    return () => clearInterval(interval)
  }, [loading])

  const applyProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    setForm((prev) => ({
      ...prev,
      projectId,
      ...(project
        ? {
            projectType: normalizeTypology(project.type),
            city: project.city || prev.city,
            state: project.state || prev.state,
            builtSqft: project.total_sqft ? String(project.total_sqft) : prev.builtSqft,
            floors: project.floors ? String(project.floors) : prev.floors,
          }
        : {}),
    }))
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai/building-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectType: form.projectType,
          city: form.city,
          state: form.state,
          plotSqm: form.plotSqm,
          builtSqft: form.builtSqft,
          floors: form.floors,
          heightM: form.heightM,
          notes: form.notes,
        }),
      })
      const json = await res.json()
      if (res.status === 402) {
        setNeedsUpgrade(true)
        toast(json.error || 'This is a paid AI feature', 'warning')
        return
      }
      if (!res.ok) {
        toast(json.error || 'Could not run the code check', 'error')
        return
      }
      setResult(json.data)
      if (typeof json.remaining === 'number') setRemainingCalls(json.remaining)
    } catch (err: any) {
      toast(err?.message || 'Could not run the code check', 'error')
    } finally {
      setLoading(false)
    }
  }

  const seedClearances = async () => {
    if (!result || !form.projectId || seedingPermits) return
    setSeedingPermits(true)
    try {
      const existingRes = await fetch(`/api/projects/${form.projectId}/permits`)
      const existingJson = await existingRes.json().catch(() => ({}))
      const existingNames = new Set(
        ((existingJson.permits || []) as { approval_name?: string }[]).map((p) =>
          (p.approval_name || '').trim().toLowerCase()
        )
      )

      let added = 0
      let skipped = 0
      for (const clearance of result.required_clearances) {
        if (existingNames.has(clearance.name.trim().toLowerCase())) {
          skipped += 1
          continue
        }
        const res = await fetch(`/api/projects/${form.projectId}/permits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            approval_name: clearance.name,
            authority: clearance.authority,
            notes: clearance.why,
            status: 'not_started',
          }),
        })
        if (res.ok) added += 1
      }

      if (added === 0 && skipped > 0) {
        toast('Those clearances are already on the project', 'info')
      } else if (added === 0) {
        toast('Could not add the clearances — check you can edit Permits on this project', 'error')
      } else {
        toast(
          skipped
            ? `Added ${added} clearance${added === 1 ? '' : 's'} (${skipped} already there)`
            : `Added ${added} clearance${added === 1 ? '' : 's'} to the project`,
          'success'
        )
      }
    } catch (err: any) {
      toast(err?.message || 'Could not add those clearances', 'error')
    } finally {
      setSeedingPermits(false)
    }
  }

  return (
    <div className="page-m space-y-8">
      <div>
        <h1 className="page-m-title">AI Building Code Checker</h1>
        <p className="page-m-sub">
          Typology-aware briefing against NBC 2016 and typical Indian DCR — FSI, setbacks, fire, parking
          and the NOCs this building type actually needs.
        </p>
      </div>

      {planGateLoading ? (
        <div className="card-m p-8 text-center text-stone animate-pulse text-xs">Checking plan access…</div>
      ) : needsUpgrade ? (
        <UpgradePrompt
          title="Building Code Checker is a paid feature"
          message="Free plans cannot run AI code checks. Upgrade to Solo or Team, or add the AI add-on."
        />
      ) : null}

      {!needsUpgrade && !planGateLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="card-m">
            <div className="card-m-head">
              <h3 className="card-m-title">Site Brief</h3>
              <span className="chip-m chip-m-amber text-[10px]">
                {remainingCalls} runs left
              </span>
            </div>

            <form onSubmit={handleGenerate} className="p-5 space-y-4">
              {projects.length > 0 && (
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Pull from a project
                  </label>
                  <div className="select-5bloc w-full">
                    <select
                      value={form.projectId}
                      onChange={(e) => applyProject(e.target.value)}
                      className="w-full"
                    >
                      <option value="">Not linked — enter details below</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <span className="material-icons-outlined chevron">expand_more</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                  Typology
                </label>
                <div className="select-5bloc w-full">
                  <select
                    value={form.projectType}
                    onChange={(e) => setForm((f) => ({ ...f, projectType: e.target.value }))}
                    className="w-full"
                  >
                    {TYPOLOGY_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-icons-outlined chevron">expand_more</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    City
                  </label>
                  <input
                    className="input-5bloc py-1.5 text-xs"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    State
                  </label>
                  <input
                    className="input-5bloc py-1.5 text-xs"
                    value={form.state}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Plot (sqm)
                  </label>
                  <input
                    type="number"
                    className="input-5bloc py-1.5 text-xs font-mono"
                    value={form.plotSqm}
                    onChange={(e) => setForm((f) => ({ ...f, plotSqm: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Built-up (sqft)
                  </label>
                  <input
                    type="number"
                    className="input-5bloc py-1.5 text-xs font-mono"
                    value={form.builtSqft}
                    onChange={(e) => setForm((f) => ({ ...f, builtSqft: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Floors
                  </label>
                  <input
                    type="number"
                    className="input-5bloc py-1.5 text-xs font-mono"
                    value={form.floors}
                    onChange={(e) => setForm((f) => ({ ...f, floors: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Height (m)
                  </label>
                  <input
                    type="number"
                    className="input-5bloc py-1.5 text-xs font-mono"
                    value={form.heightM}
                    onChange={(e) => setForm((f) => ({ ...f, heightM: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                  Notes
                </label>
                <textarea
                  rows={3}
                  className="input-5bloc text-xs resize-none"
                  placeholder="Coastal plot, school, hospital, basement parking…"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-[13px] font-bold mt-2">
                {loading ? 'RUNNING CHECKS...' : `CHECK ${typologyLabel(form.projectType).toUpperCase()} CODES`}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {!result && !loading && (
              <div className="card-m flex flex-col items-center justify-center text-center h-[450px] text-stone p-8">
                <div className="w-20 h-20 bg-surface-low rounded-full flex items-center justify-center text-amber/20 mb-4">
                  <span className="material-icons-outlined text-[48px]">gavel</span>
                </div>
                <h4 className="text-[15px] font-bold text-white uppercase tracking-wider">No check run yet</h4>
                <p className="text-xs text-stone/60 mt-3 max-w-md mx-auto leading-relaxed">
                  Pick a typology — commercial and institutional are not treated as a house — and we will
                  list likely blockers, bye-law ranges and the NOCs to seed on Permits.
                </p>
              </div>
            )}

            {loading && (
              <div className="card-m p-12 text-center animate-pulse space-y-4">
                <div className="w-16 h-16 bg-amber/5 border border-amber/20 rounded-full flex items-center justify-center text-amber animate-spin mx-auto">
                  <span className="material-icons-outlined text-[32px]">sync</span>
                </div>
                <p className="text-[11px] font-mono text-amber uppercase tracking-widest">{loadingMessages[loadingStep]}</p>
              </div>
            )}

            {result && (
              <div className="space-y-6 animate-fade-in">
                <div className="card-m">
                  <div className="card-m-head border-b border-hairline">
                    <h3 className="card-m-title uppercase text-amber">Summary</h3>
                    <span className="text-[10px] font-mono text-stone uppercase">{result.typology} · {result.city}</span>
                  </div>
                  <div className="p-5 space-y-3">
                    <p className="text-[14px] text-white leading-relaxed">{result.summary}</p>
                    <p className="text-[11px] text-stone leading-relaxed italic border-t border-hairline pt-3">{result.disclaimer}</p>
                  </div>
                </div>

                <div className="card-m">
                  <div className="card-m-head border-b border-hairline">
                    <h3 className="card-m-title uppercase">Findings</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    {result.findings.map((f, i) => {
                      const meta = SEVERITY[f.severity] || SEVERITY.note
                      return (
                        <div key={`${f.topic}-${i}`} className="card-m bg-surface-low/30 overflow-hidden">
                          <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-surface-low/50">
                            <span className="text-[13px] font-bold text-white">{f.topic}</span>
                            <span className={`chip-m ${meta.chipClass}`}>{meta.label}</span>
                          </div>
                          <div className="p-4 space-y-3">
                            <p className="text-[13px] text-stone leading-relaxed">{f.finding}</p>
                            <div className="flex gap-2 items-start pt-2 border-t border-hairline">
                              <span className="material-icons-outlined text-amber text-[16px] mt-0.5">arrow_forward</span>
                              <p className="text-[12px] text-white leading-relaxed">
                                <span className="font-bold text-amber text-[10px] uppercase tracking-wider mr-1">Action:</span>
                                {f.action}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="card-m">
                  <div className="card-m-head border-b border-hairline">
                    <h3 className="card-m-title uppercase">Clearances to track</h3>
                    {form.projectId ? (
                      <button
                        type="button"
                        disabled={seedingPermits}
                        onClick={seedClearances}
                        className="btn-secondary py-1.5 px-3 text-[10px] font-bold uppercase disabled:opacity-50"
                      >
                        {seedingPermits ? 'Adding…' : 'Add to project Permits'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-stone italic">
                        Link a project to add these as permits
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-hairline">
                    {result.required_clearances.map((c) => (
                      <div key={c.name} className="p-5 hover:bg-surface-low/20 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="text-[14px] font-semibold text-white">{c.name}</p>
                            <p className="text-[12px] text-stone mt-1">{c.authority}</p>
                          </div>
                          {c.why && (
                            <div className="max-w-[50%] bg-surface-canvas p-2 rounded border border-hairline">
                              <p className="text-[11px] text-stone leading-relaxed italic">"{c.why}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
