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

const SEVERITY: Record<BuildingCodeFinding['severity'], { label: string; color: string; bg: string }> = {
  blocker: { label: 'Blocker', color: 'var(--error)', bg: 'rgba(255,138,128,.12)' },
  warning: { label: 'Check', color: 'var(--amber)', bg: 'rgba(245,166,35,.12)' },
  note: { label: 'Note', color: 'var(--blue)', bg: 'rgba(122,184,255,.10)' },
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
    <div className="p-6 space-y-6 font-body select-none max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-wide">AI Building Code Checker</h1>
        <p className="text-xs text-stone mt-1">
          Typology-aware briefing against NBC 2016 and typical Indian DCR — FSI, setbacks, fire, parking
          and the NOCs this building type actually needs.
        </p>
      </div>

      {planGateLoading ? (
        <div className="card-5bloc p-8 text-center text-stone animate-pulse text-xs">Checking plan access…</div>
      ) : needsUpgrade ? (
        <UpgradePrompt
          title="Building Code Checker is a paid feature"
          message="Free plans cannot run AI code checks. Upgrade to Solo or Team, or add the AI add-on."
        />
      ) : null}

      {!needsUpgrade && !planGateLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="card-5bloc space-y-4">
            <div className="flex items-center justify-between pb-2.5 mb-2">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber">Site brief</h3>
              <span className="text-[10px] text-stone font-mono uppercase">
                Remaining: <span className="text-white font-bold">{remainingCalls} runs</span>
              </span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              {projects.length > 0 && (
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Pull from a project
                  </label>
                  <select
                    value={form.projectId}
                    onChange={(e) => applyProject(e.target.value)}
                    className="input-5bloc py-1.5 text-xs font-medium"
                  >
                    <option value="">Not linked — enter details below</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                  Typology
                </label>
                <select
                  value={form.projectType}
                  onChange={(e) => setForm((f) => ({ ...f, projectType: e.target.value }))}
                  className="input-5bloc py-1.5 text-xs font-medium"
                >
                  {TYPOLOGY_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
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

              <button type="submit" disabled={loading} className="btn-primary w-full py-2 text-xs font-bold">
                {loading ? loadingMessages[loadingStep] : `Check ${typologyLabel(form.projectType).toLowerCase()} codes`}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {!result && !loading && (
              <div className="card-5bloc p-10 text-center">
                <span className="material-icons-outlined text-[36px] text-amber">gavel</span>
                <p className="text-sm font-semibold text-white mt-3">No check run yet</p>
                <p className="text-xs text-stone mt-1 max-w-md mx-auto leading-relaxed">
                  Pick a typology — commercial and institutional are not treated as a house — and we will
                  list likely blockers, bye-law ranges and the NOCs to seed on Permits.
                </p>
              </div>
            )}

            {loading && (
              <div className="card-5bloc p-10 text-center animate-pulse">
                <p className="text-xs font-mono text-amber uppercase">{loadingMessages[loadingStep]}</p>
              </div>
            )}

            {result && (
              <>
                <div className="card-5bloc space-y-2">
                  <p className="text-[10px] font-mono uppercase text-amber tracking-wider">
                    {result.typology} · {result.city}
                  </p>
                  <p className="text-sm text-white leading-relaxed">{result.summary}</p>
                  <p className="text-[11px] text-stone leading-relaxed">{result.disclaimer}</p>
                </div>

                <div className="card-5bloc space-y-3">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">Findings</h3>
                  <div className="space-y-3">
                    {result.findings.map((f, i) => {
                      const meta = SEVERITY[f.severity] || SEVERITY.note
                      return (
                        <div key={`${f.topic}-${i}`} className="border rounded-md p-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-white">{f.topic}</span>
                            <span
                              className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded"
                              style={{ color: meta.color, background: meta.bg }}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <p className="text-[12px] text-stone leading-relaxed">{f.finding}</p>
                          <p className="text-[11px] text-white leading-relaxed">Next: {f.action}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="card-5bloc space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                      Clearances to track
                    </h3>
                    {form.projectId ? (
                      <button
                        type="button"
                        disabled={seedingPermits}
                        onClick={seedClearances}
                        className="btn-secondary py-1 px-2.5 text-[10px] font-mono font-bold uppercase disabled:opacity-50"
                      >
                        {seedingPermits ? 'Adding…' : 'Add to project Permits'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-stone">
                        Link a project on the left to add these as permits
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-navy-lt/30">
                    {result.required_clearances.map((c) => (
                      <div key={c.name} className="py-2.5">
                        <p className="text-xs font-semibold text-white">{c.name}</p>
                        <p className="text-[11px] text-stone">
                          {c.authority}
                          {c.why ? ` — ${c.why}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
