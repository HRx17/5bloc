'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { getProjectTabs } from '@/lib/rbac/nav'
import type { RoleKey } from '@/lib/rbac/roles'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface ProjectData {
  id: string
  name: string
  type: string
  phase: string
  status: string
  city: string
  state: string
  is_rera_registered: boolean
  rera_number: string
  portal_token?: string
  portal_enabled?: boolean
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const projectId = params.id as string
  const { toast } = useToast()
  const confirm = useConfirm()

  const [project, setProject] = useState<ProjectData | null>(null)
  const [memberRole, setMemberRole] = useState<RoleKey>('architect')
  const [showActions, setShowActions] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [res, me] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch('/api/me').then((r) => r.json()).catch(() => ({})),
      ])
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load project')
      setProject(data.project)
      // Fall back to the account role, never to architect, so tabs cannot over-expose
      setMemberRole((data.membership?.role || me.profile?.role || 'client') as RoleKey)
    } catch (e) {
      setError(e)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const tabs = useMemo(() => getProjectTabs(projectId, memberRole), [projectId, memberRole])

  const archiveProject = async () => {
    if (archiving || !project) return
    setShowActions(false)
    const ok = await confirm({
      title: 'Archive project',
      message: `“${project.name}” will be closed to day-to-day work and moved out of the active project list. Records stay intact, but the team will no longer see it in their workspace.`,
      confirmLabel: 'Archive project',
      variant: 'danger',
    })
    if (!ok) return
    setArchiving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast(data.error || 'Could not archive this project', 'error')
        return
      }
      toast(`${project.name} archived`, 'success')
      router.push('/projects')
    } catch (err: any) {
      toast(err?.message || 'Could not archive this project', 'error')
    } finally {
      setArchiving(false)
    }
  }

  useEffect(() => {
    if (!project || !tabs.length) return
    const allowed =
      pathname === `/projects/${projectId}` ||
      tabs.some((t) => pathname === t.path || pathname.startsWith(t.path + '/'))
    if (!allowed) router.replace(tabs[0].path)
  }, [project, tabs, pathname, projectId, router])

  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ErrorState
          title="Could not open this project"
          description="You may not have access to it, or the workspace could not be reached."
          error={error}
          onRetry={load}
        />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col h-full" aria-busy="true">
        <div
          className="px-6 pt-5 pb-4 shrink-0 space-y-5"
          style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-2)' }}
        >
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-9 w-72" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-24" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  const isTabActive = (tabPath: string) =>
    tabPath === `/projects/${projectId}` ? pathname === tabPath : pathname.startsWith(tabPath)

  const portalUrl = project.portal_token ? `/portal/${project.portal_token}` : null
  const canConfigurePortal = memberRole === 'architect'

  return (
    <div className="flex flex-col h-full select-none">
      <div
        className="px-6 pt-5 pb-0 shrink-0"
        style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-2)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip" style={{ background: 'rgba(159,142,122,.12)', color: 'var(--stone)' }}>
                  {project.type}
                </span>
                <span className="chip capitalize" style={{ color: 'var(--amber)', background: 'rgba(245,166,35,0.1)' }}>
                  {memberRole}
                </span>
                {project.is_rera_registered && (
                  <span className="chip flex items-center gap-1" style={{ background: 'rgba(111,220,140,.12)', color: 'var(--success)' }}>
                    <span className="material-icons-outlined text-[11px]">verified</span>
                    RERA
                  </span>
                )}
              </div>
              <h1 className="font-display text-[32px] leading-[36px] mt-1" style={{ color: 'var(--on-surface)' }}>
                {project.name}
              </h1>
              <div className="flex items-center gap-3 text-[12px]" style={{ color: 'var(--stone)' }}>
                <span className="flex items-center gap-1">
                  <span className="material-icons-outlined text-[13px]">place</span>
                  {project.city}, {project.state}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start relative">
              {canConfigurePortal && (
                <>
                  <Link href={`/projects/${projectId}/portal`} className="btn-secondary text-[12px]">
                    Portal settings
                  </Link>
                  {portalUrl ? (
                    <Link href={portalUrl} target="_blank" className="btn-secondary text-[12px]">
                      <span className="material-icons-outlined text-[15px]">open_in_new</span>
                      Open portal
                    </Link>
                  ) : (
                    <Link href={`/projects/${projectId}/portal`} className="btn-secondary text-[12px]">
                      Enable portal
                    </Link>
                  )}
                  <div>
                    <button
                      onClick={() => setShowActions(!showActions)}
                      className="btn-secondary"
                      style={{ padding: '10px 12px' }}
                    >
                      <span className="material-icons-outlined text-[18px]">more_horiz</span>
                    </button>
                    {showActions && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                        <div
                          className="absolute right-0 mt-2 w-48 py-1 z-20 text-[12px]"
                          style={{ background: 'var(--surface-container-high)', boxShadow: 'var(--shadow-4)' }}
                        >
                          <button
                            onClick={archiveProject}
                            disabled={archiving}
                            className="w-full text-left px-4 py-2.5 flex items-center gap-2 disabled:opacity-50"
                            style={{ color: 'var(--stone)' }}
                          >
                            <span className="material-icons-outlined text-[16px]">archive</span>
                            {archiving ? 'Archiving…' : 'Archive Project'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex overflow-x-auto gap-1">
            {tabs.map((tab) => {
              const active = isTabActive(tab.path)
              return (
                <Link
                  key={tab.key}
                  href={tab.path}
                  className="text-[12px] font-medium px-3 py-2.5 shrink-0 relative"
                  style={{
                    color: active ? 'var(--amber)' : 'var(--stone)',
                    fontWeight: active ? '600' : '500',
                    boxShadow: active ? 'inset 0 -2px 0 var(--amber-dk)' : 'none',
                  }}
                >
                  {tab.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </div>
    </div>
  )
}
