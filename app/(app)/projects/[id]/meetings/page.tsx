'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface MeetingRecord {
  id: string
  date: string
  title: string
  attendees: string[]
  agenda: string
  notes: string
  status: string
  decisions: string[]
  actionItems: { task: string; owner: string; deadline: string }[]
}

function ensureArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : []
}

export default function MeetingNotes() {
  const params = useParams()
  const projectId = params.id as string

  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeMeeting, setActiveMeeting] = useState<MeetingRecord | null>(null)
  const [saving, setSaving] = useState(false)

  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    attendees: '',
    agenda: '',
    decisions: '',
    actions: ''
  })

  const mapMeeting = (m: any): MeetingRecord => ({
    id: m.id,
    date: m.date || m.meeting_date || '',
    title: m.title || '',
    attendees: ensureArray(m.attendees),
    agenda: m.agenda || '',
    notes: m.notes ?? m.agenda ?? '',
    status: m.status || 'recorded',
    decisions: ensureArray(m.decisions),
    actionItems: ensureArray(m.actionItems || m.action_items),
  })

  useEffect(() => {
    fetch(`/api/projects/${projectId}/meetings`)
      .then((r) => r.json())
      .then((d) => setMeetings((d.meetings || []).map(mapMeeting)))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedActions = newMeeting.actions
      .split('\n')
      .map(line => {
        const parts = line.split(':')
        if (parts.length >= 2) {
          return {
            task: parts[0].trim(),
            owner: parts[1].trim(),
            deadline: parts[2]?.trim() || new Date().toISOString().split('T')[0]
          }
        }
        return null
      })
      .filter(x => x !== null) as { task: string; owner: string; deadline: string }[]

    const res = await fetch(`/api/projects/${projectId}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newMeeting.title,
        date: newMeeting.date,
        attendees: newMeeting.attendees,
        agenda: newMeeting.agenda,
        notes: newMeeting.agenda,
        decisions: newMeeting.decisions,
        action_items: parsedActions,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || 'Failed to save meeting')
      return
    }
    setMeetings(prev => [mapMeeting(data.meeting), ...prev])
    setShowAddModal(false)
    setNewMeeting({ title: '', date: '', attendees: '', agenda: '', decisions: '', actions: '' })
  }

  const handleSaveMeeting = async () => {
    if (!activeMeeting) return
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/meetings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: activeMeeting.id,
          notes: activeMeeting.notes,
          status: activeMeeting.status,
          attendees: activeMeeting.attendees,
          decisions: activeMeeting.decisions,
          actionItems: activeMeeting.actionItems,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to save')
        return
      }
      const saved = mapMeeting(data.meeting || activeMeeting)
      setMeetings((prev) => prev.map((m) => (m.id === saved.id ? saved : m)))
      setActiveMeeting(saved)
    } finally {
      setSaving(false)
    }
  }

  const filtered = meetings.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.agenda || m.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 font-body select-none relative h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-grow max-w-sm">
          <input
            type="text"
            placeholder="Search meetings by keyword..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-5bloc py-2 text-xs"
          />
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary py-2 text-xs">
          <span className="material-icons-outlined text-[16px]">add</span>
          RECORD MEETING
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-5bloc space-y-4">
            <div className="border-b pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Meeting Minutes Registry</h3>
                <p className="text-[10px] text-stone mt-0.5">Formal log of on-site design coordinate agendas.</p>
              </div>
              <span className="label-sm font-bold text-stone">COUNT: {filtered.length}</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-stone animate-pulse">Loading meeting logs...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-stone">No meeting records match keywords.</div>
            ) : (
              <div className="divide-y divide-navy-lt/30">
                {filtered.map(m => (
                  <div
                    key={m.id}
                    onClick={() => setActiveMeeting(m)}
                    className="py-4 cursor-pointer hover:bg-navy-lt/10 transition-colors flex justify-between items-start group"
                  >
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-stone">
                        <span>{m.date}</span>
                        <span>·</span>
                        <span>{ensureArray(m.attendees).length} Attendees</span>
                        <span>·</span>
                        <span className="capitalize">{m.status}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-amber transition-colors">
                        {m.title}
                      </h4>
                      <p className="text-[11px] text-stone leading-relaxed line-clamp-1">{m.notes || m.agenda}</p>
                    </div>
                    <span className="material-icons-outlined text-stone group-hover:text-white transition-colors text-[16px] pt-1">
                      chevron_right
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          {activeMeeting ? (
            <div className="card-5bloc space-y-5 animate-fade-in">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold font-mono text-amber uppercase tracking-wide">
                    Meeting Details
                  </h4>
                  <span className="text-[10px] text-stone font-mono">{activeMeeting.date}</span>
                </div>
                <button onClick={() => setActiveMeeting(null)} className="text-stone hover:text-white transition">
                  <span className="material-icons-outlined text-[16px]">close</span>
                </button>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white leading-snug">{activeMeeting.title}</h3>
              </div>

              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Status</label>
                <select
                  value={activeMeeting.status}
                  onChange={(e) =>
                    setActiveMeeting((prev) => (prev ? { ...prev, status: e.target.value } : null))
                  }
                  className="input-5bloc py-1.5 text-xs font-medium"
                >
                  <option value="recorded">Recorded</option>
                  <option value="draft">Draft</option>
                  <option value="shared">Shared</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Notes</label>
                <textarea
                  rows={4}
                  value={activeMeeting.notes || ''}
                  onChange={(e) =>
                    setActiveMeeting((prev) => (prev ? { ...prev, notes: e.target.value } : null))
                  }
                  className="input-5bloc text-xs resize-none"
                />
              </div>

              <div>
                <h5 className="text-[10px] font-bold text-stone font-mono uppercase mb-2">Attendees</h5>
                <div className="flex flex-wrap gap-1.5">
                  {ensureArray(activeMeeting.attendees).map(a => (
                    <span key={a} className="bg-navy border text-white text-[9px] font-mono px-2 py-0.5">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-[10px] font-bold text-stone font-mono uppercase">Key Decisions</h5>
                <ul className="list-disc list-inside text-xs text-stone space-y-1">
                  {ensureArray(activeMeeting.decisions).map((d, i) => (
                    <li key={i} className="leading-relaxed pl-1 text-white">{d}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <h5 className="text-[10px] font-bold text-stone font-mono uppercase">Assigned Action Items</h5>
                <div className="space-y-2">
                  {ensureArray(activeMeeting.actionItems).map((act, i) => (
                    <div key={i} className="p-3 bg-navy/40 border space-y-1.5">
                      <p className="text-xs text-white leading-normal font-semibold">{act.task}</p>
                      <div className="flex justify-between items-center text-[10px] font-mono text-stone">
                        <span>Owner: <span className="text-white">{act.owner}</span></span>
                        <span>Due: {act.deadline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveMeeting}
                disabled={saving}
                className="btn-primary py-1.5 px-4 text-[11px] font-bold w-full"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div className="card-5bloc text-center py-12 text-stone text-xs">
              <span className="material-icons-outlined text-[32px] text-stone/25 mb-2">menu_book</span>
              <p>Select a meeting record from the list to view attendee lists, decisions, and action owners.</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-navy-mid border p-6 space-y-4">
            <div className="border-b pb-3 flex justify-between items-center">
              <h3 className="text-xs font-bold font-mono text-amber uppercase tracking-wider">Record Meeting Minutes</h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone hover:text-white transition">
                <span className="material-icons-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Site Check / Services Review"
                  value={newMeeting.title}
                  onChange={e => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                  className="input-5bloc py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Meeting Date</label>
                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={e => setNewMeeting(prev => ({ ...prev, date: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Attendees *</label>
                  <input
                    type="text"
                    required
                    placeholder="Parth Patel, Amit Sharma"
                    value={newMeeting.attendees}
                    onChange={e => setNewMeeting(prev => ({ ...prev, attendees: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Meeting Agenda / Summary *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Agenda and topics reviewed..."
                  value={newMeeting.agenda}
                  onChange={e => setNewMeeting(prev => ({ ...prev, agenda: e.target.value }))}
                  className="input-5bloc text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Key Decisions (One per line)</label>
                <textarea
                  rows={2}
                  placeholder="Decision 1&#10;Decision 2"
                  value={newMeeting.decisions}
                  onChange={e => setNewMeeting(prev => ({ ...prev, decisions: e.target.value }))}
                  className="input-5bloc text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                  Actions (format: Task : Owner : DueDate)
                </label>
                <textarea
                  rows={2}
                  placeholder="Update structural sheet : Aritro Roy : 2026-06-12"
                  value={newMeeting.actions}
                  onChange={e => setNewMeeting(prev => ({ ...prev, actions: e.target.value }))}
                  className="input-5bloc text-xs resize-none font-mono"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary py-1.5 px-4 text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-1.5 px-6 text-xs font-bold">
                  Save Minutes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
