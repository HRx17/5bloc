const fs = require('fs')

function replaceBetween(file, startMarker, endMarker, replacement) {
  let c = fs.readFileSync(file, 'utf8')
  const s = c.indexOf(startMarker)
  const e = c.indexOf(endMarker, s)
  if (s < 0 || e < 0) {
    console.log('FAIL', file, startMarker.slice(0, 50), 's=', s, 'e=', e)
    return false
  }
  c = c.slice(0, s) + replacement + c.slice(e)
  fs.writeFileSync(file, c)
  console.log('OK', file)
  return true
}

const meetingsRep = `  useEffect(() => {
    fetch(\`/api/projects/\${projectId}/meetings\`)
      .then((r) => r.json())
      .then((d) => setMeetings(d.meetings || []))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedActions = newMeeting.actions
      .split('\\n')
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

    const res = await fetch(\`/api/projects/\${projectId}/meetings\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newMeeting.title,
        date: newMeeting.date,
        attendees: newMeeting.attendees,
        agenda: newMeeting.agenda,
        decisions: newMeeting.decisions,
        action_items: parsedActions,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || 'Failed to save meeting')
      return
    }
    setMeetings(prev => [data.meeting, ...prev])
    setShowAddModal(false)
    setNewMeeting({ title: '', date: '', attendees: '', agenda: '', decisions: '', actions: '' })
  }

`

replaceBetween(
  'app/(app)/projects/[id]/meetings/page.tsx',
  '  useEffect(() => {\n    // Mock load meeting notes',
  '  const filtered = meetings.filter',
  meetingsRep
)

const trRep = `  useEffect(() => {
    fetch(\`/api/projects/\${projectId}/transmittals\`)
      .then((r) => r.json())
      .then((d) => setTransmittals(d.transmittals || []))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleCreateTransmittal = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(\`/api/projects/\${projectId}/transmittals\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTransmittal),
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || 'Failed to create transmittal')
      return
    }
    setTransmittals(prev => [data.transmittal, ...prev])
    setShowFormModal(false)
    setNewTransmittal({
      recipient_name: '',
      recipient_company: '',
      via: 'Email',
      documents: '',
      purpose: 'For Information',
      date: new Date().toISOString().split('T')[0]
    })
  }

  const handleUpdateStatus = async (id: string, nextStatus: Transmittal['status']) => {
    const res = await fetch(\`/api/projects/\${projectId}/transmittals\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transmittal_id: id, status: nextStatus }),
    })
    if (!res.ok) return
    setTransmittals(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t))
  }

`

replaceBetween(
  'app/(app)/projects/[id]/transmittals/page.tsx',
  '  useEffect(() => {\n    const timer = setTimeout(() => {\n      setTransmittals([',
  '  const getStatusBadgeClass',
  trRep
)

console.log('done')
