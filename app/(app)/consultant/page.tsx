'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

const DISCIPLINES = ['all', 'architectural', 'structural', 'mep', 'electrical', 'plumbing', 'hvac', 'facade']

export default function ConsultantHome() {
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
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-[36px]">Consultant workspace</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
          Discipline-scoped drawings, RFIs and submittals — without the firm noise.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DISCIPLINES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDiscipline(d)}
            className="chip capitalize"
            style={{
              color: discipline === d ? 'var(--amber)' : 'var(--stone)',
              background: discipline === d ? 'rgba(245,166,35,0.12)' : 'rgba(159,142,122,0.1)',
            }}
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
            <div key={p.id} className="p-5 rounded-2xl" style={{ background: 'var(--surface-container)' }}>
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
