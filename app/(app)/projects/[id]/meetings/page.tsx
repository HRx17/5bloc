'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface MeetingRecord {
  id: string
  date: string
  title: string
  attendees: string[]
  agenda: string
  decisions: string[]
  actionItems: { task: string; owner: string; deadline: string }[]
}

export default function MeetingNotes() {
  const params = useParams()
  const projectId = params.id as string

  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeMeeting, setActiveMeeting] = useState<MeetingRecord | null>(null)

  // New meeting form state
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    attendees: '',
    agenda: '',
    decisions: '',
    actions: '' // formatted as comma-separated task:owner:deadline lines
  })

  useEffect(() => {
    // Mock load meeting notes
    const timer = setTimeout(() => {
      setMeetings([
        {
          id: 'meet-1',
          date: '2026-05-18',
          title: 'MEP Services Coordination Meeting',
          attendees: ['Parth Patel (Arch)', 'Rohan Deshmukh (MEP)', 'Amit Sharma (Contractor)'],
          agenda: 'Review HVAC duct clearances in the main lobby structural beams.',
          decisions: [
            'Reroute the main HVAC trunk through the secondary service shaft B-2.',
            'Modify lobby false ceiling elevation level to 2.45m.'
          ],
          actionItems: [
            { task: 'Update MEP sheet M-104 with rerouting layout', owner: 'Rohan Deshmukh', deadline: '2026-05-24' },
            { task: 'Issue updated masonry details for shaft opening clearance', owner: 'Parth Patel', deadline: '2026-05-26' }
          ]
        },
        {
          id: 'meet-2',
          date: '2026-06-02',
          title: 'Structural Steel Pile Review',
          attendees: ['Parth Patel (Arch)', 'Aritro Roy (Structural)', 'Karan Shah (Builder)'],
          agenda: 'Evaluate concrete foundation testing logs and rebar deliveries.',
          decisions: [
            'Approve structural concrete cube test logs for pile caps #1 to #8.',
            'Maintain concrete hydration period of 14 days before loading superstructure columns.'
          ],
          actionItems: [
            { task: 'Archive cube test logs in Document Vault under permits folder', owner: 'Amit Sharma', deadline: '2026-06-08' }
          ]
        }
      ])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [projectId])

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault()

    // Parse actions: task:owner:deadline
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

    const record: MeetingRecord = {
      id: `meet-${Date.now()}`,
      date: newMeeting.date || new Date().toISOString().split('T')[0],
      title: newMeeting.title,
      attendees: newMeeting.attendees.split(',').map(x => x.trim()),
      agenda: newMeeting.agenda,
      decisions: newMeeting.decisions.split('\n').filter(x => x.trim().length > 0),
      actionItems: parsedActions
    }

    setMeetings(prev => [record, ...prev])
    setShowAddModal(false)
    setNewMeeting({ title: '', date: '', attendees: '', agenda: '', decisions: '', actions: '' })
  }

  const filtered = meetings.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.agenda.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 font-body select-none relative h-full">
      {/* Header controls */}
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

      {/* Meetings registry grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left list of records */}
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
                        <span>{m.attendees.length} Attendees</span>
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-amber transition-colors">
                        {m.title}
                      </h4>
                      <p className="text-[11px] text-stone leading-relaxed line-clamp-1">{m.agenda}</p>
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

        {/* Right side Detail Panel */}
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
                <p className="text-[11px] text-stone mt-2 italic">"{activeMeeting.agenda}"</p>
              </div>

              <div>
                <h5 className="text-[10px] font-bold text-stone font-mono uppercase mb-2">Attendees</h5>
                <div className="flex flex-wrap gap-1.5">
                  {activeMeeting.attendees.map(a => (
                    <span key={a} className="bg-navy border text-white text-[9px] font-mono px-2 py-0.5">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-[10px] font-bold text-stone font-mono uppercase">Key Decisions</h5>
                <ul className="list-disc list-inside text-xs text-stone space-y-1">
                  {activeMeeting.decisions.map((d, i) => (
                    <li key={i} className="leading-relaxed pl-1 text-white">{d}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <h5 className="text-[10px] font-bold text-stone font-mono uppercase">Assigned Action Items</h5>
                <div className="space-y-2">
                  {activeMeeting.actionItems.map((act, i) => (
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
            </div>
          ) : (
            <div className="card-5bloc text-center py-12 text-stone text-xs">
              <span className="material-icons-outlined text-[32px] text-stone/25 mb-2">menu_book</span>
              <p>Select a meeting record from the list to view attendee lists, decisions, and action owners.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add meeting modal */}
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
