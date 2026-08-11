'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function ProjectPortalSettings() {
  const params = useParams()
  const projectId = params.id as string
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
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((d) => {
        setProject(d.project)
      })
    fetch(`/api/projects/${projectId}/portal`)
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings((s) => ({ ...s, ...d.settings }))
      })
      .catch(() => {})
  }, [projectId])

  const save = async () => {
    setSaving(true)
    const res = await fetch(`/api/projects/${projectId}/portal`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        portal_enabled: true,
        settings,
      }),
    })
    const data = await res.json()
    setSaving(false)
    setMsg(res.ok ? 'Portal enabled and saved' : data.error || 'Save failed')
    if (res.ok && data.project) setProject(data.project)
  }

  const portalPath = project?.portal_token
    ? `/portal/${project.portal_token}`
    : null

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
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}${portalPath}`)}
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
      {msg && <p className="text-sm" style={{ color: 'var(--amber)' }}>{msg}</p>}
    </div>
  )
}
