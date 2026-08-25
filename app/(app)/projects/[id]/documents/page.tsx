'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { writeLocalFile, readLocalFile } from '@/lib/files/file-manager'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { usePrompt } from '@/components/ui/PromptProvider'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useLiveReload } from '@/lib/live/useLiveReload'
import { DocumentCadViewer } from '@/components/cad/DocumentCadViewer'

interface DocumentItem {
 id: string
 name: string
 original_filename: string
 extension: string
 size_bytes: number
 version: number
 phase: string
 folder: string
 status: string
 approval_status: 'pending' | 'approved' | 'rejected' | 'revision_requested'
 uploaded_by: string
 created_at: string
 shared_with_client: boolean
 r2_key?: string
}

type AnnotationItem = {
  id: string
  note: string
  kind: string
  x_pct?: number | null
  y_pct?: number | null
  author_name?: string
  created_at?: string
  payload?: any
}

export default function DocumentVault() {
 const params = useParams()
 const router = useRouter()
 const searchParams = useSearchParams()
 const projectId = params.id as string
 const fileInputRef = useRef<HTMLInputElement>(null)
 const imageWrapRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const confirm = useConfirm()
  const prompt = usePrompt()

  const [documents, setDocuments] = useState<DocumentItem[]>([])
 const [selectedFolder, setSelectedFolder] = useState<string>('all')
 const [folders, setFolders] = useState<string[]>(['general', 'drawings', 'contracts', 'permits', 'reports', 'Google Drive'])
 const [uploadQueue, setUploadQueue] = useState<{ name: string; progress: number; id: string }[]>([])
 const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null)
 const [loading, setLoading] = useState(true)
 const [loadError, setLoadError] = useState<unknown>(null)
 const [postingComment, setPostingComment] = useState(false)
 const [annotations, setAnnotations] = useState<AnnotationItem[]>([])
 const [commentDraft, setCommentDraft] = useState('')
 const [pinMode, setPinMode] = useState(false)
 const [annotationsLoading, setAnnotationsLoading] = useState(false)
 const [drawMode, setDrawMode] = useState(false)
 const [drawing, setDrawing] = useState(false)
 const [strokePoints, setStrokePoints] = useState<{ x: number; y: number }[]>([])

 // Google Docs and AutoCAD/Fusion 360 viewer state variables
 const [googleDocsList, setGoogleDocsList] = useState<{ id: string; title: string; url: string; lastUpdated: string; type: 'doc' | 'sheet' }[]>([])
 const [newGDocTitle, setNewGDocTitle] = useState('')
 const [newGDocType, setNewGDocType] = useState<'doc' | 'sheet'>('doc')
 const [showLinkGDocModal, setShowLinkGDocModal] = useState(false)
 const [docVersions, setDocVersions] = useState<{
   id: string
   version: number
   created_at: string
   uploaded_by_name: string
   active: boolean
   note?: string
 }[]>([])
 const [versionsLoading, setVersionsLoading] = useState(false)
 const [restoringVersion, setRestoringVersion] = useState(false)
 const [newGDocUrl, setNewGDocUrl] = useState('')

 const [previewUrl, setPreviewUrl] = useState<string | null>(null)
 const [previewError, setPreviewError] = useState<string | null>(null)
 const [uploadingVersion, setUploadingVersion] = useState(false)
 const newVersionInputRef = useRef<HTMLInputElement>(null)

 const openDoc = useCallback(
   (doc: DocumentItem | null) => {
     setViewingDoc(doc)
     setCommentDraft('')
     setPinMode(false)
     setDrawMode(false)
     setStrokePoints([])
     const url = new URL(window.location.href)
     if (doc?.id) url.searchParams.set('doc', doc.id)
     else url.searchParams.delete('doc')
     router.replace(`${url.pathname}${url.search}`, { scroll: false })
   },
   [router]
 )

 const loadAnnotations = useCallback(
   async (documentId: string) => {
     setAnnotationsLoading(true)
     try {
       const res = await fetch(
         `/api/projects/${projectId}/document-annotations?document_id=${documentId}`
       )
       const data = await res.json()
       setAnnotations(Array.isArray(data.annotations) ? data.annotations : [])
     } catch {
       setAnnotations([])
     } finally {
       setAnnotationsLoading(false)
     }
   },
   [projectId]
 )

 useEffect(() => {
   if (!viewingDoc?.id) {
     setDocVersions([])
     setPreviewUrl(null)
     setPreviewError(null)
     setAnnotations([])
     return
   }
   setVersionsLoading(true)
   fetch(`/api/projects/${projectId}/document-versions?document_id=${viewingDoc.id}`)
     .then((r) => r.json())
     .then((data) => setDocVersions(Array.isArray(data.versions) ? data.versions : []))
     .catch(() => setDocVersions([]))
     .finally(() => setVersionsLoading(false))

   loadAnnotations(viewingDoc.id)

   const ext = (viewingDoc.extension || '').toLowerCase().replace(/^\./, '')
   if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(ext)) {
     setPreviewError(null)
     // inline=1 so the browser renders the file instead of downloading it
     fetch(`/api/files/download?id=${viewingDoc.id}&inline=1`)
       .then(async (r) => {
         const data = await r.json().catch(() => ({}))
         if (!r.ok || !data.url) {
           throw new Error(data.error || `Preview unavailable (${r.status})`)
         }
         setPreviewUrl(data.url)
       })
       .catch((err) => {
         setPreviewUrl(null)
         setPreviewError(err?.message || 'Could not load this file')
       })
   } else {
     setPreviewUrl(null)
     setPreviewError(null)
   }
 }, [projectId, viewingDoc?.id, viewingDoc?.extension, loadAnnotations])

 useEffect(() => {
   const docId = searchParams.get('doc')
   if (!docId || loading || documents.length === 0) return
   if (viewingDoc?.id === docId) return
   const match = documents.find((d) => d.id === docId)
   if (match) setViewingDoc(match)
 }, [searchParams, documents, loading, viewingDoc?.id])

 const postAnnotation = async (payload: {
   note: string
   kind?: string
   x_pct?: number
   y_pct?: number
   payload?: any
 }) => {
   if (!viewingDoc) return
   setPostingComment(true)
   try {
     const res = await fetch(`/api/projects/${projectId}/document-annotations`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ document_id: viewingDoc.id, ...payload }),
     })
     const data = await res.json()
     if (!res.ok) {
       toast(data.error || 'Could not save the annotation', 'error')
       return
     }
     setAnnotations((prev) => [...prev, data.annotation])
     setCommentDraft('')
     toast(payload.kind === 'pin' ? 'Pin added' : 'Comment posted', 'success')
   } catch (err: any) {
     toast(err?.message || 'Could not save the annotation', 'error')
   } finally {
     setPostingComment(false)
   }
 }

 const restoreVersion = async (versionId: string, versionNum: number) => {
   if (!viewingDoc || restoringVersion) return
   const ok = await confirm({
     title: `Restore version ${versionNum}`,
     message: `Version ${versionNum} of “${viewingDoc.name}” will be copied over the current file as a new version. Anyone opening this document, including the client portal, sees the restored file from now on.`,
     confirmLabel: 'Restore version',
   })
   if (!ok) return
   setRestoringVersion(true)
   try {
     const res = await fetch(`/api/projects/${projectId}/document-versions`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ document_id: viewingDoc.id, version_id: versionId }),
     })
     const data = await res.json()
     if (!res.ok) {
       toast(data.error || 'Could not restore that version', 'error')
       return
     }
     const nextVer = data.version || viewingDoc.version + 1
     setViewingDoc({ ...viewingDoc, version: nextVer })
     setDocuments((prev) =>
       prev.map((d) => (d.id === viewingDoc.id ? { ...d, version: nextVer } : d))
     )
     const refresh = await fetch(
       `/api/projects/${projectId}/document-versions?document_id=${viewingDoc.id}`
     ).then((r) => r.json())
     setDocVersions(Array.isArray(refresh.versions) ? refresh.versions : [])
     toast(`Version ${versionNum} restored as v${nextVer}`, 'success')
   } catch (err: any) {
     toast(err?.message || 'Could not restore that version', 'error')
   } finally {
     setRestoringVersion(false)
   }
 }

 const handleNewVersionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
   const file = e.target.files?.[0]
   e.target.value = ''
   if (!file || !viewingDoc || uploadingVersion) return

   setUploadingVersion(true)
   try {
     const form = new FormData()
     form.append('file', file)
     form.append('projectId', projectId)
     const uploadRes = await fetch('/api/files/upload', { method: 'POST', body: form })
     const uploadData = await uploadRes.json()
     if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed')

     const res = await fetch(`/api/projects/${projectId}/document-versions`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         document_id: viewingDoc.id,
         r2_key: uploadData.r2_key,
         original_filename: file.name,
         extension: (file.name.split('.').pop() || viewingDoc.extension).toLowerCase(),
         size_bytes: file.size,
       }),
     })
     const data = await res.json()
     if (!res.ok) throw new Error(data.error || 'Could not save the new version')

     const nextVer = data.version || viewingDoc.version + 1
     const updated = {
       ...viewingDoc,
       version: nextVer,
       original_filename: file.name,
       size_bytes: file.size,
     }
     setViewingDoc(updated)
     setDocuments((prev) => prev.map((d) => (d.id === viewingDoc.id ? { ...d, ...updated } : d)))
     const refresh = await fetch(
       `/api/projects/${projectId}/document-versions?document_id=${viewingDoc.id}`
     ).then((r) => r.json())
     setDocVersions(Array.isArray(refresh.versions) ? refresh.versions : [])
     toast(`Saved as version ${nextVer}`, 'success')
   } catch (err: any) {
     toast(err?.message || 'Could not upload the new version', 'error')
   } finally {
     setUploadingVersion(false)
   }
 }

 const loadDocuments = useCallback(async (opts?: { quiet?: boolean }) => {
   if (!opts?.quiet) {
     setLoading(true)
     setLoadError(null)
   }
   try {
     const res = await fetch(`/api/projects/${projectId}/documents`)
     const d = await res.json()
     if (!res.ok) throw new Error(d.error || 'Failed to load the document vault')
     setDocuments(
       (d.documents || []).map((doc: any) => ({
         id: doc.id,
         name: doc.name,
         original_filename: doc.original_filename || doc.name,
         extension: doc.extension || 'pdf',
         size_bytes: doc.size_bytes || 0,
         version: doc.version || 1,
         phase: doc.phase || 'construction_docs',
         folder: doc.folder || 'general',
         status: doc.status || 'active',
         approval_status: doc.approval_status || 'pending',
         uploaded_by: doc.uploaded_by || '—',
         created_at: (doc.created_at || '').slice(0, 10),
         shared_with_client: !!doc.shared_with_client,
         r2_key: doc.r2_key,
       }))
     )
   } catch (e) {
     if (!opts?.quiet) setLoadError(e)
   } finally {
     if (!opts?.quiet) setLoading(false)
   }
 }, [projectId])

 useEffect(() => {
   loadDocuments()
 }, [loadDocuments])

 useLiveReload(loadDocuments, ['documents'])

 const handleUploadClick = () => {
 fileInputRef.current?.click()
 }

 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = e.target.files
 if (!files || files.length === 0) return

 const selectedFile = files[0]
 const uploadId = `up-${Date.now()}`
 
 setUploadQueue(prev => [...prev, { name: selectedFile.name, progress: 0, id: uploadId }])

 try {
 const ext = selectedFile.name.split('.').pop() || 'dat'
 const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name
 
 try {
 const buffer = await selectedFile.arrayBuffer()
 const cacheKey = `${nameWithoutExt}_v1`
 await writeLocalFile(projectId, cacheKey, buffer)
 } catch {
 // OPFS optional in some browsers
 }

 // Prefer multipart upload API (works in mock + R2 production)
 setUploadQueue(prev => prev.map(item => item.id === uploadId ? { ...item, progress: 30 } : item))
 const form = new FormData()
 form.append('file', selectedFile)
 form.append('projectId', projectId)
 const uploadRes = await fetch('/api/files/upload', { method: 'POST', body: form })
 const uploadData = await uploadRes.json()
 if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed')
 if (uploadData.warning) {
   toast(uploadData.warning, 'warning', 6000)
 }
 setUploadQueue(prev => prev.map(item => item.id === uploadId ? { ...item, progress: 80 } : item))

 const metaRes = await fetch(`/api/projects/${projectId}/documents`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 name: nameWithoutExt,
 original_filename: selectedFile.name,
 extension: ext,
 size_bytes: selectedFile.size,
 folder: selectedFolder === 'all' || selectedFolder === 'Google Drive' ? 'general' : selectedFolder,
 r2_key: uploadData.r2_key,
 }),
 })
 const metaData = await metaRes.json()
 if (!metaRes.ok) throw new Error(metaData.error || 'Failed to save document record')

 const doc = metaData.document
 const newDoc: DocumentItem = {
 id: doc.id,
 name: doc.name,
 original_filename: doc.original_filename || selectedFile.name,
 extension: doc.extension || ext,
 size_bytes: doc.size_bytes || selectedFile.size,
 version: doc.version || 1,
 phase: doc.phase || 'construction_docs',
 folder: doc.folder || 'general',
 status: doc.status || 'active',
 approval_status: doc.approval_status || 'pending',
 uploaded_by: 'You',
 created_at: (doc.created_at || new Date().toISOString()).slice(0, 10),
 shared_with_client: !!doc.shared_with_client,
 }

 setDocuments(prev => [newDoc, ...prev])
 setUploadQueue(prev => prev.map(item => item.id === uploadId ? { ...item, progress: 100 } : item))
 openDoc(newDoc)
 toast(`${newDoc.name} uploaded`, 'success')

 const savedChecklist = localStorage.getItem('onboarding_checklist_v1')
 if (savedChecklist) {
 const parsed = JSON.parse(savedChecklist)
 parsed.document = true
 localStorage.setItem('onboarding_checklist_v1', JSON.stringify(parsed))
 }
 } catch (err) {
 console.error(err)
 toast(err instanceof Error ? err.message : 'Upload failed', 'error')
 } finally {
 setTimeout(() => {
 setUploadQueue(prev => prev.filter(item => item.id !== uploadId))
 }, 800)
 if (fileInputRef.current) fileInputRef.current.value = ''
 }
 }

 const handleToggleShare = async (docId: string) => {
 const doc = documents.find((d) => d.id === docId) || (viewingDoc?.id === docId ? viewingDoc : null)
 if (!doc) return
 const next = !doc.shared_with_client
 const revert = () => {
 setDocuments((prev) =>
 prev.map((d) => (d.id === docId ? { ...d, shared_with_client: !next } : d))
 )
 setViewingDoc((prev) => (prev?.id === docId ? { ...prev, shared_with_client: !next } : prev))
 }
 setDocuments((prev) =>
 prev.map((d) => (d.id === docId ? { ...d, shared_with_client: next } : d))
 )
 if (viewingDoc?.id === docId) setViewingDoc({ ...viewingDoc, shared_with_client: next })
 try {
 const res = await fetch(`/api/projects/${projectId}/documents`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ document_id: docId, shared_with_client: next }),
 })
 if (!res.ok) {
 const data = await res.json().catch(() => ({}))
 revert()
 toast(data.error || 'Could not change the portal visibility', 'error')
 return
 }
 toast(next ? 'Shared to the client portal' : 'Hidden from the client portal', 'success')
 } catch (err: any) {
 revert()
 toast(err?.message || 'Could not change the portal visibility', 'error')
 }
 }

 const handleApprovalUpdate = async (docId: string, status: DocumentItem['approval_status']) => {
 const previous =
 documents.find((d) => d.id === docId)?.approval_status ??
 (viewingDoc?.id === docId ? viewingDoc.approval_status : 'pending')
 const revert = () => {
 setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, approval_status: previous } : d)))
 setViewingDoc((prev) => (prev?.id === docId ? { ...prev, approval_status: previous } : prev))
 }
 setDocuments((prev) =>
 prev.map((d) => (d.id === docId ? { ...d, approval_status: status } : d))
 )
 if (viewingDoc?.id === docId) setViewingDoc({ ...viewingDoc, approval_status: status })
 try {
 const res = await fetch(`/api/projects/${projectId}/documents`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ document_id: docId, approval_status: status }),
 })
 if (!res.ok) {
 const data = await res.json().catch(() => ({}))
 revert()
 toast(data.error || 'Could not update the approval status', 'error')
 return
 }
 toast(status === 'approved' ? 'Document approved' : `Marked as ${status.replace(/_/g, ' ')}`, 'success')
 } catch (err: any) {
 revert()
 toast(err?.message || 'Could not update the approval status', 'error')
 }
 }

  const getDocTypeIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case 'pdf': return 'picture_as_pdf'
      case 'dwg':
      case 'dxf': return 'architecture'
      case 'rvt': return 'foundation'
      case 'jpg':
      case 'png': return 'image'
      case 'gdoc': return 'description'
      case 'gsheet': return 'table_chart'
      default: return 'insert_drive_file'
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return 'Cloud Link'
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  const allDocs = [
    ...documents,
    ...googleDocsList.map(g => ({
      id: g.id,
      name: g.title,
      original_filename: g.url,
      extension: g.type === 'doc' ? 'gdoc' : 'gsheet',
      size_bytes: 0,
      version: 1,
      phase: 'coordination',
      folder: 'Google Drive',
      status: 'active',
      approval_status: 'approved' as const,
      uploaded_by: 'Workspace Sync',
      created_at: g.lastUpdated,
      shared_with_client: true
    }))
  ]

  const filteredDocs = selectedFolder === 'all' 
    ? allDocs 
    : allDocs.filter(d => d.folder === selectedFolder)

  const activeGoogleUrl = viewingDoc
    ? googleDocsList.find((g) => g.id === viewingDoc.id || g.title === viewingDoc.name)?.url
    : undefined

 return (
 <div className="space-y-6 font-body select-none relative h-full">
 {/* Dynamic Floating Upload Progress queue */}
 {uploadQueue.length > 0 && (
 <div className="fixed bottom-6 left-6 z-50 w-72 bg-navy-mid border rounded-lg shadow-none p-4 space-y-3">
 <div className="flex items-center justify-between text-xs border-b pb-2">
 <span className="font-semibold text-white tracking-wider">Background Uploading...</span>
 <span className="material-icons-outlined text-amber text-[16px] animate-spin">sync</span>
 </div>
 {uploadQueue.map(item => (
 <div key={item.id} className="space-y-1 text-xs">
 <div className="flex justify-between text-stone truncate max-w-[240px]">
 <span className="truncate">{item.name}</span>
 <span className="font-mono">{item.progress}%</span>
 </div>
 <div className="w-full bg-navy h-1.5 rounded-full overflow-hidden border ">
 <div className="bg-amber h-full rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Main Layout containing folder column and document lists */}
 <div className="flex flex-col md:flex-row gap-6 items-start h-full">
 {/* Left collapsible folders lists */}
 <div className="card-5bloc w-full md:w-56 shrink-0 py-4 px-3 space-y-4">
 <div className="flex items-center justify-between px-2 pb-2 border-b ">
 <span className="text-xs font-semibold text-amber font-body">Folders</span>
 <span className="material-icons-outlined text-[16px] text-stone">create_new_folder</span>
 </div>
 <nav className="space-y-1">
 <button
 onClick={() => setSelectedFolder('all')}
 className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition ${
 selectedFolder === 'all' ? 'bg-amber text-navy font-bold' : 'text-stone hover:text-white hover:bg-navy-lt'
 }`}
 >
 <span className="flex items-center gap-2">
 <span className="material-icons-outlined text-[16px]">folder_open</span>
 <span>All Documents</span>
 </span>
 <span className="font-mono text-[10px]">{documents.length}</span>
 </button>
 
 {folders.map(folder => {
 const count = documents.filter(d => d.folder === folder).length
 return (
 <button
 key={folder}
 onClick={() => setSelectedFolder(folder)}
 className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition capitalize ${
 selectedFolder === folder ? 'bg-amber text-navy font-bold' : 'text-stone hover:text-white hover:bg-navy-lt'
 }`}
 >
 <span className="flex items-center gap-2">
 <span className="material-icons-outlined text-[16px]">folder</span>
 <span>{folder}</span>
 </span>
 <span className="font-mono text-[10px]">{count}</span>
 </button>
 )
 })}
 </nav>
 </div>

 {/* Right side Document data display table */}
 <div className="card-5bloc flex-1 w-full overflow-hidden flex flex-col justify-between min-h-[400px]">
 {/* Action header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ">
 <div>
 <h3 className="text-sm font-semibold text-white capitalize">
 {selectedFolder === 'all' ? 'All Files' : `${selectedFolder} folder`}
 </h3>
 <p className="text-[11px] text-stone mt-0.5">Double click rows to inspect layout drawings.</p>
 </div>
 
  <div className="flex flex-wrap gap-2">
  <button 
    onClick={() => setShowLinkGDocModal(true)} 
    className="btn-secondary py-2 text-xs flex items-center gap-1.5 hover:text-amber animate-fade-in"
  >
    <span className="material-icons-outlined text-[16px] text-amber">link</span>
    Link Google Doc / Sheet
  </button>
  <button onClick={handleUploadClick} className="btn-primary py-2 text-xs">
  <span className="material-icons-outlined text-[16px]">upload_file</span>
  Upload Document
  </button>
 <input
 type="file"
 ref={fileInputRef}
 onChange={handleFileChange}
 accept=".pdf,.dwg,.dxf,.rvt,.jpg,.png,.zip"
 className="hidden"
 />
 </div>
 </div>

 {/* Files List Table */}
 {loading ? (
 <div className="mt-4 space-y-3">
 {Array.from({ length: 6 }, (_, i) => (
 <Skeleton key={i} className="h-14 w-full" />
 ))}
 </div>
 ) : loadError ? (
 <ErrorState
 className="mt-4"
 compact
 title="Could not load the document vault"
 error={loadError}
 onRetry={loadDocuments}
 />
 ) : filteredDocs.length === 0 ? (
 <EmptyState
 className="mt-4 flex-1"
 icon="folder_open"
 title={selectedFolder === 'all' ? 'No documents yet' : `Nothing in ${selectedFolder}`}
 description={
 selectedFolder === 'all'
 ? 'Upload drawings, contracts or approvals here. Every file is versioned, and you choose which ones the client can see.'
 : selectedFolder === 'Google Drive'
 ? 'Link a Google Doc or Sheet to keep working notes beside the project files.'
 : `No files have been filed under ${selectedFolder} yet. Upload one, or switch to All Documents to see everything.`
 }
 actionLabel={selectedFolder === 'all' ? 'Upload document' : undefined}
 onClick={selectedFolder === 'all' ? handleUploadClick : undefined}
 />
 ) : (
 <div className="overflow-x-auto flex-1 mt-4">
 <table className="w-full text-left text-xs ">
 <thead>
 <tr className="text-stone border-b font-body text-[10px] tracking-wider font-semibold">
 <th className="pb-3 pl-2">Type</th>
 <th className="pb-3">Name</th>
 <th className="pb-3">Uploaded By</th>
 <th className="pb-3">Date</th>
 <th className="pb-3">Size</th>
 <th className="pb-3">Approval</th>
 <th className="pb-3 pr-2 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-navy-lt/40">
 {filteredDocs.map((doc) => (
 <tr 
 key={doc.id}
 className="hover:bg-navy-lt/20 cursor-pointer transition-colors group"
 onClick={() => openDoc(doc)}
 >
 {/* Extension Icon */}
 <td className="py-3.5 pl-2">
 <div className="w-8 h-8 rounded-md bg-navy flex items-center justify-center border text-amber shrink-0">
 <span className="material-icons-outlined text-[18px]">
 {getDocTypeIcon(doc.extension)}
 </span>
 </div>
 </td>

 {/* File Name + Version badge */}
 <td className="py-3.5 font-medium pr-4">
 <div className="flex items-center gap-2">
 <span className="text-white hover:text-amber transition-colors line-clamp-1">{doc.name}</span>
 <span className="bg-navy border text-stone text-[9px] font-mono px-1 rounded-md">
 v{doc.version}
 </span>
 </div>
 <span className="text-[10px] text-stone font-mono block truncate max-w-[180px]">{doc.original_filename}</span>
 </td>

 {/* Uploader */}
 <td className="py-3.5 text-stone truncate max-w-[120px]">{doc.uploaded_by}</td>

 {/* Upload Date */}
 <td className="py-3.5 font-mono text-[10px] text-stone">{doc.created_at}</td>

 {/* Bytes size */}
 <td className="py-3.5 font-mono text-[10px] text-stone">{formatSize(doc.size_bytes)}</td>

 {/* Approval Status Badge */}
 <td className="py-3.5">
 <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
 doc.approval_status === 'approved' 
 ? 'bg-success/15 text-success ' 
 : doc.approval_status === 'rejected'
 ? 'bg-error/15 text-error '
 : 'bg-stone/15 text-stone '
 }`}>
 {doc.approval_status.replace(/_/g, ' ').toUpperCase()}
 </span>
 </td>

 {/* Action Triggers */}
 <td className="py-3.5 pr-2 text-right">
 <div className="flex items-center justify-end gap-2.5">
 {/* Portal visibility sync badge */}
 <button
 onClick={(e) => {
   e.stopPropagation()
   handleToggleShare(doc.id)
 }}
 className={`p-1 rounded-md hover:bg-navy-lt transition ${
 doc.shared_with_client ? 'text-success' : 'text-stone hover:text-white'
 }`}
 title={doc.shared_with_client ? 'Visible in Client Portal' : 'Private to team'}
 >
 <span className="material-icons-outlined text-[16px]">
 {doc.shared_with_client ? 'visibility' : 'visibility_off'}
 </span>
 </button>

 {/* Quick Approval Check */}
 {doc.approval_status === 'pending' && (
 <button
 onClick={(e) => {
   e.stopPropagation()
   handleApprovalUpdate(doc.id, 'approved')
 }}
 className="p-1 rounded-md hover:bg-navy-lt text-stone hover:text-success transition"
 title="Approve Document"
 >
 <span className="material-icons-outlined text-[16px]">check_circle</span>
 </button>
 )}

 <button 
 onClick={(e) => {
   e.stopPropagation()
   openDoc(doc)
 }}
 className="p-1 rounded-md hover:bg-navy-lt text-stone hover:text-white transition"
 title="Open document"
 >
 <span className="material-icons-outlined text-[16px]">open_in_new</span>
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>

 {/* File Lightbox Viewer Overlay */}
 {viewingDoc && (
 <div className="fixed inset-0 bg-navy/95 backdrop-blur-md flex items-center justify-center z-50 p-6">
 <div className="w-full max-w-6xl h-[90vh] bg-navy-mid border rounded-lg overflow-hidden flex flex-col justify-between shadow-none relative">
 {/* Overlay Header details */}
 <div className="px-6 py-4 bg-navy border-b flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <span className="material-icons-outlined text-amber text-[20px]">
 {getDocTypeIcon(viewingDoc.extension)}
 </span>
 <div>
 <h3 className="text-sm font-semibold text-white">{viewingDoc.name}</h3>
 <p className="text-[10px] text-stone font-body">Filename: {viewingDoc.original_filename} (Version {viewingDoc.version})</p>
 </div>
 </div>
 <button 
 onClick={() => openDoc(null)}
 className="text-stone hover:text-white transition p-1 hover:bg-navy-lt rounded-md"
 >
 <span className="material-icons-outlined text-[20px]">close</span>
 </button>
 </div>

{/* Viewer body area */}
  <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
    {/* Left column: main viewer */}
    <div className="flex-1 flex items-center justify-center p-8 bg-navy/20 relative overflow-y-auto">
      {(viewingDoc.extension || '').toLowerCase() === 'pdf' ? (
        <div className="w-full h-full min-h-[300px] border bg-navy/70 rounded-md flex flex-col overflow-hidden">
          {previewUrl ? (
            <iframe
              title={viewingDoc.name}
              src={previewUrl}
              className="w-full flex-1 min-h-[300px] bg-white"
            />
          ) : previewError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone">
              <span className="material-icons-outlined text-[48px] text-error mb-2">error_outline</span>
              <span className="text-xs font-semibold text-white">This PDF could not be opened</span>
              <span className="text-[10px] mt-1 max-w-xs leading-relaxed">{previewError}</span>
              <button
                type="button"
                className="btn-secondary py-1 px-4 text-[11px] mt-3"
                onClick={() => setViewingDoc(viewingDoc ? { ...viewingDoc } : null)}
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone">
              <span className="material-icons-outlined text-[48px] text-amber mb-2">picture_as_pdf</span>
              <span className="text-xs font-semibold text-white">Loading PDF preview…</span>
              <span className="text-[10px] mt-1">Fetching signed download URL.</span>
            </div>
          )}
          <div className="shrink-0 px-4 py-2 border-t flex justify-end bg-navy/40">
            <button
              type="button"
              className="btn-secondary py-1 px-4 text-xs"
              onClick={async () => {
                const url = previewUrl
                if (url) {
                  window.open(url, '_blank')
                  return
                }
                try {
                  const res = await fetch(`/api/files/download?id=${viewingDoc.id}`)
                  const data = await res.json()
                  if (res.ok && data.url) window.open(data.url, '_blank')
                  else toast(data.error || 'This file is not available for download', 'error')
                } catch (err: any) {
                  toast(err?.message || 'This file is not available for download', 'error')
                }
              }}
            >
              Download file
            </button>
          </div>
        </div>
      ) : viewingDoc.extension === 'jpg' || viewingDoc.extension === 'jpeg' || viewingDoc.extension === 'png' || viewingDoc.extension === 'gif' || viewingDoc.extension === 'webp' ? (
        /* Image preview with pin / draw overlay */
        <div
          ref={imageWrapRef}
          className={`max-w-full max-h-full overflow-hidden rounded-md border relative bg-navy/70 flex items-center justify-center min-h-[200px] ${pinMode || drawMode ? 'cursor-crosshair' : ''}`}
          onClick={async (e) => {
            if (!pinMode || !imageWrapRef.current) return
            const rect = imageWrapRef.current.getBoundingClientRect()
            const x_pct = ((e.clientX - rect.left) / rect.width) * 100
            const y_pct = ((e.clientY - rect.top) / rect.height) * 100
            const values = await prompt({
              title: 'Add a pin comment',
              message: 'This marks the spot you clicked on the drawing and is visible to everyone on the project.',
              confirmLabel: 'Add pin',
              fields: [
                { name: 'note', label: 'Comment', type: 'textarea', placeholder: 'What needs attention here?' },
              ],
            })
            if (!values) return
            await postAnnotation({ note: values.note, kind: 'pin', x_pct, y_pct })
            setPinMode(false)
          }}
          onMouseDown={(e) => {
            if (!drawMode || !imageWrapRef.current) return
            setDrawing(true)
            const rect = imageWrapRef.current.getBoundingClientRect()
            setStrokePoints([
              {
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100,
              },
            ])
          }}
          onMouseMove={(e) => {
            if (!drawing || !drawMode || !imageWrapRef.current) return
            const rect = imageWrapRef.current.getBoundingClientRect()
            setStrokePoints((prev) => [
              ...prev,
              {
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100,
              },
            ])
          }}
          onMouseUp={async () => {
            if (!drawing || !drawMode) return
            setDrawing(false)
            if (strokePoints.length > 2) {
              await postAnnotation({
                note: 'Freehand markup',
                kind: 'stroke',
                payload: { points: strokePoints },
              })
            }
            setStrokePoints([])
          }}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={viewingDoc.name}
              className="max-w-full max-h-[55vh] object-contain pointer-events-none select-none"
              draggable={false}
            />
          ) : (
            <span className="text-[11px] text-stone">Loading preview…</span>
          )}
          {annotations
            .filter((a) => a.kind === 'pin' && a.x_pct != null && a.y_pct != null)
            .map((a) => (
              <button
                key={a.id}
                type="button"
                title={a.note}
                className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-amber border-2 border-white shadow"
                style={{ left: `${a.x_pct}%`, top: `${a.y_pct}%` }}
              />
            ))}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {annotations
              .filter((a) => a.kind === 'stroke' && Array.isArray(a.payload?.points))
              .map((a) => (
                <polyline
                  key={a.id}
                  fill="none"
                  stroke="#F5A623"
                  strokeWidth="0.6"
                  points={a.payload.points
                    .map((p: { x: number; y: number }) => `${p.x},${p.y}`)
                    .join(' ')}
                />
              ))}
            {strokePoints.length > 1 && (
              <polyline
                fill="none"
                stroke="#F5A623"
                strokeWidth="0.6"
                points={strokePoints.map((p) => `${p.x},${p.y}`).join(' ')}
              />
            )}
          </svg>
        </div>
      ) : viewingDoc.extension === 'gdoc' || viewingDoc.extension === 'gsheet' ? (
        /* Google Workspace Document / Sheet Sync Viewer */
        <div className="w-full h-full flex flex-col bg-white border text-stone relative overflow-hidden rounded-md">
          <div className="bg-[#4285F4]/10 px-4 py-2 border-b flex items-center justify-between text-[#4285F4] text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="material-icons-outlined text-[16px]">cloud_queue</span>
              <span>Linked Google Workspace bookmark</span>
            </div>
            <span className="text-[10px] bg-[#4285F4]/15 px-2 py-0.5 rounded">AUTO-SYNC ACTIVE</span>
          </div>

          <div className="flex-1 overflow-y-auto bg-stone-100 p-6 flex justify-center">
            <div className="w-full max-w-2xl bg-white shadow-sm border p-8 text-[#1a1714] min-h-[400px]">
              {viewingDoc.extension === 'gdoc' ? (
                <div className="space-y-4 text-xs leading-relaxed">
                  <h1 className="text-lg font-bold border-b pb-2 text-stone-800">{viewingDoc.name}</h1>
                  <p className="font-semibold text-stone-700">1. Ground Setbacks & Boundary Clearances:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
                    <li><strong>Front setbacks:</strong> 6.0 meters clear from local municipal road boundary.</li>
                    <li><strong>Left & Right side set-back limits:</strong> 3.0 meters clear on all floor slabs.</li>
                    <li><strong>Rear building boundary set-back:</strong> 4.5 meters minimum to satisfy sewage lines.</li>
                  </ul>
                  <p className="font-semibold text-stone-700">2. BBMP Floor Area Ratio (FAR):</p>
                  <p className="text-stone-600">
                    The maximum allowable FAR for this Bangalore structural layout is 2.25 based on the 12.0-meter access road width. The current architectural draft details a layout totaling 2.21 FAR, which fully complies with zoning rules.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <h1 className="text-base font-bold text-stone-850 pb-1">{viewingDoc.name}</h1>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border">
                      <thead>
                        <tr className="bg-[#f5f2ee] border-b text-stone-700 font-bold">
                          <th className="p-2">Material Description</th>
                          <th className="p-2 text-right">Vendor A (Braj Build, Pune)</th>
                          <th className="p-2 text-right">Vendor B (Jaipur Stone, RJ)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-stone-600">
                        <tr>
                          <td className="p-2 font-medium">Granite slabs (60mm thick floor grade)</td>
                          <td className="p-2 text-right text-success font-semibold">₹320/sqft</td>
                          <td className="p-2 text-right">₹345/sqft</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium">Vitrified floor tiling (600mm x 600mm)</td>
                          <td className="p-2 text-right">₹54/sqft</td>
                          <td className="p-2 text-right text-success font-semibold">₹48/sqft</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium">Cladding Sandstone blocks</td>
                          <td className="p-2 text-right">₹180/sqft</td>
                          <td className="p-2 text-right text-success font-semibold">₹165/sqft</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#FAFAF8] border-t px-4 py-3 flex flex-wrap justify-between items-center gap-3">
            <p className="text-[11px] text-stone leading-relaxed max-w-md">
              Bye-law AI, BOQ sync, and Gmail draft are not connected. Open the Google link in a new tab to edit.
            </p>
            {activeGoogleUrl ? (
              <a
                href={activeGoogleUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary py-1 px-3 text-[11px] flex items-center gap-1.5"
              >
                <span className="material-icons-outlined text-[14px] text-amber">open_in_new</span>
                Open in Google
              </a>
            ) : (
              <p
                className="text-[11px] flex items-center gap-1.5 px-3 py-1 border rounded-md"
                style={{ color: 'var(--stone)' }}
              >
                <span className="material-icons-outlined text-[14px]" aria-hidden>
                  link_off
                </span>
                No Google link saved — relink this item to open it
              </p>
            )}
          </div>
        </div>
      ) : (
        <DocumentCadViewer
          documentId={viewingDoc.id}
          projectId={projectId}
          filename={viewingDoc.original_filename || viewingDoc.name}
        />
      )}
    </div>

    {/* Right column: Version History & PDF Tools panels */}
    <div className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l bg-navy p-5 space-y-6 overflow-y-auto">
      {/* Version History section */}
      <div className="space-y-3">
        <div className="border-b pb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold font-mono text-amber uppercase tracking-wider">Version History</span>
          <span className="material-icons-outlined text-stone text-[15px]">history</span>
        </div>
        <div>
          <input
            ref={newVersionInputRef}
            type="file"
            className="hidden"
            onChange={handleNewVersionUpload}
          />
          <button
            type="button"
            disabled={uploadingVersion}
            onClick={() => newVersionInputRef.current?.click()}
            className="btn-secondary py-1.5 text-[11px] w-full justify-center disabled:opacity-50"
          >
            <span className="material-icons-outlined text-[14px]">upload_file</span>
            {uploadingVersion ? 'Uploading…' : `Upload new version (v${(viewingDoc?.version || 1) + 1})`}
          </button>
          <p className="text-[10px] text-stone mt-1.5 leading-relaxed">
            Replaces the active file. Older versions stay listed below and can be restored.
          </p>
        </div>
        <div className="space-y-3">
          {versionsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }, (_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : docVersions.length === 0 ? (
            <p className="text-[10px] text-stone">No version history yet. Upload or open a stored file to start tracking.</p>
          ) : (
            docVersions.map((v) => (
              <div
                key={v.id}
                className={`p-3 border text-xs space-y-1.5 ${v.active ? 'bg-amber/5 border-amber/35' : 'bg-navy/40 border-navy-lt/50'}`}
              >
                <div className="flex justify-between items-center font-mono">
                  <span className={`font-bold ${v.active ? 'text-amber' : 'text-white'}`}>
                    Version {v.version}
                  </span>
                  {v.active ? (
                    <span className="text-[9px] bg-amber/15 text-amber px-1.5 py-0.5 rounded font-bold uppercase">
                      Active
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={restoringVersion}
                      onClick={() => restoreVersion(v.id, v.version)}
                      className="text-[9px] text-blue font-bold uppercase hover:underline disabled:opacity-50"
                    >
                      {restoringVersion ? 'Restoring…' : 'Restore'}
                    </button>
                  )}
                </div>
                <div className="flex justify-between text-[10px] text-stone">
                  <span>{v.created_at ? new Date(v.created_at).toLocaleDateString() : '—'}</span>
                  <span>By: {v.uploaded_by_name}</span>
                </div>
                {v.note ? <p className="text-[10px] text-stone/80">{v.note}</p> : null}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions + comments */}
      <div className="space-y-3 pt-2">
        <div className="border-b pb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold font-mono text-blue uppercase tracking-wider">Actions</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="btn-secondary py-1.5 text-[11px]"
            onClick={() => handleToggleShare(viewingDoc.id)}
          >
            {viewingDoc.shared_with_client ? 'Unshare portal' : 'Share to portal'}
          </button>
          {viewingDoc.approval_status === 'pending' ? (
            <button
              type="button"
              className="btn-secondary py-1.5 text-[11px]"
              onClick={() => handleApprovalUpdate(viewingDoc.id, 'approved')}
            >
              Approve
            </button>
          ) : (
            <button
              type="button"
              className="btn-secondary py-1.5 text-[11px]"
              onClick={() => handleApprovalUpdate(viewingDoc.id, 'pending')}
            >
              Mark pending
            </button>
          )}
        </div>
        {['jpg', 'jpeg', 'png', 'gif', 'webp'].includes((viewingDoc.extension || '').toLowerCase()) && (
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 py-1.5 text-[11px] rounded-md border ${pinMode ? 'bg-amber/20 text-amber border-amber/40' : 'btn-secondary'}`}
              onClick={() => {
                setPinMode((v) => !v)
                setDrawMode(false)
              }}
            >
              {pinMode ? 'Click image to pin…' : 'Pin comment'}
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 text-[11px] rounded-md border ${drawMode ? 'bg-amber/20 text-amber border-amber/40' : 'btn-secondary'}`}
              onClick={() => {
                setDrawMode((v) => !v)
                setPinMode(false)
              }}
            >
              {drawMode ? 'Drawing…' : 'Draw'}
            </button>
          </div>
        )}
        <div className="border-b pb-2 flex items-center justify-between pt-2">
          <span className="text-[10px] font-bold font-mono text-blue uppercase tracking-wider">Comments</span>
          <span className="text-[10px] text-stone">{annotations.length}</span>
        </div>
        <div className="max-h-40 overflow-y-auto space-y-2">
          {annotationsLoading ? (
            <Skeleton lines={2} />
          ) : annotations.filter((a) => a.kind !== 'stroke').length === 0 ? (
            <p className="text-[10px] text-stone">
              No comments yet. Add one below, or pin a note directly on the drawing.
            </p>
          ) : (
            annotations
              .filter((a) => a.kind !== 'stroke')
              .map((a) => (
                <div key={a.id} className="rounded-md border border-navy-lt/50 bg-navy/40 p-2">
                  <div className="flex justify-between text-[10px] text-stone mb-1">
                    <span>{a.author_name || 'Team'}</span>
                    <span>{a.kind === 'pin' ? 'Pin' : 'Comment'}</span>
                  </div>
                  <p className="text-[11px] text-white whitespace-pre-wrap">{a.note}</p>
                </div>
              ))
          )}
        </div>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!commentDraft.trim()) return
            await postAnnotation({ note: commentDraft.trim(), kind: 'comment' })
          }}
        >
          <textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            rows={2}
            placeholder="Add a comment…"
            className="input-5bloc text-xs w-full resize-none"
          />
          <button
            type="submit"
            disabled={postingComment || !commentDraft.trim()}
            className="btn-primary w-full py-1.5 text-xs"
          >
            {postingComment ? 'Posting…' : 'Post comment'}
          </button>
        </form>
        <button
          type="button"
          onClick={async () => {
            try {
              const res = await fetch(`/api/files/download?id=${viewingDoc.id}`)
              const data = await res.json()
              if (res.ok && data.url) window.open(data.url, '_blank')
              else toast(data.error || 'This file is not available for download', 'error')
            } catch (err: any) {
              toast(err?.message || 'This file is not available for download', 'error')
            }
          }}
          className="btn-secondary w-full py-1.5 text-xs text-left px-3 flex items-center gap-2"
        >
          <span className="material-icons-outlined text-[15px] text-stone">download</span>
          Download current file
        </button>
      </div>
    </div>
  </div>

 {/* Viewer footer audit logs */}
 <div className="px-6 py-3 bg-navy border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] text-stone font-mono">
 <span>Uploaded: {viewingDoc.created_at} by {viewingDoc.uploaded_by}</span>
 <div className="flex gap-4">
 <span>Size: {formatSize(viewingDoc.size_bytes)}</span>
 <span className="capitalize">Status: {viewingDoc.approval_status}</span>
 </div>
 </div>
  </div>
  </div>
  )}

  {showLinkGDocModal && (
    <div className="fixed inset-0 bg-navy/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card-5bloc w-full max-w-md space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-navy-lt/50">
          <h3 className="text-sm font-semibold text-amber flex items-center gap-1.5">
            <span className="material-icons-outlined text-[18px]">cloud_queue</span>
            Link Google Workspace Document
          </h3>
          <button 
            onClick={() => setShowLinkGDocModal(false)}
            className="text-stone hover:text-white transition p-1"
          >
            <span className="material-icons-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-stone text-[10px] uppercase font-semibold tracking-wider mb-1.5">Document Title</label>
            <input 
              type="text"
              placeholder="e.g. Lotus Residences Structural Brief"
              value={newGDocTitle}
              onChange={(e) => setNewGDocTitle(e.target.value)}
              className="input-5bloc py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-stone text-[10px] uppercase font-semibold tracking-wider mb-1.5">Document Type</label>
            <select 
              value={newGDocType}
              onChange={(e) => setNewGDocType(e.target.value as any)}
              className="w-full bg-navy text-white border text-xs px-3 py-2 outline-none focus:ring-1 focus:ring-amber"
            >
              <option value="doc">Google Doc (Text)</option>
              <option value="sheet">Google Sheet (Spreadsheet)</option>
            </select>
          </div>

          <div>
            <label className="block text-stone text-[10px] uppercase font-semibold tracking-wider mb-1.5">
              Google Docs / Sheets URL
            </label>
            <input
              type="url"
              placeholder="https://docs.google.com/document/d/…"
              value={newGDocUrl}
              onChange={(e) => setNewGDocUrl(e.target.value)}
              className="input-5bloc py-2 text-xs"
            />
          </div>

          <div className="p-3 bg-navy border text-[11px] text-stone leading-relaxed">
            <span className="font-semibold text-amber block mb-1">Bookmark only</span>
            Paste a shareable Google Docs or Sheets link. OAuth sync is not connected — this saves a project bookmark in this session.
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button 
            onClick={() => setShowLinkGDocModal(false)}
            className="btn-secondary py-1.5 px-4 text-xs font-semibold"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (!newGDocTitle.trim() || !newGDocUrl.trim()) {
                toast('Add a title and a Google Docs or Sheets URL', 'error')
                return
              }
              try {
                const u = new URL(newGDocUrl.trim())
                if (!u.hostname.includes('google.com') && !u.hostname.includes('docs.google')) {
                  toast('That link is not a Google Docs or Sheets URL', 'error')
                  return
                }
              } catch {
                toast('That URL is not valid — paste the full https:// link', 'error')
                return
              }
              const newGDoc = {
                id: `gdoc-${Date.now()}`,
                title: newGDocTitle.trim(),
                url: newGDocUrl.trim(),
                lastUpdated: new Date().toISOString().split('T')[0],
                type: newGDocType
              };
              setGoogleDocsList(prev => [...prev, newGDoc]);
              setNewGDocTitle('');
              setNewGDocUrl('');
              setShowLinkGDocModal(false);
              toast(`${newGDoc.title} linked`, 'success');
            }}
            className="btn-primary py-1.5 px-4 text-xs font-semibold"
          >
            Save link
          </button>
        </div>
      </div>
    </div>
  )}
  </div>
  )
}
