'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

export default function ProjectPortalSettings() {
  const params = useParams()
  const projectId = params.id as string
  const { toast } = useToast()
  const [project, setProject] = useState<any>(null)
  const [settings, setSettings] = useState({
    show_overview: true,
    show_drawings: true,
    show_documents: true,
    show_payments: true,
    show_approvals: true,
    show_site: true,
    show_questions: true,
    welcome_note: '',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [projRes, portalRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/portal`),
      ])
      const projData = await projRes.json()
      if (!projRes.ok) throw new Error(projData.error || 'Failed to load portal settings')
      setProject(projData.project)
      const portalData = await portalRes.json().catch(() => ({}))
      if (portalRes.ok && portalData.settings) setSettings((s) => ({ ...s, ...portalData.settings }))
    } catch (e) {
      setLoadError(e)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/portal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal_enabled: true,
          settings,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || 'Could not save the portal settings', 'error')
        return
      }
      if (data.project) setProject(data.project)
      toast('Client portal enabled and saved', 'success')
    } catch (err: any) {
      toast(err?.message || 'Could not save the portal settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const portalPath = project?.portal_token
    ? `/portal/${project.portal_token}`
    : null

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-2xl">
        <ErrorState title="Could not load portal settings" error={loadError} onRetry={load} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Client portal</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
          Share a light, read-focused view with your client. No login required.
        </p>
      </div>

      <div className="p-4 rounded-xl" style={{ background: 'var(--surface-container)' }}>
        <p className="text-[12px]" style={{ color: 'var(--stone)' }}>
          Portal link
        </p>
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          {portalPath ? (
            <>
              <code className="text-[12px] break-all" style={{ color: 'var(--amber)' }}>
                {portalPath}
              </code>
              <Link href={portalPath} target="_blank" className="btn-secondary text-[11px]">
                Open
              </Link>
              <button
                className="btn-secondary text-[11px]"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`${window.location.origin}${portalPath}`)
                    toast('Portal link copied', 'success')
                  } catch {
                    toast('Could not copy the link — copy it manually', 'error')
                  }
                }}
              >
                Copy
              </button>
            </>
          ) : (
            <p className="text-[12px]" style={{ color: 'var(--stone)' }}>
              Enable & save to generate a unique portal link.
            </p>
          )}
        </div>
      </div>

      <textarea
        className="input-5bloc min-h-[90px]"
        placeholder="Welcome note"
        value={settings.welcome_note}
        onChange={(e) => setSettings({ ...settings, welcome_note: e.target.value })}
      />

      <div className="space-y-2">
        {(
          [
            ['show_overview', 'Progress overview'],
            ['show_documents', 'Shared documents'],
            ['show_approvals', 'Approval queue'],
            ['show_payments', 'Payment schedule'],
            ['show_questions', 'Ask a question'],
            ['show_site', 'Site updates'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={(settings as any)[key]}
              onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
      </div>

      <button className="btn-primary" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Enable & save portal'}
      </button>
    </div>
  )
}
