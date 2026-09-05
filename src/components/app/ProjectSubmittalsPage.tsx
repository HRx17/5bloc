import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from '@/compat/next-navigation'
import { useToast } from '@/components/ui5/Toast'
import { useConfirm } from '@/components/ui5/ConfirmProvider'
import { ErrorState } from '@/components/ui5/ErrorState'
import { EmptyState } from '@/components/ui5/EmptyState'
import { Skeleton } from '@/components/ui5/Skeleton'
import { useLiveReload } from '@/lib/live/useLiveReload'
import {
  CHAT_ACCEPT,
  formatFileMarker,
  parseFileMarker,
  signedFileUrl,
  uploadChatFile,
} from '@/lib/messages/files'

interface SubmittalItem {
  id: string
  submittal_number: number
  title: string
  spec_section: string
  contractor: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'revise_resubmit'
  due_date: string
  revision: number
  description?: string
  file_name?: string
  review_note?: string
}

export default function ProjectSubmittalsPage() {
  const params = useParams()
  const projectId = params.id as string
  const { toast } = useToast()
  const confirm = useConfirm()

  const [submittals, setSubmittals] = useState<SubmittalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeSubmittal, setActiveSubmittal] = useState<SubmittalItem | null>(null)
  const [saving, setSaving] = useState(false)

  const [newSubmittal, setNewSubmittal] = useState({
    title: '',
    spec_section: '',
    description: '',
    contractor: '',
    due_date: '',
  })
  const [attachment, setAttachment] = useState<{ key: string; name: string } | null>(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)

  const readFile = (value?: string | null) => {
    if (!value) return null
    return parseFileMarker(value) || { key: value, name: value.split('/').pop() || 'File' }
  }

  const openFile = async (value?: string | null) => {
    const file = readFile(value)
    if (!file) return
    try {
      window.open(await signedFileUrl(file.key, file.name, true), '_blank')
    } catch (err: any) {
      toast(err?.message || 'Could not open that file', 'error')
    }
  }

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true)
      setLoadError(null)
    }
    try {
      const res = await fetch(`/api/projects/${projectId}/submittals`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load submittals')
      setSubmittals(data.submittals || [])
    } catch (e) {
      if (!opts?.quiet) setLoadError(e)
    } finally {
      if (!opts?.quiet) setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  useLiveReload(load, ['submittals'])

  const handleCreateSubmittal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/submittals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSubmittal,
          file_name: attachment ? formatFileMarker(attachment.key, attachment.name) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create the submittal')
      setSubmittals((prev) => [data.submittal, ...prev])
      setShowCreateModal(false)
      setAttachment(null)
      setNewSubmittal({ title: '', spec_section: '', description: '', contractor: '', due_date: '' })
      toast('Submittal logged', 'success')
    } catch (err: any) {
      toast(err?.message || 'Failed to create the submittal', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleReviewAction = async (status: SubmittalItem['status']) => {
    if (!activeSubmittal || saving) return
    if (
      status === 'approved' &&
      !(await confirm({
        title: 'Approve submittal',
        message: `“${activeSubmittal.title}” will be approved for procurement. The contractor can order against this decision, so make sure the sample and spec section have been checked.`,
        confirmLabel: 'Approve',
      }))
    ) {
      return
    }
    setSaving(true)
    const previous = activeSubmittal
    setSubmittals((prev) =>
      prev.map((s) => (s.id === activeSubmittal.id ? { ...s, status, review_note: activeSubmittal.review_note } : s))
    )
    try {
      const res = await fetch(`/api/projects/${projectId}/submittals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submittal_id: activeSubmittal.id,
          status,
          review_note: activeSubmittal.review_note || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Review failed')
      setSubmittals((prev) => prev.map((s) => (s.id === data.submittal.id ? data.submittal : s)))
      setActiveSubmittal(null)
      toast(status === 'approved' ? 'Submittal approved' : 'Sent back for revision', 'success')
    } catch (err: any) {
      setSubmittals((prev) => prev.map((s) => (s.id === previous.id ? previous : s)))
      toast(err?.message || 'Could not record the review decision', 'error')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: SubmittalItem['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-stone/15 text-stone '
      case 'under_review':
        return 'bg-amber/10 text-amber '
      case 'approved':
        return 'bg-success/10 text-success '
      case 'rejected':
      case 'revise_resubmit':
        return 'bg-error/10 text-error '
    }
  }

  return (
    <div className="space-y-6 font-body select-none relative h-full">
      <div className="card-m p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b ">
          <div>
            <h3 className="text-sm font-semibold text-white">Product & Material Submittals</h3>
            <p className="text-[11px] text-stone mt-0.5">
              Review technical spec sheets and contractor sample files.
            </p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary py-2 text-xs">
            <span className="material-icons-outlined text-[16px]">add</span>
            Log Submittal
          </button>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : loadError ? (
          <ErrorState
            className="mt-4"
            compact
            title="Could not load submittals"
            error={loadError}
            onRetry={load}
          />
        ) : submittals.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon="fact_check"
            title="No submittals logged"
            description="Log the product and material samples the contractor sends for review — each one has to be approved here before procurement can start."
            actionLabel="Log submittal"
            onClick={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="table-m w-full text-left text-xs ">
              <thead>
                <tr className="text-stone border-b font-body text-[10px] tracking-wider font-semibold">
                  <th className="pb-3 pl-2">#</th>
                  <th className="pb-3">Submittal Title</th>
                  <th className="pb-3">Spec Section</th>
                  <th className="pb-3">Contractor</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Due Date</th>
                  <th className="pb-3">Revision</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-lt/40">
                {submittals.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-navy-lt/20 cursor-pointer transition-colors group"
                    onClick={() => setActiveSubmittal(sub)}
                  >
                    <td className="py-4 pl-2 font-mono text-[10px] text-stone">
                      SUB-{String(sub.submittal_number).padStart(3, '0')}
                    </td>
                    <td className="py-4 font-semibold pr-4">
                      <span className="text-white group-hover:text-amber transition-colors line-clamp-1">
                        {sub.title}
                      </span>
                      {sub.file_name && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void openFile(sub.file_name)
                          }}
                          className="text-[10px] text-stone font-mono mt-0.5 flex items-center gap-0.5 hover:text-amber"
                        >
                          <span className="material-icons-outlined text-[13px] text-blue">attachment</span>
                          {readFile(sub.file_name)?.name || 'Attached file'}
                        </button>
                      )}
                    </td>
                    <td className="py-4 text-stone">{sub.spec_section || '—'}</td>
                    <td className="py-4 text-stone">{sub.contractor || '—'}</td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusBadge(sub.status)}`}
                      >
                        {sub.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 font-mono text-[10px] text-stone">{sub.due_date || '—'}</td>
                    <td className="py-4 font-mono text-[10px] text-stone">Rev {sub.revision ?? 0}</td>
                    <td className="py-4 pr-2 text-right">
                      <span className="material-icons-outlined text-stone group-hover:text-white transition-colors text-[18px]">
                        chevron_right
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-navy-mid border rounded-lg p-6 shadow-none relative">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-sm font-semibold text-amber font-body">Log New Material Submittal</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone hover:text-white transition"
              >
                <span className="material-icons-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubmittal} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-stone mb-1 font-body">
                  Submittal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lobby Marble Flooring Tile samples"
                  value={newSubmittal.title}
                  onChange={(e) => setNewSubmittal((prev) => ({ ...prev, title: e.target.value }))}
                  className="input-5bloc py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-stone mb-1 font-body">
                    Spec Section (CSI)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Section 09 30 00"
                    value={newSubmittal.spec_section}
                    onChange={(e) =>
                      setNewSubmittal((prev) => ({ ...prev, spec_section: e.target.value }))
                    }
                    className="input-5bloc py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-stone mb-1 font-body">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newSubmittal.due_date}
                    onChange={(e) => setNewSubmittal((prev) => ({ ...prev, due_date: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone mb-1 font-body">
                  Spec Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail sample dimensions, batch lot references, or testing criteria..."
                  value={newSubmittal.description}
                  onChange={(e) =>
                    setNewSubmittal((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="input-5bloc text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone mb-1 font-body">
                  Contractor
                </label>
                <input
                  type="text"
                  placeholder="Submitting contractor / vendor"
                  value={newSubmittal.contractor}
                  onChange={(e) =>
                    setNewSubmittal((prev) => ({ ...prev, contractor: e.target.value }))
                  }
                  className="input-5bloc py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone mb-1 font-body">
                  Sample / cut sheet
                </label>
                {attachment ? (
                  <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                    <span className="material-icons-outlined text-[16px] text-amber">attach_file</span>
                    <span className="text-xs text-white truncate flex-1">{attachment.name}</span>
                    <button type="button" onClick={() => setAttachment(null)} className="text-[10px] text-stone uppercase font-bold">
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 border border-dashed rounded-md px-3 py-2 cursor-pointer">
                    <span className="material-icons-outlined text-[16px] text-stone">upload_file</span>
                    <span className="text-xs text-stone">
                      {uploadingAttachment ? 'Uploading…' : 'Attach the sample, PDF or drawing (optional)'}
                    </span>
                    <input
                      type="file"
                      accept={CHAT_ACCEPT}
                      className="hidden"
                      disabled={uploadingAttachment}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (!file) return
                        setUploadingAttachment(true)
                        try {
                          const { key, filename } = await uploadChatFile(file, { projectId })
                          setAttachment({ key, name: filename })
                        } catch (err: any) {
                          toast(err?.message || 'Could not attach that file', 'error')
                        } finally {
                          setUploadingAttachment(false)
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t ">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary py-1.5 px-4 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary py-1.5 px-6 text-xs font-bold">
                  {saving ? 'Saving…' : 'Log Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeSubmittal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-navy/60 backdrop-blur-xs select-none">
          <div className="fixed inset-0" onClick={() => setActiveSubmittal(null)} />
          <div className="relative w-full max-w-lg h-screen bg-navy-mid border-l shadow-none flex flex-col justify-between z-10 animate-slide-in">
            <div className="px-6 py-4 bg-navy border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  SUB-{String(activeSubmittal.submittal_number).padStart(3, '0')}
                </h3>
                <span className="text-[10px] text-stone mt-0.5 block">
                  Contractor: {activeSubmittal.contractor || '—'}
                </span>
              </div>
              <button
                onClick={() => setActiveSubmittal(null)}
                className="text-stone hover:text-white transition p-1 hover:bg-navy-lt rounded-md"
              >
                <span className="material-icons-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white leading-snug">{activeSubmittal.title}</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] font-mono text-stone bg-navy border px-2 py-0.5 rounded-md">
                    {activeSubmittal.spec_section || 'No section'}
                  </span>
                  <span className="text-[10px] font-mono text-stone bg-navy border px-2 py-0.5 rounded-md">
                    Revision: {activeSubmittal.revision ?? 0}
                  </span>
                </div>

                <p className="text-xs text-stone leading-relaxed bg-navy/30 border p-4 rounded-md mt-3">
                  {activeSubmittal.description || 'No additional details provided.'}
                </p>

                {activeSubmittal.file_name && (
                  <button
                    type="button"
                    onClick={() => void openFile(activeSubmittal.file_name)}
                    className="mt-3 flex items-center gap-2 w-full border rounded-md px-3 py-2 text-left hover:border-amber"
                  >
                    <span className="material-icons-outlined text-[16px] text-amber">attach_file</span>
                    <span className="text-xs text-white truncate">
                      {readFile(activeSubmittal.file_name)?.name || 'Open attached file'}
                    </span>
                  </button>
                )}
              </div>

              <div className="pt-6 border-t space-y-4">
                <h4 className="text-xs font-semibold text-white">Review Decision</h4>
                <textarea
                  rows={4}
                  placeholder="Provide feedback note for approval or revision instructions..."
                  value={activeSubmittal.review_note || ''}
                  onChange={(e) =>
                    setActiveSubmittal((prev) =>
                      prev ? { ...prev, review_note: e.target.value } : null
                    )
                  }
                  className="input-5bloc text-xs resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-navy border-t flex flex-wrap gap-2.5 items-center justify-end shrink-0">
              <button
                disabled={saving}
                onClick={() => handleReviewAction('revise_resubmit')}
                className="btn-secondary text-xs text-error hover: py-1.5 px-4"
              >
                {saving ? 'Saving…' : 'Revise & Resubmit'}
              </button>
              <button
                disabled={saving}
                onClick={() => handleReviewAction('approved')}
                className="btn-primary py-1.5 px-6 text-xs font-bold"
              >
                {saving ? 'Saving…' : 'Approve Submittal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
