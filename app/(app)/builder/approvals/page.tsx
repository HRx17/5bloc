'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

export default function BuilderApprovals() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then(async (d) => {
        const projects = d.projects || []
        const docs: any[] = []
        for (const p of projects.slice(0, 5)) {
          const detail = await fetch(`/api/projects/${p.id}`).then((r) => r.json())
          for (const doc of detail.documents || []) {
            if (doc.approval_status === 'pending') {
              docs.push({ ...doc, project_name: p.name, project_id: p.id })
            }
          }
        }
        setItems(docs)
      })
      .finally(() => setLoading(false))
  }, [])

  const act = async (documentId: string, action: 'approve' | 'reject', projectId: string) => {
    const res = await fetch(`/api/projects/${projectId}/documents`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_id: documentId,
        approval_status: action === 'approve' ? 'approved' : 'rejected',
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Approval failed')
      return
    }
    setItems((prev) =>
      prev.map((d) =>
        d.id === documentId
          ? { ...d, approval_status: action === 'approve' ? 'approved' : 'rejected' }
          : d
      )
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="font-display text-[32px] mb-2">Approval inbox</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--stone)' }}>
        Drawings and variations waiting for your decision.
      </p>
      {loading ? (
        <p style={{ color: 'var(--stone)' }}>Loading…</p>
      ) : items.length === 0 ? (
        <div className="p-8 rounded-2xl" style={{ background: 'var(--surface-container)' }}>
          Nothing pending. You&apos;re clear.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="p-4 rounded-xl" style={{ background: 'var(--surface-container)' }}>
              <p className="font-semibold">{item.name}</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--stone)' }}>
                {item.project_name} · v{item.version} · {item.approval_status}
              </p>
              <div className="flex gap-2 mt-3">
                <button className="btn-primary text-[11px]" onClick={() => act(item.id, 'approve', item.project_id)}>
                  Approve
                </button>
                <button className="btn-secondary text-[11px]" onClick={() => act(item.id, 'reject', item.project_id)}>
                  Request changes
                </button>
                <Link href={`/projects/${item.project_id}/documents${item.id ? `?doc=${item.id}` : ''}`} className="btn-secondary text-[11px]">
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
