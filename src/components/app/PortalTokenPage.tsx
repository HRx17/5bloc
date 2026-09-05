import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from '@/compat/next-navigation'
import { useToast } from '@/components/ui5/Toast'
import { useConfirm } from '@/components/ui5/ConfirmProvider'

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

const PHASE_ORDER = Object.keys(PHASE_LABELS)

/**
 * The portal RPC returns raw milestone rows, which use the older column names
 * (`phase_key`, `completion`, `fee`) that the authenticated routes normalise away.
 */
function normalizeMilestone(m: any) {
  return {
    ...m,
    phase: m.phase ?? m.phase_key ?? '',
    completion_pct: Number(m.completion_pct ?? m.completion ?? 0),
    fee_amount: Number(m.fee_amount ?? m.fee ?? 0) || null,
    fee_paid: m.fee_paid ?? m.paid ?? false,
  }
}

function sortMilestones(rows: any[]) {
  return [...rows].map(normalizeMilestone).sort((a, b) => {
    const ai = PHASE_ORDER.indexOf(a.phase)
    const bi = PHASE_ORDER.indexOf(b.phase)
    // Unknown phases sort last but stay stable among themselves
    return (ai === -1 ? PHASE_ORDER.length : ai) - (bi === -1 ? PHASE_ORDER.length : bi)
  })
}

function sortDocuments(rows: any[]) {
  return [...rows].sort((a, b) => {
    const at = new Date(a.created_at || 0).getTime()
    const bt = new Date(b.created_at || 0).getTime()
    if (bt !== at) return bt - at
    return String(a.name || '').localeCompare(String(b.name || ''))
  })
}

