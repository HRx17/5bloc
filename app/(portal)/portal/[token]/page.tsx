'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type PortalData = {
  project: any
  org_name?: string
  milestones: any[]
  documents: any[]
  settings?: any
}

const PHASE_LABELS: Record<string, string> = {
  pre_design: 'Pre-design',
  schematic_design: 'Schematic design',
  design_development: 'Design development',
  construction_docs: 'Construction documents',
  bidding: 'Bidding',
  permits: 'Permits',
  construction_admin: 'Construction admin',
  complete: 'Complete',
}

export default function ClientPortal() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<PortalData | null>(null)
  const [question, setQuestion] = useState('')
  const [askerName, setAskerName] = useState('')
  const [askerEmail, setAskerEmail] = useState('')
  const [questionSent, setQuestionSent] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/portal/${token}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Portal unavailable')
      setData(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token])

  const settings = data?.settings || {
    show_overview: true,
    show_documents: true,
    show_payments: true,
    show_approvals: true,
    show_questions: true,
    welcome_note: '',
  }

  const actOnDoc = async (documentId: string, action: 'approve' | 'reject') => {
    const res = await fetch(`/api/portal/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, document_id: documentId }),
    })
    const json = await res.json()
    if (!res.ok) {
      setActionMsg(json.error || 'Action failed')
      return
    }
    setActionMsg(action === 'approve' ? 'Approved' : 'Changes requested')
    load()
  }

  const sendQuestion = async () => {
    if (!question.trim()) return
    const res = await fetch(`/api/portal/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'question',
        question,
        name: askerName,
        email: askerEmail,
      }),
    })
    if (res.ok) {
      setQuestionSent(true)
      setQuestion('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F0', color: '#6B7485' }}>
        Loading portal…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F7F5F0' }}>
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold" style={{ color: '#0C1220' }}>Portal unavailable</h1>
          <p className="mt-2 text-sm" style={{ color: '#6B7485' }}>{error || 'Not found'}</p>
        </div>
      </div>
    )
  }

  const { project, milestones, documents, org_name } = data
  const pending = documents.filter((d) => d.approval_status === 'pending')

  return (
    <div className="min-h-screen font-body" style={{ background: '#F7F5F0', color: '#0C1220' }}>
      <header className="px-6 py-5" style={{ background: '#FFFFFF', boxShadow: '0 1px 0 rgba(12,18,32,0.06)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider" style={{ color: '#9E9687' }}>
              Client portal · {org_name || 'Architect firm'}
            </p>
            <h1 className="text-2xl font-semibold mt-1">{project.name}</h1>
          </div>
          <span
            className="px-3 py-1 text-[12px] rounded-full"
            style={{ background: 'rgba(46,204,138,0.12)', color: '#1B7A4E' }}
          >
            {String(project.status || 'active')}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {settings.welcome_note && (
          <p className="text-sm leading-relaxed" style={{ color: '#6B7485' }}>
            {settings.welcome_note}
          </p>
        )}

        {actionMsg && (
          <p className="text-sm font-medium" style={{ color: '#D4891A' }}>
            {actionMsg}
          </p>
        )}

        {settings.show_overview !== false && (
          <section className="p-5 rounded-2xl" style={{ background: '#FFFFFF' }}>
            <h2 className="font-semibold text-lg mb-3">Progress</h2>
            <p className="text-sm mb-4" style={{ color: '#6B7485' }}>
              Current phase:{' '}
              <strong style={{ color: '#0C1220' }}>
                {PHASE_LABELS[project.phase] || project.phase}
              </strong>
            </p>
            <div className="space-y-2">
              {(milestones || []).map((m) => (
                <div key={m.id || m.phase} className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#EDE9E2' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${m.completion_pct || 0}%`,
                        background: m.completion_pct === 100 ? '#2ECC8A' : '#F5A623',
                      }}
                    />
                  </div>
                  <span className="text-[11px] w-36" style={{ color: '#6B7485' }}>
                    {PHASE_LABELS[m.phase] || m.phase}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {settings.show_approvals !== false && pending.length > 0 && (
          <section className="p-5 rounded-2xl" style={{ background: '#FFFFFF' }}>
            <h2 className="font-semibold text-lg mb-3">Needs your approval</h2>
            <div className="space-y-3">
              {pending.map((doc) => (
                <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-[12px]" style={{ color: '#9E9687' }}>
                      Version {doc.version}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => actOnDoc(doc.id, 'approve')}
                      className="px-4 py-2 text-[12px] font-semibold rounded-lg"
                      style={{ background: '#F5A623', color: '#0C1220' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => actOnDoc(doc.id, 'reject')}
                      className="px-4 py-2 text-[12px] font-semibold rounded-lg"
                      style={{ background: '#EDE9E2', color: '#0C1220' }}
                    >
                      Request changes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {settings.show_documents !== false && (
          <section className="p-5 rounded-2xl" style={{ background: '#FFFFFF' }}>
            <h2 className="font-semibold text-lg mb-3">Shared documents</h2>
            {documents.length === 0 ? (
              <p className="text-sm" style={{ color: '#9E9687' }}>No documents shared yet.</p>
            ) : (
              <ul className="divide-y" style={{ borderColor: '#EDE9E2' }}>
                {documents.map((doc) => (
                  <li key={doc.id} className="py-3 flex justify-between gap-3 text-sm items-center">
                    <span>{doc.name}</span>
                    <div className="flex items-center gap-3">
                      <span style={{ color: '#9E9687' }} className="capitalize">
                        {doc.approval_status?.replaceAll('_', ' ')}
                      </span>
                      <button
                        type="button"
                        className="text-[12px] font-semibold underline"
                        style={{ color: '#D4891A' }}
                        onClick={async () => {
                          const res = await fetch(
                            `/api/portal/${token}/download?document_id=${doc.id}`
                          )
                          const json = await res.json()
                          if (res.ok && json.url) window.open(json.url, '_blank')
                          else setActionMsg(json.error || 'Download unavailable')
                        }}
                      >
                        Download
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {settings.show_payments !== false && (
          <section className="p-5 rounded-2xl" style={{ background: '#FFFFFF' }}>
            <h2 className="font-semibold text-lg mb-3">Payment schedule</h2>
            <div className="space-y-2">
              {(milestones || [])
                .filter((m) => m.fee_amount)
                .map((m) => (
                  <div key={m.id || m.phase} className="flex justify-between text-sm py-2">
                    <span>{PHASE_LABELS[m.phase] || m.phase}</span>
                    <span>
                      ₹{Number(m.fee_amount).toLocaleString()}{' '}
                      <span style={{ color: m.fee_paid ? '#2ECC8A' : '#D4891A' }}>
                        {m.fee_paid ? 'Paid' : 'Due'}
                      </span>
                    </span>
                  </div>
                ))}
            </div>
          </section>
        )}

        {settings.show_questions !== false && (
          <section className="p-5 rounded-2xl" style={{ background: '#FFFFFF' }}>
            <h2 className="font-semibold text-lg mb-3">Ask your architect</h2>
            {questionSent ? (
              <p className="text-sm" style={{ color: '#2ECC8A' }}>
                Question sent. Your architect will follow up.
              </p>
            ) : (
              <div className="space-y-3">
                <input
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: '#F7F5F0', border: '1px solid #EDE9E2' }}
                  placeholder="Your name"
                  value={askerName}
                  onChange={(e) => setAskerName(e.target.value)}
                />
                <input
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: '#F7F5F0', border: '1px solid #EDE9E2' }}
                  placeholder="Email"
                  value={askerEmail}
                  onChange={(e) => setAskerEmail(e.target.value)}
                />
                <textarea
                  className="w-full px-3 py-2 rounded-lg text-sm min-h-[100px]"
                  style={{ background: '#F7F5F0', border: '1px solid #EDE9E2' }}
                  placeholder="Your question…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <button
                  onClick={sendQuestion}
                  className="px-4 py-2 text-[12px] font-semibold rounded-lg"
                  style={{ background: '#F5A623', color: '#0C1220' }}
                >
                  Send question
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
