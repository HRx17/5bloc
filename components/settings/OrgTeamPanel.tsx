'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { USER_ROLES, type UserRole } from '@/lib/roles'

interface TeamMemberRow {
  id: string
  member_role: string
  status: string
  profiles: { id: string; full_name: string | null; email: string | null; role: string | null } | null
}

interface PendingInvite {
  id: string
  email: string
  inviteLink: string
  user_role: string | null
  member_role: string
}

interface JoinRequest {
  id: string
  requested_org_name: string
  message: string | null
  profiles: { full_name: string | null; email: string | null; role: string | null } | null
}

export default function OrgTeamPanel() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [members, setMembers] = useState<TeamMemberRow[]>([])
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [email, setEmail] = useState('')
  const [userRole, setUserRole] = useState<UserRole>('architect')
  const [memberRole, setMemberRole] = useState<'member' | 'admin'>('member')
  const [busy, setBusy] = useState(false)
  const [lastInviteLink, setLastInviteLink] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/org/team')
      const json = await res.json()
      if (res.ok) {
        setIsAdmin(!!json.isAdmin)
        setMembers(json.members ?? [])
        setInvites(json.invites ?? [])
        setJoinRequests(json.joinRequests ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !isAdmin) return
    setBusy(true)
    try {
      const res = await fetch('/api/org/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), userRole, memberRole }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || 'Could not send invite', 'error')
        return
      }
      setEmail('')
      if (json.inviteLink) {
        setLastInviteLink(json.inviteLink)
        toast('Invite email sent', 'success')
      } else if (json.added) {
        toast('Team member added', 'success')
      }
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function revokeInvite(id: string) {
    const res = await fetch(`/api/org/team?inviteId=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      toast(json.error || 'Could not revoke invite', 'error')
      return
    }
    toast('Invite revoked', 'success')
    await load()
  }

  async function reviewRequest(id: string, action: 'approve' | 'reject') {
    const res = await fetch(`/api/org/join-requests/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast(json.error || 'Action failed', 'error')
      return
    }
    toast(action === 'approve' ? 'Member approved' : 'Request declined', 'success')
    await load()
  }

  function copyLink(link: string) {
    void navigator.clipboard.writeText(link)
    toast('Invite link copied', 'success')
  }

  if (loading) {
    return <p className="text-[12px]" style={{ color: 'var(--stone)' }}>Loading team…</p>
  }

  return (
    <div className="space-y-6">
      {isAdmin && joinRequests.length > 0 && (
        <div className="card-5bloc space-y-3">
          <h3 className="text-sm font-semibold pb-1" style={{ color: 'var(--amber)' }}>Pending join requests</h3>
          {joinRequests.map((req) => (
            <div
              key={req.id}
              className="flex flex-wrap items-center justify-between gap-3 py-2 last:border-0"
              style={{ borderBottom: '1px solid var(--hairline)' }}
            >
              <div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--on-surface)' }}>
                  {req.profiles?.full_name || req.profiles?.email || 'User'}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--stone)' }}>
                  Wants to join · {req.profiles?.email}
                  {req.profiles?.role ? ` · ${req.profiles.role.replace(/_/g, ' ')}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => void reviewRequest(req.id, 'reject')} className="btn-secondary py-1.5 px-3 text-xs">
                  Decline
                </button>
                <button type="button" onClick={() => void reviewRequest(req.id, 'approve')} className="btn-primary py-1.5 px-3 text-xs">
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="card-5bloc space-y-4">
          <h3 className="text-sm font-semibold pb-2.5" style={{ color: 'var(--amber)' }}>Invite firm co-worker</h3>
          <form onSubmit={(e) => void sendInvite(e)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone)' }}>App role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="input-5bloc py-1.5 text-xs w-full"
                >
                  {USER_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone)' }}>Firm permission</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value as 'member' | 'admin')}
                  className="input-5bloc py-1.5 text-xs w-full"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 items-end">
              <div className="grow">
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone)' }}>Co-worker email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. colleague@firm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-5bloc py-1.5 text-xs"
                />
              </div>
              <button type="submit" disabled={busy} className="btn-primary py-2 px-6 text-xs h-[34px]">
                {busy ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </form>
          {lastInviteLink && (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--overlay-hover)' }}>
              <input readOnly value={lastInviteLink} className="input-5bloc py-1.5 text-[11px] flex-1" />
              <button type="button" onClick={() => copyLink(lastInviteLink)} className="btn-secondary py-1.5 px-3 text-xs shrink-0">
                Copy link
              </button>
            </div>
          )}
        </div>
      )}

      {isAdmin && invites.length > 0 && (
        <div className="card-5bloc space-y-3">
          <h3 className="text-xs font-semibold" style={{ color: 'var(--stone)' }}>Pending invites</h3>
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between gap-3 text-xs">
              <div>
                <span style={{ color: 'var(--on-surface)' }}>{inv.email}</span>
                {inv.user_role && (
                  <span className="ml-2 capitalize" style={{ color: 'var(--stone)' }}>
                    · {inv.user_role.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => copyLink(inv.inviteLink)} className="font-semibold" style={{ color: 'var(--amber)' }}>
                  Copy link
                </button>
                <button type="button" onClick={() => void revokeInvite(inv.id)} style={{ color: 'var(--stone)' }}>
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card-5bloc space-y-4">
        <h3 className="text-xs font-semibold pb-2.5" style={{ color: 'var(--stone)' }}>Firm workspace members</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-medium" style={{ color: 'var(--stone)' }}>
                <th className="pb-2 pl-2">Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">App role</th>
                <th className="pb-2 pr-2">Firm role</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--hairline)', color: 'var(--stone)' }}>
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="py-3 pl-2 font-semibold" style={{ color: 'var(--on-surface)' }}>
                    {member.profiles?.full_name || member.profiles?.email || 'Member'}
                  </td>
                  <td className="py-3">{member.profiles?.email}</td>
                  <td className="py-3 capitalize">{(member.profiles?.role || 'member').replace(/_/g, ' ')}</td>
                  <td className="py-3 pr-2 capitalize">{member.member_role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!isAdmin && (
        <p className="text-[11px]" style={{ color: 'var(--stone)' }}>Only firm admins can invite teammates or approve join requests.</p>
      )}
    </div>
  )
}
