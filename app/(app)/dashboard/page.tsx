'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import OnboardingChecklist from '@/components/layout/OnboardingChecklist'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

type AttentionItem = {
  id: string
  title: string
  why: string
  href: string
  actionLabel: string
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [plan, setPlan] = useState('free')
  const [role, setRole] = useState<string | null>(null)
  const [reviewBidCount, setReviewBidCount] = useState(0)
  const [overdueInvoiceCount, setOverdueInvoiceCount] = useState(0)
  const [unpaidInvoiceCount, setUnpaidInvoiceCount] = useState(0)
  const [pendingDocApprovals, setPendingDocApprovals] = useState(0)
  const [pendingDocProjectId, setPendingDocProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [activityError, setActivityError] = useState<unknown>(null)

  const loadActivity = useCallback(async () => {
    setActivityError(null)
    try {
      const res = await fetch('/api/activity?limit=8')
      if (!res.ok) throw new Error('Could not load recent activity')
      const a = await res.json()
      setActivity(a.activity || [])
    } catch (err) {
      setActivityError(err)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Could not load your projects')
      const p = await res.json()
      const nextProjects = p.projects || []
      setProjects(nextProjects)

      const [c, me] = await Promise.all([
        fetch('/api/clients').then((r) => r.json()).catch(() => ({ clients: [] })),
        fetch('/api/me').then((r) => r.json()).catch(() => ({ profile: {} })),
      ])
      setClients(c.clients || [])
      setPlan(me.profile?.plan || 'free')
      const nextRole = me.profile?.role || null
      setRole(nextRole)

      if (nextRole === 'architect') {
        const [invRes, bidRes, ...docResults] = await Promise.all([
          fetch('/api/invoices').then((r) => (r.ok ? r.json() : { invoices: [] })).catch(() => ({ invoices: [] })),
          fetch('/api/bids').then((r) => (r.ok ? r.json() : { bids: [] })).catch(() => ({ bids: [] })),
          ...nextProjects.slice(0, 4).map((proj: { id: string }) =>
            fetch(`/api/projects/${proj.id}/documents`)
              .then((r) => (r.ok ? r.json() : { documents: [] }))
              .then((d) => ({ projectId: proj.id, documents: d.documents || [] }))
              .catch(() => ({ projectId: proj.id, documents: [] as any[] }))
          ),
        ])

        const invoices = invRes.invoices || []
        setOverdueInvoiceCount(invoices.filter((i: any) => i.status === 'overdue').length)
        setUnpaidInvoiceCount(
          invoices.filter((i: any) => i.status === 'sent' || i.status === 'overdue').length
        )

        const bids = bidRes.bids || []
        setReviewBidCount(
          bids.filter((b: any) => b.status === 'submitted' || b.status === 'shortlisted').length
        )

        let pending = 0
        let firstPendingProject: string | null = null
        for (const result of docResults as { projectId: string; documents: any[] }[]) {
          const count = (result.documents || []).filter(
            (d) => (d.approval_status || 'pending') === 'pending'
          ).length
          if (count > 0 && !firstPendingProject) firstPendingProject = result.projectId
          pending += count
        }
        setPendingDocApprovals(pending)
        setPendingDocProjectId(firstPendingProject)
      } else {
        setReviewBidCount(0)
        setOverdueInvoiceCount(0)
        setUnpaidInvoiceCount(0)
        setPendingDocApprovals(0)
        setPendingDocProjectId(null)
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    loadActivity()
  }, [load, loadActivity])

  const active = projects.filter((p) => p.status === 'active').length
  const atLimit = plan === 'free' && projects.length >= 3
  const isArchitect = role === 'architect'

  const showFirstWeekGuide =
    isArchitect && !loading && !error && projects.length === 0 && clients.length === 0

  const attentionItems = useMemo((): AttentionItem[] => {
    if (!isArchitect || loading || error) return []
    const items: AttentionItem[] = []

    // Empty workspace uses the first-week guide instead of repeating these CTAs.
    if (projects.length === 0 && clients.length > 0) {
      items.push({
        id: 'no-projects',
        title: 'Create your first project',
        why: 'Projects unlock team invites, drawings, client portal, and bidding.',
        href: '/projects/new',
        actionLabel: 'New project',
      })
    }

    if (clients.length === 0 && projects.length > 0) {
      items.push({
        id: 'no-clients',
        title: 'Add a CRM contact',
        why: 'Link clients to projects and invoices so billing stays tidy.',
        href: '/clients',
        actionLabel: 'Add client',
      })
    }

    if (reviewBidCount > 0) {
      items.push({
        id: 'review-bids',
        title: `${reviewBidCount} bid${reviewBidCount === 1 ? '' : 's'} awaiting review`,
        why: 'Open tenders have contractor bids ready to shortlist or award.',
        href: '/marketplace',
        actionLabel: 'Review bids',
      })
    }

    if (overdueInvoiceCount > 0 || unpaidInvoiceCount > 0) {
      const title =
        overdueInvoiceCount > 0
          ? `${overdueInvoiceCount} overdue invoice${overdueInvoiceCount === 1 ? '' : 's'}`
          : `${unpaidInvoiceCount} unpaid invoice${unpaidInvoiceCount === 1 ? '' : 's'}`
      items.push({
        id: 'invoices',
        title,
        why:
          overdueInvoiceCount > 0
            ? 'Collections are past due — chase payment or mark paid when settled.'
            : 'Sent invoices are still outstanding.',
        href: '/invoices',
        actionLabel: 'Open invoices',
      })
    }

    if (pendingDocApprovals > 0 && pendingDocProjectId) {
      items.push({
        id: 'doc-approvals',
        title: `${pendingDocApprovals} document${pendingDocApprovals === 1 ? '' : 's'} pending approval`,
        why: 'Client portal or team uploads are waiting for your sign-off.',
        href: `/projects/${pendingDocProjectId}/documents`,
        actionLabel: 'Review documents',
      })
    }

    return items
  }, [
    isArchitect,
    loading,
    error,
    projects.length,
    clients.length,
    reviewBidCount,
    overdueInvoiceCount,
    unpaidInvoiceCount,
    pendingDocApprovals,
    pendingDocProjectId,
  ])

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[36px]">Workspace dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
            {isArchitect
              ? 'Your first-week checklist: projects, clients, and what needs attention.'
              : 'Projects, CRM contacts, and what needs attention.'}
          </p>
        </div>
        {atLimit ? (
          <Link href="/settings" className="btn-secondary text-[12px]">
            Upgrade to add projects
          </Link>
        ) : (
          <Link href="/projects/new" className="btn-primary text-[12px]">
            New project
          </Link>
        )}
      </div>

      {showFirstWeekGuide && (
        <section
          className="rounded-2xl p-5 md:p-6 space-y-4"
          style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-2)' }}
        >
          <div>
            <h2 className="text-lg font-semibold">Start your first week</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
              Three quick steps set up a working practice on 5Bloc — then the dashboard fills in as you go.
            </p>
          </div>
          <ol className="grid sm:grid-cols-3 gap-3">
            {[
              {
                n: '1',
                title: 'Add a client',
                why: 'CRM contacts power invoices and project ownership.',
                href: '/clients',
                label: 'Add client',
              },
              {
                n: '2',
                title: 'Create a project',
                why: 'Invite the team, share drawings, open the client portal.',
                href: '/projects/new',
                label: 'New project',
              },
              {
                n: '3',
                title: 'Upload a drawing',
                why: 'Documents unlock RFIs, approvals, and site coordination.',
                href: '/projects',
                label: 'Go to projects',
              },
            ].map((step) => (
              <li
                key={step.n}
                className="rounded-xl p-4 flex flex-col gap-2"
                style={{ background: 'var(--surface-container-low)' }}
              >
                <p className="text-[11px] font-semibold" style={{ color: 'var(--amber)' }}>
                  Step {step.n}
                </p>
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-[12px] flex-1" style={{ color: 'var(--stone)' }}>
                  {step.why}
                </p>
                <Link href={step.href} className="btn-secondary text-[11px] self-start">
                  {step.label}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {isArchitect && !loading && !error && attentionItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Needs attention</h2>
          <ul className="space-y-2">
            {attentionItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl"
                style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-2)' }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--stone)' }}>
                    {item.why}
                  </p>
                </div>
                <Link href={item.href} className="btn-primary text-[11px] shrink-0 self-start sm:self-center">
                  {item.actionLabel}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active projects', value: active },
          { label: 'CRM contacts', value: clients.length },
          { label: 'Total projects', value: projects.length },
          {
            label: 'Pipeline value',
            value: `₹${clients.reduce((s, c) => s + Number(c.total_value || 0), 0).toLocaleString()}`,
          },
        ].map((k) => (
          <div
            key={k.label}
            className="p-5 rounded-2xl"
            style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-2)' }}
          >
            <p className="text-[12px]" style={{ color: 'var(--stone)' }}>
              {k.label}
            </p>
            {loading ? (
              <Skeleton className="h-7 w-20 mt-2" />
            ) : (
              <p className="text-[24px] font-semibold mt-1">{error ? '—' : k.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Link href="/projects" className="text-[12px]" style={{ color: 'var(--amber)' }}>
              View all
            </Link>
          </div>
          {loading ? (
            <div className="grid md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title="Could not load your projects"
              description="Your workspace is fine — we just could not fetch it. Retry, or refresh in a moment."
              error={error}
              onRetry={load}
            />
          ) : projects.length === 0 ? (
            <EmptyState
              icon="apartment"
              title="No projects yet"
              description="Create your first project to invite contractors, share drawings, and open a client portal."
              actionLabel="Create project"
              href="/projects/new"
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {projects.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="p-4 rounded-xl block"
                  style={{ background: 'var(--surface-container)' }}
                >
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--stone)' }}>
                    {p.city} · {String(p.phase || '').replaceAll('_', ' ')}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Activity</h2>
          {activityError ? (
            <ErrorState
              compact
              title="Activity is unavailable"
              description="The feed did not load. Your project history is unaffected."
              onRetry={loadActivity}
            />
          ) : (
            <div className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--surface-container)' }}>
              {activity.length === 0 ? (
                <p className="text-[12px]" style={{ color: 'var(--stone)' }}>
                  Nothing yet. Uploads, approvals and invoices show up here as your team works.
                </p>
              ) : (
                activity.map((a) => (
                  <div key={a.id} className="text-[12px]">
                    <p className="font-medium">{a.entity_name || a.action}</p>
                    <p style={{ color: 'var(--stone)' }}>
                      {a.action} · {a.project_name || 'Project'} · {a.created_at?.slice(0, 10)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>

      <OnboardingChecklist />
    </div>
  )
}
