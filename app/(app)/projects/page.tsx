'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [q, setQ] = useState('')
  const [canCreate, setCanCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load projects')
      setProjects(data.projects || [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => setCanCreate(d.profile?.role === 'architect'))
      .catch(() => {})
  }, [load])

  const filtered = projects.filter((p) =>
    !q || p.name?.toLowerCase().includes(q.toLowerCase()) || p.city?.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[36px]">Projects</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
            {canCreate ? 'Your firm’s project workspaces.' : 'Project workspaces you have been invited to.'}
          </p>
        </div>
        {canCreate && (
          <Link href="/projects/new" className="btn-primary text-[12px]">
            New project
          </Link>
        )}
      </div>

      <input
        className="input-5bloc max-w-md"
        placeholder="Filter by name or city…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Could not load your projects" error={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="apartment"
          title={q ? 'No matching projects' : 'No projects'}
          description={
            q
              ? 'Try a different name or city filter.'
              : canCreate
                ? 'Create your first project workspace to start coordinating.'
                : 'When an architect invites you or awards your bid, the project appears here.'
          }
          actionLabel={!q && canCreate ? 'New project' : undefined}
          href={!q && canCreate ? '/projects/new' : undefined}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="p-5 rounded-2xl block"
              style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-2)' }}
            >
              <div className="flex justify-between gap-2">
                <p className="font-semibold">{p.name}</p>
                <span className="chip capitalize text-[10px]" style={{ color: 'var(--stone)' }}>
                  {p.status}
                </span>
              </div>
              <p className="text-[12px] mt-2" style={{ color: 'var(--stone)' }}>
                {p.city}, {p.state} · {String(p.phase || '').replaceAll('_', ' ')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