export default function PortalTokenPage() {
  const params = useParams()
  const token = params.token as string

  const { toast } = useToast()
  const confirm = useConfirm()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<PortalData | null>(null)
  const [question, setQuestion] = useState('')
  const [askerName, setAskerName] = useState('')
  const [askerEmail, setAskerEmail] = useState('')
  const [questionSent, setQuestionSent] = useState(false)
  const [questionError, setQuestionError] = useState('')
  const [sendingQuestion, setSendingQuestion] = useState(false)
  /** Document id currently being approved/rejected or downloaded. */
  const [busyDoc, setBusyDoc] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/public/portal/${token}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'This portal link is no longer active.')
      setData({
        ...json,
        milestones: sortMilestones(json.milestones || []),
        documents: sortDocuments(json.documents || []),
      })
    } catch (e: any) {
      setError(
        /failed to fetch|networkerror/i.test(e?.message || '')
          ? 'Could not reach the server. Check your connection and try again.'
          : e.message
      )
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const settings = data?.settings || {
    show_overview: true,
    show_documents: true,
    show_payments: true,
    show_approvals: true,
    show_questions: true,
    welcome_note: '',
  }

  const actOnDoc = async (documentId: string, docName: string, action: 'approve' | 'reject') => {
    if (busyDoc) return
    const approving = action === 'approve'
    const ok = await confirm({
      title: approving ? 'Approve this document?' : 'Request changes?',
      message: approving
        ? `Your architect will be told that you approved “${docName}”, and work will move forward on that basis.`
        : `Your architect will be told that “${docName}” needs changes before you can approve it.`,
      confirmLabel: approving ? 'Approve' : 'Request changes',
    })
    if (!ok) return

    setBusyDoc(documentId)
    try {
      const res = await fetch(`/api/public/portal/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, document_id: documentId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'That did not go through. Please try again.')
      toast(approving ? 'Approved — your architect has been notified.' : 'Change request sent.', 'success')
      await load()
    } catch (e: any) {
      toast(e.message || 'That did not go through. Please try again.', 'error')
    } finally {
      setBusyDoc(null)
    }
  }

  const downloadDoc = async (documentId: string) => {
    if (busyDoc) return
    setBusyDoc(documentId)
    try {
      const res = await fetch(`/api/public/portal/${token}/download?document_id=${documentId}`)
      const json = await res.json()
      if (!res.ok || !json.url) throw new Error(json.error || 'This file is not available to download.')
      window.open(json.url, '_blank')
    } catch (e: any) {
      toast(e.message || 'This file is not available to download.', 'error')
    } finally {
      setBusyDoc(null)
    }
  }

  const sendQuestion = async () => {
    const body = question.trim()
    if (!body) {
      setQuestionError('Type your question first.')
      return
    }
    if (askerEmail.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(askerEmail.trim())) {
      setQuestionError('That email address does not look right.')
      return
    }

    setSendingQuestion(true)
    setQuestionError('')
    try {
      const res = await fetch(`/api/public/portal/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'question',
          question: body,
          name: askerName,
          email: askerEmail,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Your question could not be sent. Please try again.')
      setQuestionSent(true)
      setQuestion('')
      toast('Question sent to your architect.', 'success')
    } catch (e: any) {
      setQuestionError(e.message || 'Your question could not be sent. Please try again.')
    } finally {
      setSendingQuestion(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen font-body bg-surface-canvas" aria-busy="true">
        <span className="sr-only">Loading your project portal…</span>
        <header className="px-6 py-5 card-m rounded-none">
          <div className="max-w-4xl mx-auto space-y-2">
            <div className="h-3 w-40 animate-pulse rounded" style={{ background: 'var(--surface-container-high)' }} />
            <div className="h-7 w-64 animate-pulse rounded" style={{ background: 'var(--surface-container-high)' }} />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse card-m" />
          ))}
        </main>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-canvas">
        <div className="max-w-md text-center" role="alert">
          <h1 className="text-2xl font-semibold text-on-surface">
            This portal isn’t available
          </h1>
          <p className="mt-2 text-sm text-on-surface-var">
            {error || 'We could not find a project for this link.'}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-stone">
            Portal links are private and can be turned off or reissued by your architect. If this keeps
            happening, ask them to send you a fresh link.
          </p>
          <button
            type="button"
            onClick={load}
            className="mt-6 px-4 py-2 text-[13px] font-semibold rounded-lg"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const { project, milestones, documents, org_name } = data
  const pending = documents.filter((d) => d.approval_status === 'pending')

  return (
    <div className="min-h-screen font-body bg-surface-canvas text-on-surface">
      <header className="px-6 py-5 card-m rounded-none">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-stone">
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
          <p className="text-sm leading-relaxed text-on-surface-var">
            {settings.welcome_note}
          </p>
        )}

        {settings.show_overview !== false && (
          <section className="p-5 card-m">
            <h2 className="font-semibold text-lg mb-3">Progress</h2>
            <p className="text-sm mb-4 text-on-surface-var">
              Current phase:{' '}
              <strong className="text-on-surface">
                {PHASE_LABELS[project.phase] || project.phase}
              </strong>
            </p>
            {(milestones || []).length === 0 ? (
              <p className="text-sm text-stone">
                Your architect hasn’t published a phase breakdown yet. The overall phase above is current.
              </p>
            ) : (
            <div className="space-y-2">
              {(milestones || []).map((m) => (
                <div key={m.id || m.phase} className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-container-high)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${m.completion_pct || 0}%`,
                        background: m.completion_pct === 100 ? '#2ECC8A' : '#F5A623',
                      }}
                    />
                  </div>
                  <span className="text-[11px] w-36 text-on-surface-var">
                    {PHASE_LABELS[m.phase] || m.phase}
                  </span>
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {settings.show_approvals !== false && pending.length > 0 && (
          <section className="p-5 card-m">
            <h2 className="font-semibold text-lg mb-3">Needs your approval</h2>
            <div className="space-y-3">
              {pending.map((doc) => (
                <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-[12px] text-stone">
                      Version {doc.version}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => actOnDoc(doc.id, doc.name, 'approve')}
                      disabled={!!busyDoc}
                      className="px-4 py-2 text-[12px] font-semibold rounded-lg disabled:opacity-50"
                    >
                      {busyDoc === doc.id ? 'Working…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => actOnDoc(doc.id, doc.name, 'reject')}
                      disabled={!!busyDoc}
                      className="px-4 py-2 text-[12px] font-semibold rounded-lg disabled:opacity-50"
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
          <section className="p-5 card-m">
            <h2 className="font-semibold text-lg mb-3">Shared documents</h2>
            {documents.length === 0 ? (
              <p className="text-sm text-stone">No documents shared yet.</p>
            ) : (
              <ul className="divide-y" style={{ borderColor: '#EDE9E2' }}>
                {documents.map((doc) => (
                  <li key={doc.id} className="py-3 flex justify-between gap-3 text-sm items-center">
                    <span>{doc.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-stone capitalize">
                        {doc.approval_status?.replaceAll('_', ' ')}
                      </span>
                      <button
                        type="button"
                        className="text-[12px] font-semibold underline disabled:opacity-50"
                        style={{ color: '#D4891A' }}
                        disabled={!!busyDoc}
                        onClick={() => downloadDoc(doc.id)}
                      >
                        {busyDoc === doc.id ? 'Opening…' : 'Download'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {settings.show_payments !== false && (
          <section className="p-5 card-m">
            <h2 className="font-semibold text-lg mb-3">Payment schedule</h2>
            {(milestones || []).filter((m) => m.fee_amount).length === 0 ? (
              <p className="text-sm text-stone">
                No payments have been scheduled yet. Your architect will add them here as the project
                progresses.
              </p>
            ) : (
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
            )}
          </section>
        )}

        {settings.show_questions !== false && (
          <section className="p-5 card-m">
            <h2 className="font-semibold text-lg mb-3">Ask your architect</h2>
            {questionSent ? (
              <div>
                <p className="text-sm" style={{ color: '#2ECC8A' }}>
                  Question sent. Your architect will follow up.
                </p>
                <button
                  type="button"
                  onClick={() => setQuestionSent(false)}
                  className="mt-3 text-[12px] font-semibold underline"
                  style={{ color: '#D4891A' }}
                >
                  Ask another question
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: '#F7F5F0', border: '1px solid #EDE9E2' }}
                  placeholder="Your name (optional)"
                  value={askerName}
                  onChange={(e) => setAskerName(e.target.value)}
                />
                <div>
                  <input
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: '#F7F5F0', border: '1px solid #EDE9E2' }}
                    placeholder="Email (optional)"
                    value={askerEmail}
                    onChange={(e) => setAskerEmail(e.target.value)}
                  />
                  <p className="text-[11px] mt-1 text-stone">
                    Only needed if you want a reply by email — your architect already sees this in the project.
                  </p>
                </div>
                <textarea
                  className="w-full px-3 py-2 rounded-lg text-sm min-h-[100px]"
                  style={{ background: '#F7F5F0', border: '1px solid #EDE9E2' }}
                  placeholder="Your question…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                {questionError && (
                  <p className="text-[12px]" role="alert" style={{ color: '#C0392B' }}>
                    {questionError}
                  </p>
                )}
                <button
                  onClick={sendQuestion}
                  disabled={sendingQuestion}
                  className="px-4 py-2 text-[12px] font-semibold rounded-lg disabled:opacity-50"
                >
                  {sendingQuestion ? 'Sending…' : 'Send question'}
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
