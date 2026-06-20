'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface TeamMember {
  id: string
  profile_id: string | null
  invite_email: string | null
  display_name: string | null
  is_external: boolean
  project_role: string
  status: string
  profiles?: { full_name: string | null; email: string | null; role: string | null } | null
}

interface ProjectTeam {
  id: string
  name: string
  template_key: string | null
  project_team_members: TeamMember[]
}

interface Template {
  key: string
  name: string
  icon: string
}

export default function ProjectTeam() {
  const params = useParams()
  const projectId = params.id as string
  const { toast } = useToast()

  const [teams, setTeams] = useState<ProjectTeam[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [customName, setCustomName] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadTeams() {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/teams`)
      const json = await res.json()
      if (res.ok) {
        setTeams(json.teams ?? [])
        setTemplates(json.templates ?? [])
        if (!selectedTeamId && json.teams?.[0]?.id) setSelectedTeamId(json.teams[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTeams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function createFromTemplate(template: Template) {
    setBusy(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: template.name, templateKey: template.key }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || 'Could not create team', 'error')
        return
      }
      toast(`${template.name} created`, 'success')
      await loadTeams()
      if (json.team?.id) setSelectedTeamId(json.team.id)
    } finally {
      setBusy(false)
    }
  }

  async function createCustomTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!customName.trim()) return
    setBusy(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: customName.trim(), templateKey: 'custom' }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || 'Could not create team', 'error')
        return
      }
      setCustomName('')
      toast('Team created', 'success')
      await loadTeams()
      if (json.team?.id) setSelectedTeamId(json.team.id)
    } finally {
      setBusy(false)
    }
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTeamId || !inviteEmail.trim()) return
    setBusy(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/teams/${selectedTeamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          displayName: inviteName.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || 'Could not add member', 'error')
        return
      }
      setInviteEmail('')
      setInviteName('')
      toast('Person added to team', 'success')
      await loadTeams()
    } finally {
      setBusy(false)
    }
  }

  async function removeMember(memberId: string) {
    if (!selectedTeamId) return
    setBusy(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/teams/${selectedTeamId}/members?memberId=${encodeURIComponent(memberId)}`,
        { method: 'DELETE' },
      )
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || 'Could not remove member', 'error')
        return
      }
      toast('Member removed', 'success')
      await loadTeams()
    } finally {
      setBusy(false)
    }
  }

  const activeTeam = teams.find((t) => t.id === selectedTeamId)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 font-body">
      <div>
        <h1 className="text-2xl font-bold tracking-wide" style={{ color: 'var(--on-surface)' }}>Project teams</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--stone)' }}>
          Create discipline teams and add people inside or outside your firm.
        </p>
      </div>

      <div className="card-5bloc space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--amber)' }}>Template teams</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((tpl) => (
            <button
              key={tpl.key}
              type="button"
              disabled={busy}
              onClick={() => void createFromTemplate(tpl)}
              className="flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
              style={{ background: 'var(--surface-container-low)', boxShadow: 'inset 0 0 0 1px var(--hairline)' }}
            >
              <span className="material-icons-outlined text-[20px]" style={{ color: 'var(--amber)' }}>{tpl.icon}</span>
              <span className="text-[13px] font-medium" style={{ color: 'var(--on-surface)' }}>{tpl.name}</span>
            </button>
          ))}
        </div>
        <form onSubmit={(e) => void createCustomTeam(e)} className="flex gap-3 items-end pt-2">
          <div className="flex-1">
            <label className="label-sm block mb-1.5" style={{ color: 'var(--stone)' }}>Custom team name</label>
            <input value={customName} onChange={(e) => setCustomName(e.target.value)} className="input-5bloc text-xs" placeholder="e.g. Façade consultants" />
          </div>
          <button type="submit" disabled={busy || !customName.trim()} className="btn-secondary text-xs py-2">Create</button>
        </form>
      </div>

      {loading ? (
        <p className="text-[12px]" style={{ color: 'var(--stone)' }}>Loading teams…</p>
      ) : teams.length === 0 ? (
        <div className="card-5bloc text-center py-10">
          <p className="text-[13px]" style={{ color: 'var(--stone)' }}>No teams yet — pick a template above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
          <div className="card-5bloc space-y-1 p-2">
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => setSelectedTeamId(team.id)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-[12px] font-medium"
                style={{
                  background: selectedTeamId === team.id ? 'rgba(245,166,35,0.12)' : 'transparent',
                  color: selectedTeamId === team.id ? 'var(--amber)' : 'var(--on-surface-variant)',
                }}
              >
                {team.name}
                <span className="block text-[10px] opacity-70">{team.project_team_members?.length ?? 0} people</span>
              </button>
            ))}
          </div>

          {activeTeam && (
            <div className="card-5bloc space-y-4">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>{activeTeam.name}</h2>

              <form onSubmit={(e) => void addMember(e)} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="label-sm block mb-1.5" style={{ color: 'var(--stone)' }}>Email *</label>
                  <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="input-5bloc text-xs" placeholder="person@company.com" />
                </div>
                <div>
                  <label className="label-sm block mb-1.5" style={{ color: 'var(--stone)' }}>Name (optional)</label>
                  <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="input-5bloc text-xs" placeholder="Display name" />
                </div>
                <button type="submit" disabled={busy} className="btn-primary text-xs py-2 sm:col-span-2 sm:w-fit">Add to team</button>
              </form>

              <div className="divide-y" style={{ borderColor: 'var(--hairline)' }}>
                {(activeTeam.project_team_members ?? []).length === 0 ? (
                  <p className="text-[12px] py-4" style={{ color: 'var(--stone)' }}>No members yet.</p>
                ) : (
                  activeTeam.project_team_members.map((m) => (
                    <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--on-surface)' }}>
                          {m.profiles?.full_name || m.display_name || m.invite_email || 'Member'}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--stone)' }}>
                          {m.profiles?.email || m.invite_email}
                          {m.is_external ? ' · Outside firm' : ''}
                          {m.status === 'pending' ? ' · Pending' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="chip text-[10px] capitalize">{m.project_role}</span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void removeMember(m.id)}
                          className="text-[10px] px-2 py-1 rounded-lg"
                          style={{ color: 'var(--stone)' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
