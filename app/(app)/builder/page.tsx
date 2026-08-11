'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

export default function BuilderHome() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [recommend, setRecommend] = useState<{ projectId: string; name: string; spec: string; email: string; note: string } | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .finally(() => setLoading(false))
  }, [])

  const submitRecommend = async () => {
    if (!recommend) return
    const res = await fetch('/api/vendor-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: recommend.projectId,
        vendor_name: recommend.name,
        specialization: recommend.spec,
        email: recommend.email,
        note: recommend.note,
      }),
    })
    const data = await res.json()
    setMsg(res.ok ? 'Recommendation sent to architect' : data.error || 'Failed')
    if (res.ok) setRecommend(null)
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-[36px]">Builder portfolio</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
          All projects across your architects — approvals, budget, vendor recommendations.
        </p>
      </div>

      <div className="flex gap-3">
        <Link href="/builder/approvals" className="btn-primary text-[12px]">
          Approval inbox
        </Link>
      </div>

      {msg && <p className="text-sm" style={{ color: 'var(--amber)' }}>{msg}</p>}

      {loading ? (
        <p style={{ color: 'var(--stone)' }}>Loading…</p>
      ) : projects.length === 0 ? (
        <div className="p-8 rounded-2xl text-center" style={{ background: 'var(--surface-container)' }}>
          <p className="font-semibold">No projects yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
            Ask your architect to invite you as Builder on a project.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="p-5 rounded-2xl" style={{ background: 'var(--surface-container)' }}>
              <div className="flex justify-between gap-3">
                <div>
                  <Link href={`/projects/${p.id}/documents`} className="font-semibold text-lg hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--stone)' }}>
                    {p.city} · {String(p.phase || '').replaceAll('_', ' ')}
                  </p>
                </div>
                <span className="chip" style={{ color: 'var(--stone)' }}>
                  {p.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
                <div>
                  <p style={{ color: 'var(--stone)' }}>Budget</p>
                  <p>₹{Number(p.construction_cost || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--stone)' }}>Architect fee</p>
                  <p>₹{Number(p.architect_fee || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link href={`/projects/${p.id}/documents`} className="btn-secondary text-[11px]">
                  Review docs
                </Link>
                <Link href={`/projects/${p.id}/rfis`} className="btn-secondary text-[11px]">
                  RFIs
                </Link>
                <button
                  className="btn-secondary text-[11px]"
                  onClick={() =>
                    setRecommend({ projectId: p.id, name: '', spec: 'Civil', email: '', note: '' })
                  }
                >
                  Recommend vendor
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {recommend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl space-y-3" style={{ background: 'var(--surface-container-high)' }}>
            <h3 className="font-semibold">Recommend a vendor</h3>
            <input className="input-5bloc" placeholder="Vendor / company name" value={recommend.name} onChange={(e) => setRecommend({ ...recommend, name: e.target.value })} />
            <input className="input-5bloc" placeholder="Specialization" value={recommend.spec} onChange={(e) => setRecommend({ ...recommend, spec: e.target.value })} />
            <input className="input-5bloc" placeholder="Email" value={recommend.email} onChange={(e) => setRecommend({ ...recommend, email: e.target.value })} />
            <textarea className="input-5bloc min-h-[80px]" placeholder="Note for architect" value={recommend.note} onChange={(e) => setRecommend({ ...recommend, note: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setRecommend(null)}>Cancel</button>
              <button className="btn-primary" onClick={submitRecommend}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
