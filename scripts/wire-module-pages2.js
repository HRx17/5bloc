const fs = require('fs')

function replaceBetween(file, startMarker, endMarker, replacement) {
  let c = fs.readFileSync(file, 'utf8')
  const s = c.indexOf(startMarker)
  const e = c.indexOf(endMarker, s)
  if (s < 0 || e < 0) {
    console.log('FAIL', file, JSON.stringify(startMarker.slice(0, 40)), 's=', s, 'e=', e)
    return false
  }
  c = c.slice(0, s) + replacement + c.slice(e)
  fs.writeFileSync(file, c)
  console.log('OK', file)
  return true
}

const siteRep = `  useEffect(() => {
    fetch(\`/api/projects/\${projectId}/site\`)
      .then((r) => r.json())
      .then((d) => {
        setVisitReports(d.visits || [])
        setMaterialLogs(d.materials || [])
        setPunchList(d.punch || [])
      })
      .finally(() => setLoading(false))
  }, [projectId])

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(\`/api/projects/\${projectId}/site\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'visit', ...newVisit }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error || 'Failed'); return }
    setVisitReports(prev => [data.visit, ...prev])
    setNewVisit(prev => ({ ...prev, observations: '' }))
  }

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(\`/api/projects/\${projectId}/site\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'material', ...newMaterial }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error || 'Failed'); return }
    setMaterialLogs(prev => [data.material, ...prev])
    setNewMaterial({ material_name: '', specified_standard: '', delivered_material: '', contractor: '' })
  }

  const handleAddPunch = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(\`/api/projects/\${projectId}/site\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'punch', ...newPunch }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error || 'Failed'); return }
    setPunchList(prev => [data.punch, ...prev])
    setNewPunch({ defect: '', location: '', assigned_to: '' })
  }

  const handleResolvePunch = async (id: string) => {
    const res = await fetch(\`/api/projects/\${projectId}/site\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ punch_id: id, status: 'resolved' }),
    })
    if (!res.ok) return
    setPunchList(prev => prev.map(p => p.id === id ? { ...p, status: 'resolved' } : p))
  }

`

replaceBetween(
  'app/(app)/projects/[id]/site/page.tsx',
  '  useEffect(() => {\n    // Mock load site logs',
  '  return (\n    <div className="space-y-6 font-body select-none">',
  siteRep
)

const marketRep = ` useEffect(() => {
 fetch(\`/api/contractors/\${contractorId}\`)
 .then((r) => r.json())
 .then((d) => {
 if (!d.contractor) { setContractor(null); return }
 const c = d.contractor
 setContractor({
 id: c.id,
 company_name: c.company_name,
 bio: c.bio || '',
 specializations: c.specializations || [],
 service_cities: c.service_cities || [],
 years_experience: c.years_experience || 0,
 verified: !!c.verified,
 rating: Number(c.rating || 0),
 reviews_count: c.reviews_count || 0,
 jobs_completed: c.jobs_completed || 0,
 team_size: c.team_size || 0,
 website: c.website || '',
 portfolio: c.portfolio || [],
 reviews: c.reviews || [],
 })
 })
 }, [contractorId])

`

replaceBetween(
  'app/(app)/marketplace/[id]/page.tsx',
  ' useEffect(() => {\n // Mock load contractor profile',
  ' if (!contractor) {',
  marketRep
)
