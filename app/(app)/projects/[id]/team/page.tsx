'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PROJECT_MEMBER_ROLES, type RoleKey } from '@/lib/rbac/roles'

type Member = {
  id: string
  full_name?: string
  invite_email?: string
  role: RoleKey
  accepted_at?: string | null
  can_upload: boolean
  can_comment: boolean
  can_approve: boolean
}

export default function ProjectTeam() {
  const params = useParams()
  const projectId = params.id as string

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<RoleKey>('contractor')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [message, setMessage] = useState('')
  const [lastInviteUrl, setLastInviteUrl] = useState('')

  const load = async () => {
    const res = await fetch(`/api/projects/${projectId}/members`)
    const data = await res.json()
    setMembers(data.members || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [projectId])

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setSendingInvite(true)
    setMessage('')
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          email: inviteEmail,
          role: inviteRole,
          can_upload: inviteRole !== 'client',
          can_comment: true,
          can_approve: inviteRole === 'builder' || inviteRole === 'client',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invite failed')
      setLastInviteUrl(data.accept_url || '')
      setMessage(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
      await load()
    } catch (err: any) {
      setMessage(err.message)
    } finally {
      setSendingInvite(false)
    }
  }

  const toggleCap = async (id: string, key: 'can_upload' | 'can_comment' | 'can_approve') => {
    const member = members.find((m) => m.id === id)
    if (!member) return
    const next = !member[key]
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: next } : m)))
    await fetch(`/api/projects/${projectId}/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: id, [key]: next }),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Team</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
          Invite contractors, builders, consultants and clients with role-scoped access.
        </p>
      </div>

      <form
        onSubmit={handleInviteSubmit}
        className="p-4 rounded-xl flex flex-col md:flex-row gap-3"
        style={{ background: 'var(--surface-container)' }}
      >
        <input
          className="input-5bloc flex-1"
          type="email"
          required
          placeholder="Email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
        />
        <select
          className="input-5bloc"
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value as RoleKey)}
        >
          {PROJECT_MEMBER_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button className="btn-primary" disabled={sendingInvite}>
          {sendingInvite ? 'Sending…' : 'Invite'}
        </button>
      </form>

      {message && <p className="text-sm" style={{ color: 'var(--amber)' }}>{message}</p>}
      {lastInviteUrl && (
        <p className="text-[12px]" style={{ color: 'var(--stone)' }}>
          Accept link: <code style={{ color: 'var(--amber)' }}>{lastInviteUrl}</code>
        </p>
      )}

      {loading ? (
        <p style={{ color: 'var(--stone)' }}>Loading…</p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3"
              style={{ background: 'var(--surface-container)' }}
            >
              <div>
                <p className="font-semibold">{m.full_name || m.invite_email}</p>
                <p className="text-[12px] capitalize" style={{ color: 'var(--stone)' }}>
                  {m.role} · {m.accepted_at ? 'Active' : 'Pending'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: 'var(--stone)' }}>
                {(['can_upload', 'can_comment', 'can_approve'] as const).map((key) => (
                  <label key={key} className="flex items-center gap-1">
                    <input type="checkbox" checked={!!m[key]} onChange={() => toggleCap(m.id, key)} />
                    {key.replace('can_', '')}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
