import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from '@/compat/next-link'
import OnboardingChecklist from '@/components/layout/OnboardingChecklist'
import { ErrorState } from '@/components/ui5/ErrorState'
import { EmptyState } from '@/components/ui5/EmptyState'
import { Skeleton } from '@/components/ui5/Skeleton'
import { isPaywallEnforced } from '@/lib/payments/gates'
import { useLiveReload } from '@/lib/live/useLiveReload'

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
  const [upcomingMeetingCount, setUpcomingMeetingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [activityError, setActivityError] = useState<unknown>(null)

  const loadActivity = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setActivityError(null)
    try {
      const res = await fetch('/api/activity?limit=8')
      if (!res.ok) throw new Error('Could not load recent activity')
      const a = await res.json()
      setActivity(a.activity || [])
    } catch (err) {
      if (!opts?.quiet) setActivityError(err)
    }
  }, [])

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true)
      setError(null)
    }
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Could not load your projects')
      const p = await res.json()
      const nextProjects = p.projects || []
      setProjects(nextProjects)

      const [c, me, meetRes] = await Promise.all([
        fetch('/api/clients').then((r) => r.json()).catch(() => ({ clients: [] })),
        fetch('/api/me').then((r) => r.json()).catch(() => ({ profile: {} })),
        fetch('/api/meetings?upcoming=1').then((r) => (r.ok ? r.json() : { meetings: [] })).catch(() => ({ meetings: [] })),
      ])
      setClients(c.clients || [])
      setPlan(me.profile?.plan || 'free')
      setUpcomingMeetingCount((meetRes.meetings || []).length)
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
      if (!opts?.quiet) setError(err)
    } finally {
      if (!opts?.quiet) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    loadActivity()
  }, [load, loadActivity])

  useLiveReload(load, ['invoices', 'bids', 'projects', 'documents', 'clients', 'meetings'])
  useLiveReload(loadActivity, ['invoices', 'bids', 'documents', 'rfis', 'issues'])

  const active = projects.filter((p) => p.status === 'active').length
  const atLimit = isPaywallEnforced() && plan === 'free' && projects.length >= 3
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

    if (upcomingMeetingCount > 0) {
      items.push({
        id: 'meetings',
        title: `${upcomingMeetingCount} upcoming meeting${upcomingMeetingCount === 1 ? '' : 's'}`,
        why: 'Attendees get an invite now and a reminder before the start time.',
        href: '/calendar',
        actionLabel: 'Open calendar',
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
    upcomingMeetingCount,
  ])

  return (
    <div className="page-m space-y-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-m-title">Workspace dashboard</h1>
          <p className="page-m-sub">
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Active projects', value: active, note: `${projects.length} total in workspace` },
          { label: 'CRM contacts', value: clients.length, note: 'Clients linked to billing' },
          { label: 'Total projects', value: projects.length, note: 'Across all phases' },
          {
            label: 'Pipeline value',
            value: `₹${clients.reduce((s, c) => s + Number(c.total_value || 0), 0).toLocaleString()}`,
            note: 'Sum of client contract values',
          },
        ].map((k) => (
          <div key={k.label} className="card-m stat-m">
            <p className="stat-m-label">{k.label}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-2" />
            ) : (
              <p className="stat-m-value">{error ? '—' : k.value}</p>
            )}
            <p className="stat-m-note">{k.note}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <section className="lg:col-span-2 card-m overflow-hidden">
          <div className="card-m-head">
            <h2 className="card-m-title">Projects</h2>
            <Link href="/projects" className="text-[12px] font-semibold" style={{ color: 'var(--amber-dk)' }}>
              View all
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-5">
              <ErrorState
                title="Could not load your projects"
                description="Your workspace is fine — we just could not fetch it. Retry, or refresh in a moment."
                error={error}
                onRetry={load}
              />
            </div>
          ) : projects.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon="apartment"
                title="No projects yet"
                description="Create your first project to invite contractors, share drawings, and open a client portal."
                actionLabel="Create project"
                href="/projects/new"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-m">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Phase</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.slice(0, 6).map((p) => {
                    const phase = String(p.phase || '').replaceAll('_', ' ')
                    const status = String(p.status || 'active')
                    const tone =
                      status === 'completed'
                        ? 'chip-m chip-m-green'
                        : status === 'on_hold'
                          ? 'chip-m chip-m-red'
                          : 'chip-m chip-m-amber'
                    return (
                      <tr
                        key={p.id}
                        className="cursor-pointer"
                      >
                        <td>
                          <Link href={`/projects/${p.id}`} className="font-semibold">
                            {p.name}
                          </Link>
                          <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--stone)' }}>
                            {p.city || 'Location not set'}
                          </div>
                        </td>
                        <td className="capitalize" style={{ color: 'var(--on-surface-variant)' }}>
                          {phase || '—'}
                        </td>
                        <td>
                          <span className={tone}>{status.replaceAll('_', ' ')}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card-m overflow-hidden">
          <div className="card-m-head">
            <h2 className="card-m-title">Activity</h2>
          </div>
          {activityError ? (
            <div className="p-5">
              <ErrorState
                compact
                title="Activity is unavailable"
                description="The feed did not load. Your project history is unaffected."
                onRetry={loadActivity}
              />
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {activity.length === 0 ? (
                <p className="text-[12.5px]" style={{ color: 'var(--stone)' }}>
                  Nothing yet. Uploads, approvals and invoices show up here as your team works.
                </p>
              ) : (
                activity.map((a) => {
                  const action = String(a.action || '')
                  const icon = action.includes('invoice')
                    ? 'receipt_long'
                    : action.includes('meeting')
                      ? 'event'
                      : action.includes('document') || action.includes('submittal')
                        ? 'description'
                        : action.includes('project')
                          ? 'apartment'
                          : 'bolt'
                  return (
                    <div key={a.id} className="flex gap-3">
                      <span className="feed-m-icon">
                        <span className="material-icons-outlined">{icon}</span>
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate">{a.entity_name || action}</p>
                        <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--stone)' }}>
                          {action.replaceAll('.', ' ')} · {a.project_name || 'Project'}
                          {a.created_at ? ` · ${a.created_at.slice(0, 10)}` : ''}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </section>
      </div>


      <OnboardingChecklist />
    </div>
  )
}
