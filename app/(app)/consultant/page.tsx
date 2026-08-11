'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

const DISCIPLINES = ['all', 'architectural', 'structural', 'mep', 'electrical', 'plumbing', 'hvac', 'facade']

export default function ConsultantHome() {
  const [projects, setProjects] = useState<any[]>([])
  const [discipline, setDiscipline] = useState('structural')
  const [loading, setLoading] = useState(true)
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
      try {
        const res = await fetch('/api/projects')
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
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [discipline])

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
        <p style={{ color: 'var(--stone)' }}>Loading…</p>
      ) : projects.length === 0 ? (
        <div className="p-8 rounded-2xl text-center" style={{ background: 'var(--surface-container)' }}>
          <p className="font-semibold">No invited projects</p>
          <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
            Consultants join by invite only. Ask the lead architect to add you.
          </p>
        </div>
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
