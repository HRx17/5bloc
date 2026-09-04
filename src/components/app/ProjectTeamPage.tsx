import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from '@/compat/next-navigation'
import { PROJECT_MEMBER_ROLES, ROLES, type RoleKey } from '@/lib/rbac/roles'
import { useToast } from '@/components/ui5/Toast'
import { ErrorState } from '@/components/ui5/ErrorState'
import { EmptyState } from '@/components/ui5/EmptyState'
import { Skeleton } from '@/components/ui5/Skeleton'
import { useLiveReload } from '@/lib/live/useLiveReload'

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

export default function ProjectTeamPage() {
  const params = useParams()
  const projectId = params.id as string
  const { toast } = useToast()

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<RoleKey>('contractor')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [lastInviteUrl, setLastInviteUrl] = useState('')

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true)
      setLoadError(null)
    }
    try {
      const res = await fetch(`/api/projects/${projectId}/members`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load the project team')
      setMembers(data.members || [])
    } catch (e) {
      if (!opts?.quiet) setLoadError(e)
    } finally {
      if (!opts?.quiet) setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  useLiveReload(load, ['project_members', 'profiles'])

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail || sendingInvite) return
    setSendingInvite(true)
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
      const acceptUrl = data.accept_url || ''
      setLastInviteUrl(acceptUrl)
      if (data.email_warning) {
        toast(
          `Invite created for ${inviteEmail}, but email was not delivered: ${data.email_warning}. Copy the link below and share it manually.`,
          'warning',
          9000
        )
      } else if (data.email_sent === false) {
        toast(
          `Invite created for ${inviteEmail}. Email was not sent — copy the accept link and share it.`,
          'warning',
          8000
        )
      } else {
        toast(`Invite emailed to ${inviteEmail}`, 'success')
      }
      setInviteEmail('')
      await load({ quiet: true })
    } catch (err: any) {
      toast(err?.message || 'Could not send the invite', 'error')
    } finally {
      setSendingInvite(false)
    }
  }

  const toggleCap = async (id: string, key: 'can_upload' | 'can_comment' | 'can_approve') => {
    const member = members.find((m) => m.id === id)
    if (!member) return
    const next = !member[key]
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: next } : m)))
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: id, [key]: next }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: !next } : m)))
        toast(data.error || 'Could not change that permission', 'error')
      }
    } catch (err: any) {
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: !next } : m)))
      toast(err?.message || 'Could not change that permission', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Team</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
          Invite contractors, builders, consultants and clients onto <em>this</em> project only.
          To add another architect who should see every job, invite them as a firm co-worker in
          Settings → Team, then start a group chat from Messages.
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
              {r === 'architect' ? 'Architect (this project only)' : ROLES[r]?.label || r}
            </option>
          ))}
        </select>
        <button className="btn-primary" disabled={sendingInvite}>
          {sendingInvite ? 'Sending…' : 'Invite'}
        </button>
      </form>

      {lastInviteUrl && (
        <div
          className="p-3 rounded-xl flex flex-col sm:flex-row sm:items-center gap-2"
          style={{ background: 'var(--surface-container)' }}
        >
          <p className="text-[12px] flex-1 break-all" style={{ color: 'var(--stone)' }}>
            Accept link:{' '}
            <code style={{ color: 'var(--amber)' }}>{lastInviteUrl}</code>
          </p>
          <button
            type="button"
            className="btn-secondary btn-sm shrink-0"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(lastInviteUrl)
                toast('Invite link copied', 'success')
              } catch {
                toast('Could not copy — select the link manually', 'warning')
              }
            }}
          >
            Copy link
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : loadError ? (
        <ErrorState title="Could not load the project team" error={loadError} onRetry={load} />
      ) : members.length === 0 ? (
        <EmptyState
          icon="group_add"
          title="No one else on this project yet"
          description="Invite the contractor, consultants and client above. Each invite is scoped to the role you pick, and you can fine-tune upload, comment and approve rights per person."
        />
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
