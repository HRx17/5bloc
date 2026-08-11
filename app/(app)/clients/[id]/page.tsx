'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface CommLog {
  id: string
  type: 'call' | 'email' | 'meeting' | string
  summary: string
  date: string
}

interface ClientProject {
  id: string
  name: string
  phase: string
  status?: string
  portal_token?: string | null
  portal_enabled?: boolean
}

interface ClientDetail {
  id: string
  full_name: string
  email: string
  phone: string
  company: string
  city: string
  state: string
  pipeline_stage: string
  total_value: number
  notes: string
  projects: ClientProject[]
  notes_log: CommLog[]
  commLogs: CommLog[]
}

export default function ClientProfile() {
  const params = useParams()
  const clientId = params.id as string

  const [client, setClient] = useState<ClientDetail | null>(null)
  const [draft, setDraft] = useState({ full_name: '', email: '', phone: '', company: '' })
  const [savingContact, setSavingContact] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)
  const [error, setError] = useState('')
  const [newLog, setNewLog] = useState({ type: 'call' as const, summary: '' })
  const [orgProjects, setOrgProjects] = useState<{ id: string; name: string; client_id?: string | null }[]>([])
  const [linkProjectId, setLinkProjectId] = useState('')
  const [linking, setLinking] = useState(false)

  const load = async () => {
    const res = await fetch(`/api/clients/${clientId}`)
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Not found')
      return
    }
    const notes_log = data.notes_log || data.commLogs || data.client?.notes_log || []
    const next: ClientDetail = {
      id: data.client.id,
      full_name: data.client.full_name || data.client.name || '',
      email: data.client.email || '',
      phone: data.client.phone || '',
      company: data.client.company || '',
      city: data.client.city || '',
      state: data.client.state || '',
      pipeline_stage: data.client.pipeline_stage || 'prospect',
      total_value: Number(data.client.total_value || 0),
      notes: data.client.notes || '',
      projects: data.projects || [],
      notes_log,
      commLogs: notes_log,
    }
    setClient(next)
    setDraft({
      full_name: next.full_name,
      email: next.email,
      phone: next.phone,
      company: next.company,
    })
  }

  useEffect(() => {
    load()
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => setOrgProjects(d.projects || []))
      .catch(() => {})
  }, [clientId])

  useEffect(() => {
    if (!client) return
    const timer = setTimeout(async () => {
      setSavingNotes(true)
      await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: client.notes }),
      })
      setSavingNotes(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [client?.notes, clientId])

  const handleSaveContact = async () => {
    if (!client) return
    setSavingContact(true)
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to save')
        return
      }
      setClient({
        ...client,
        full_name: draft.full_name,
        email: draft.email,
        phone: draft.phone,
        company: draft.company,
      })
    } finally {
      setSavingContact(false)
    }
  }

  const handleAddCommLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client || !newLog.summary) return
    const res = await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comm_log: newLog }),
    })
    if (res.ok) {
      setNewLog({ type: 'call', summary: '' })
      await load()
    }
  }

  const updateStage = async (pipeline_stage: string) => {
    if (!client) return
    setClient({ ...client, pipeline_stage })
    await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipeline_stage }),
    })
  }

  const handleLinkProject = async () => {
    if (!linkProjectId) return
    setLinking(true)
    try {
      const res = await fetch(`/api/projects/${linkProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to link project')
        return
      }
      setLinkProjectId('')
      await load()
    } finally {
      setLinking(false)
    }
  }

  const portalProject = client?.projects.find((p) => p.portal_token)
  const unlinkedProjects = orgProjects.filter(
    (p) => !p.client_id || p.client_id !== clientId
  ).filter((p) => !client?.projects.some((cp) => cp.id === p.id))

  if (error) {
    return (
      <div className="p-8">
        <p style={{ color: 'var(--error)' }}>{error}</p>
        <Link href="/clients" className="btn-secondary mt-4 inline-flex text-[12px]">
          Back to CRM
        </Link>
      </div>
    )
  }

  if (!client) {
    return <div className="p-8" style={{ color: 'var(--stone)' }}>Loading contact…</div>
  }

  const logs = client.notes_log?.length ? client.notes_log : client.commLogs

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/clients" className="text-[12px]" style={{ color: 'var(--stone)' }}>
            ← CRM contacts
          </Link>
          <h1 className="font-display text-[32px] mt-2">{client.full_name}</h1>
          <p className="text-sm" style={{ color: 'var(--stone)' }}>
            {client.company || 'Individual'} · {client.city || '—'}
          </p>
          {portalProject?.portal_token && (
            <Link
              href={`/portal/${portalProject.portal_token}`}
              className="inline-flex mt-2 text-[12px]"
              style={{ color: 'var(--amber)' }}
              target="_blank"
            >
              Open portal →
            </Link>
          )}
        </div>
        <select
          className="input-5bloc max-w-[160px]"
          value={client.pipeline_stage}
          onChange={(e) => updateStage(e.target.value)}
        >
          {['prospect', 'briefing', 'proposal', 'won', 'lost'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-5bloc md:col-span-2 space-y-3">
          <h3 className="text-xs font-semibold text-amber">Contact</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] mb-1" style={{ color: 'var(--stone)' }}>Name</label>
              <input
                className="input-5bloc text-sm"
                value={draft.full_name}
                onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] mb-1" style={{ color: 'var(--stone)' }}>Company</label>
              <input
                className="input-5bloc text-sm"
                value={draft.company}
                onChange={(e) => setDraft({ ...draft, company: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] mb-1" style={{ color: 'var(--stone)' }}>Email</label>
              <input
                className="input-5bloc text-sm"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] mb-1" style={{ color: 'var(--stone)' }}>Phone</label>
              <input
                className="input-5bloc text-sm"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-sm">Pipeline value: ₹{client.total_value.toLocaleString()}</p>
            <button
              type="button"
              className="btn-primary text-[12px]"
              onClick={handleSaveContact}
              disabled={savingContact}
            >
              {savingContact ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
        <div className="card-5bloc space-y-3">
          <h3 className="text-xs font-semibold text-amber mb-2">Linked projects</h3>
          {client.projects.length === 0 ? (
            <p className="text-[12px]" style={{ color: 'var(--stone)' }}>None yet</p>
          ) : (
            <ul className="space-y-2">
              {client.projects.map((p) => (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}`} className="text-sm hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-[11px]" style={{ color: 'var(--stone)' }}>
                    {String(p.phase || '').replaceAll('_', ' ')}
                    {p.portal_token ? ' · portal' : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {unlinkedProjects.length > 0 && (
            <div className="pt-2 space-y-2" style={{ boxShadow: '0 -1px 0 rgba(159,142,122,0.10)' }}>
              <p className="text-[11px]" style={{ color: 'var(--stone)' }}>Link to project</p>
              <select
                className="input-5bloc text-xs"
                value={linkProjectId}
                onChange={(e) => setLinkProjectId(e.target.value)}
              >
                <option value="">Select project…</option>
                {unlinkedProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-secondary text-[11px] w-full"
                disabled={!linkProjectId || linking}
                onClick={handleLinkProject}
              >
                {linking ? 'Linking…' : 'Link project'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card-5bloc space-y-2">
        <div className="flex justify-between">
          <h3 className="text-xs font-semibold text-amber">Notes</h3>
          {savingNotes && <span className="text-[11px]" style={{ color: 'var(--stone)' }}>Saving…</span>}
        </div>
        <textarea
          className="input-5bloc min-h-[120px]"
          value={client.notes}
          onChange={(e) => setClient({ ...client, notes: e.target.value })}
        />
      </div>

      <div className="card-5bloc space-y-4">
        <h3 className="text-xs font-semibold text-amber">Communication log</h3>
        <form onSubmit={handleAddCommLog} className="flex flex-col md:flex-row gap-2">
          <select
            className="input-5bloc"
            value={newLog.type}
            onChange={(e) => setNewLog({ ...newLog, type: e.target.value as any })}
          >
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
          </select>
          <input
            className="input-5bloc flex-1"
            placeholder="Summary"
            value={newLog.summary}
            onChange={(e) => setNewLog({ ...newLog, summary: e.target.value })}
          />
          <button className="btn-primary text-[12px]" type="submit">
            Add
          </button>
        </form>
        <ul className="space-y-2">
          {(logs || []).map((log) => (
            <li key={log.id} className="text-sm">
              <span className="capitalize" style={{ color: 'var(--amber)' }}>
                {log.type}
              </span>{' '}
              · {log.summary}
              <span className="block text-[11px]" style={{ color: 'var(--stone)' }}>
                {log.date}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
