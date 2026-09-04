import React, { useCallback, useEffect, useState } from 'react'
import Link from '@/compat/next-link'
import { useToast } from '@/components/ui5/Toast'
import { useConfirm } from '@/components/ui5/ConfirmProvider'
import { ErrorState } from '@/components/ui5/ErrorState'
import { EmptyState } from '@/components/ui5/EmptyState'
import { Skeleton } from '@/components/ui5/Skeleton'
import { useLiveReload } from '@/lib/live/useLiveReload'

export default function BuilderApprovalsPage() {
  const { toast } = useToast()
  const confirm = useConfirm()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true)
      setError(null)
    }
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Could not load your projects')
      const d = await res.json()
      const projects = d.projects || []
      const docs: any[] = []
      for (const p of projects.slice(0, 5)) {
        const detailRes = await fetch(`/api/projects/${p.id}`)
        if (!detailRes.ok) continue
        const detail = await detailRes.json()
        for (const doc of detail.documents || []) {
          if (doc.approval_status === 'pending') {
            docs.push({ ...doc, project_name: p.name, project_id: p.id })
          }
        }
      }
      setItems(docs)
    } catch (err) {
      if (!opts?.quiet) setError(err)
    } finally {
      if (!opts?.quiet) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useLiveReload(load, ['documents', 'projects'])

  const act = async (item: any, action: 'approve' | 'reject') => {
    const approving = action === 'approve'
    const ok = await confirm({
      title: approving ? 'Approve this drawing?' : 'Request changes?',
      message: approving
        ? `${item.name} will be marked approved and the architect notified. Approvals cannot be undone here.`
        : `${item.name} will be sent back to the architect for revision, and they will be notified.`,
      confirmLabel: approving ? 'Approve' : 'Request changes',
      variant: approving ? 'default' : 'danger',
    })
    if (!ok) return

    setPendingId(item.id)
    setItems((prev) => prev.filter((d) => d.id !== item.id))
    try {
      const res = await fetch(`/api/projects/${item.project_id}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: item.id,
          approval_status: approving ? 'approved' : 'rejected',
        }),
      })
      if (!res.ok) {
        setItems((prev) => [item, ...prev])
        const data = await res.json().catch(() => ({}))
        toast(data.error || 'Could not record your decision. Try again.', 'error')
        return
      }
      toast(
        approving ? `Approved ${item.name} — the architect has been notified` : `Changes requested on ${item.name}`,
        approving ? 'success' : 'info'
      )
    } catch (err: any) {
      setItems((prev) => [item, ...prev])
      toast(err?.message || 'Could not reach the server. Try again.', 'error')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="font-display text-[32px] mb-2">Approval inbox</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--stone)' }}>
        Drawings and variations waiting for your decision.
      </p>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load your approval inbox"
          description="We could not reach your projects, so pending approvals may be missing. Nothing has been approved or rejected."
          error={error}
          onRetry={load}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="task_alt"
          title="Nothing waiting on you"
          description="When an architect shares a drawing or variation for builder sign-off, it lands here. You will also get a notification."
          actionLabel="Back to portfolio"
          href="/builder"
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const decided = item.approval_status !== 'pending'
            const busy = pendingId === item.id
            return (
              <div key={item.id} className="p-4 rounded-xl" style={{ background: 'var(--surface-container)' }}>
                <p className="font-semibold">{item.name}</p>
                <p className="text-[12px] mt-1" style={{ color: 'var(--stone)' }}>
                  {item.project_name} · v{item.version} · {item.approval_status}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    className="btn-primary text-[11px]"
                    disabled={busy || decided}
                    onClick={() => act(item, 'approve')}
                  >
                    {busy ? 'Saving…' : 'Approve'}
                  </button>
                  <button
                    className="btn-secondary text-[11px]"
                    disabled={busy || decided}
                    onClick={() => act(item, 'reject')}
                  >
                    Request changes
                  </button>
                  <Link href={`/projects/${item.project_id}/documents${item.id ? `?doc=${item.id}` : ''}`} className="btn-secondary text-[11px]">
                    Open
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
