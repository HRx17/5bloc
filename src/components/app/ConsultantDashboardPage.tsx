import React, { useCallback, useEffect, useState } from 'react'
import Link from '@/compat/next-link'
import { ErrorState } from '@/components/ui5/ErrorState'
import { EmptyState } from '@/components/ui5/EmptyState'
import { Skeleton } from '@/components/ui5/Skeleton'

const DISCIPLINES = ['all', 'architectural', 'structural', 'mep', 'electrical', 'plumbing', 'hvac', 'facade']

export default function ConsultantDashboardPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [discipline, setDiscipline] = useState('structural')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [counts, setCounts] = useState<Record<string, { docs: number; rfis: number; subs: number }>>({})

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.profile?.discipline) setDiscipline(String(d.profile.discipline).toLowerCase())
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/projects')
        if (!res.ok) throw new Error('Could not load your projects')
        const d = await res.json()
        const list = d.projects || []
        if (cancelled) return
        setProjects(list)

        const next: Record<string, { docs: number; rfis: number; subs: number }> = {}
        await Promise.all(
          list.slice(0, 8).map(async (p: any) => {
            const detail = await fetch(`/api/projects/${p.id}`).then((r) => r.json())
            const docs = (detail.documents || []).filter((doc: any) => {
              if (discipline === 'all') return true
              const hay = `${doc.folder || ''} ${doc.name || ''} ${doc.phase || ''}`.toLowerCase()
              return hay.includes(discipline)
            })
            const rfis = detail.rfis || []
            const subsRes = await fetch(`/api/projects/${p.id}/submittals`).then((r) => r.json())
            next[p.id] = {
              docs: docs.length,
              rfis: rfis.length,
              subs: (subsRes.submittals || []).length,
            }
          })
        )
        if (!cancelled) setCounts(next)
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [discipline, reloadKey])

  const retry = useCallback(() => setReloadKey((k) => k + 1), [])

  return (
    <div className="page-m space-y-6">
      <div>
        <h1 className="page-m-title">Consultant workspace</h1>
        <p className="page-m-sub">
          Discipline-scoped drawings, RFIs and submittals — without the firm noise.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DISCIPLINES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDiscipline(d)}
            className={`chip-m capitalize ${discipline === d ? 'chip-m-amber' : ''}`}
          >
            {d}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load your projects"
          description="Nothing has been removed from your workspace — the request failed on the way."
          error={error}
          onRetry={retry}
        />
      ) : projects.length === 0 ? (
        <EmptyState
          icon="engineering"
          title="No projects have invited you yet"
          description={`Consultants join by invite only. Ask the lead architect to add you to a project — your ${discipline === 'all' ? '' : `${discipline} `}drawings, RFIs and submittals then appear here, filtered to your discipline.`}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="card-m card-m-hover p-5">
              <Link href={`/projects/${p.id}/documents`} className="font-semibold text-lg hover:underline">
                {p.name}
              </Link>
              <p className="text-[12px] mt-1" style={{ color: 'var(--stone)' }}>
                Filtered for <span className="text-amber">{discipline}</span>
                {counts[p.id]
                  ? ` · ${counts[p.id].docs} docs · ${counts[p.id].rfis} RFIs · ${counts[p.id].subs} submittals`
                  : ''}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Link
                  href={`/projects/${p.id}/documents?discipline=${discipline}`}
                  className="btn-secondary text-[11px]"
                >
                  Drawings
                </Link>
                <Link href={`/projects/${p.id}/rfis`} className="btn-secondary text-[11px]">
                  RFIs
                </Link>
                <Link href={`/projects/${p.id}/submittals`} className="btn-secondary text-[11px]">
                  Submittals
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
