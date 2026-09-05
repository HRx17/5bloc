import React, { useCallback, useEffect, useState } from 'react'
import Link from '@/compat/next-link'
import { ErrorState } from '@/components/ui5/ErrorState'
import { EmptyState } from '@/components/ui5/EmptyState'
import { Skeleton } from '@/components/ui5/Skeleton'
import { useLiveReload } from '@/lib/live/useLiveReload'

type Project = {
  id: string
  name: string
  city?: string
  state?: string
  phase?: string
  status?: string
}

type PendingDoc = {
  id: string
  name: string
  project_id: string
  project_name: string
}

type ActivityItem = {
  id: string
  action?: string
  entity_type?: string
  created_at: string
  projects?: { name?: string } | null
}

const phaseLabel = (phase?: string) => (phase ? phase.replaceAll('_', ' ') : 'Getting started')

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [pending, setPending] = useState<PendingDoc[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true)
      setError(null)
    }
    try {
      const projectRes = await fetch('/api/projects')
      if (!projectRes.ok) throw new Error('Could not load your projects')
      const projectData = await projectRes.json()
      const list: Project[] = projectData.projects || []
      setProjects(list)

      const activityData = await fetch('/api/activity?limit=8')
        .then((r) => r.json())
        .catch(() => ({}))
      setActivity(activityData.activity || [])

      // Drawings shared with the client that still need a decision
      const docLists = await Promise.all(
        list.slice(0, 5).map(async (p) => {
          const res = await fetch(`/api/projects/${p.id}/documents`)
          if (!res.ok) return []
          const data = await res.json()
          return (data.documents || [])
            .filter((d: any) => d.shared_with_client && d.approval_status === 'pending')
            .map((d: any) => ({ id: d.id, name: d.name, project_id: p.id, project_name: p.name }))
        })
      )
      setPending(docLists.flat())
    } catch (err) {
      if (!opts?.quiet) setError(err)
    } finally {
      if (!opts?.quiet) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useLiveReload(load, ['projects', 'documents'])

  if (loading) {
    return (
      <div className="page-m space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-28 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-m space-y-8">
      <div>
        <h1 className="page-m-title">Your projects</h1>
        <p className="page-m-sub">
          Progress, drawings to review, and what your architect has been working on.
        </p>
      </div>

      {pending.length > 0 && (
        <section
          className="card-m p-5"
          style={{ background: 'rgba(245,166,35,0.08)', boxShadow: 'inset 0 0 0 1px rgba(245,166,35,0.25)' }}
        >
          <h2 className="card-m-title" style={{ color: 'var(--amber)' }}>
            {pending.length} drawing{pending.length === 1 ? '' : 's'} waiting on you
          </h2>
          <div className="mt-3 space-y-2">
            {pending.slice(0, 5).map((d) => (
              <Link
                key={d.id}
                href={`/projects/${d.project_id}/documents`}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--surface-container)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="feed-m-icon">
                    <span className="material-icons-outlined" aria-hidden>description</span>
                  </span>
                  <div>
                    <p className="text-xs font-medium">{d.name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--stone)' }}>
                      {d.project_name}
                    </p>
                  </div>
                </div>
                <span className="text-[11px]" style={{ color: 'var(--amber)' }}>
                  Review
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!error && projects.length > 0 && pending.length === 0 && (
        <section className="card-m px-5 py-4 flex items-center gap-3">
          <span className="feed-m-icon">
            <span className="material-icons-outlined" style={{ color: 'var(--success)' }} aria-hidden>
              task_alt
            </span>
          </span>
          <p className="text-sm" style={{ color: 'var(--stone)' }}>
            Nothing needs your approval right now. Your architect will notify you when a drawing is ready to review.
          </p>
        </section>
      )}

      <section>
        <h2 className="card-m-title mb-4">Projects</h2>
        {error ? (
          <ErrorState
            title="Could not load your projects"
            description="This does not mean your project is gone — we could not reach the server. Try again."
            error={error}
            onRetry={load}
          />
        ) : projects.length === 0 ? (
          <EmptyState
            icon="home_work"
            title="Your project workspace is not open yet"
            description="Your architect will invite you as soon as it is ready. You will then see progress, drawings to review, and every update in one place — no email chasing."
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="card-m card-m-hover p-5 block">
                <div className="flex justify-between gap-2">
                  <p className="font-semibold">{p.name}</p>
                  {p.status && <span className="chip-m capitalize">{p.status}</span>}
                </div>
                <p className="text-[12px] mt-2 capitalize" style={{ color: 'var(--stone)' }}>
                  {[p.city, p.state].filter(Boolean).join(', ') || '—'} · {phaseLabel(p.phase)}
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="chip-m chip-m-amber">Drawings</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {activity.length > 0 && (
        <section>
          <h2 className="card-m-title mb-4">Recent updates</h2>
          <div className="card-m overflow-x-auto">
            <table className="table-m">
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id}>
                    <td className="capitalize">
                      {(a.action || 'updated').replaceAll('_', ' ')} {a.entity_type || ''}
                    </td>
                    <td style={{ color: 'var(--stone)' }}>
                      {a.projects?.name || ''} · {new Date(a.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
