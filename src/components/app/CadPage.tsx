import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from '@/compat/next-link'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui5/Toast'
import { useConfirm } from '@/components/ui5/ConfirmProvider'
import { ErrorState } from '@/components/ui5/ErrorState'
import { Skeleton } from '@/components/ui5/Skeleton'
import { AutodeskViewer } from '@/components/integrations/AutodeskViewer'
import { fetchVaultFile, translateCadFile } from '@/lib/cad/client-upload'

interface CadModel {
  urn:    string
  name:   string
  status: 'translating' | 'ready' | 'failed'
  addedAt: number
}

const STORAGE_KEY = '5bloc_cad_models'

export default function CadPage() {
  const { toast } = useToast()
  const confirm = useConfirm()
  const importedRef = useRef<string | null>(null)
  const [connected, setConnected]   = useState<boolean | null>(null)
  const [configured, setConfigured] = useState(false)
  const [statusError, setStatusError] = useState<unknown>(null)
  const [models, setModels]         = useState<CadModel[]>([])
  const [selected, setSelected]     = useState<string | null>(null)
  const [uploading, setUploading]   = useState(false)
  const [dragOver, setDragOver]     = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollers = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  const loadStatus = useCallback(() => {
    setStatusError(null)
    setConnected(null)
    fetch('/api/integrations/status')
      .then(r => {
        if (!r.ok) throw new Error('Could not check your Autodesk connection')
        return r.json()
      })
      .then((data) => {
        // Viewer + OSS upload use a 2-legged app token. User OAuth is optional.
        const ready = !!data.providers?.autodesk?.configured
        setConfigured(ready)
        setConnected(ready || (data.connected ?? []).includes('autodesk'))
      })
      .catch(err => setStatusError(err))
  }, [])

  // Load connection status + saved models
  useEffect(() => {
    loadStatus()

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as CadModel[]
      setModels(saved)
      if (saved.length) setSelected(saved.find(m => m.status === 'ready')?.urn ?? saved[0].urn)
      // resume polling for any still-translating
      saved.filter(m => m.status === 'translating').forEach(m => startPolling(m.urn))
    } catch { /* ignore */ }

    return () => { Object.values(pollers.current).forEach(clearInterval) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persist = useCallback((next: CadModel[]) => {
    setModels(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const updateModel = useCallback((urn: string, patch: Partial<CadModel>) => {
    setModels(prev => {
      const next = prev.map(m => m.urn === urn ? { ...m, ...patch } : m)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const startPolling = useCallback((urn: string) => {
    if (pollers.current[urn]) return
    pollers.current[urn] = setInterval(async () => {
      try {
        const res  = await fetch(`/api/integrations/autodesk/translate-status?urn=${encodeURIComponent(urn)}`)
        const data = await res.json()
        if (data.status === 'success') {
          updateModel(urn, { status: 'ready' })
          clearInterval(pollers.current[urn]); delete pollers.current[urn]
          setSelected(s => s ?? urn)
          toast('Model ready to view', 'success')
        } else if (data.status === 'failed' || data.status === 'timeout') {
          updateModel(urn, { status: 'failed' })
          clearInterval(pollers.current[urn]); delete pollers.current[urn]
          toast('Model translation failed', 'error')
        }
      } catch { /* keep polling */ }
    }, 5000)
  }, [toast, updateModel])

  const uploadCadFile = async (file: File, documentId?: string) => {
    setUploading(true)
    try {
      const doneData = await translateCadFile(file)
      if (documentId) {
        await fetch('/api/cad-models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id: documentId,
            urn: doneData.urn,
            name: doneData.name,
            status: 'translating',
          }),
        }).catch(() => {})
      }

      const model: CadModel = { urn: doneData.urn, name: doneData.name, status: 'translating', addedAt: Date.now() }
      setModels((prev) => {
        const next = [model, ...prev]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
      setSelected(doneData.urn)
      startPolling(doneData.urn)
      toast('Uploaded — translating model for the viewer…', 'info', 6000)
    } catch (e: any) {
      toast(e.message ?? 'Upload failed', 'error', 8000)
    } finally {
      setUploading(false)
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    await uploadCadFile(files[0])
  }

  // Project Documents → Open CAD viewer lands here with ?doc=<id>
  useEffect(() => {
    if (!connected) return
    const docId = new URLSearchParams(window.location.search).get('doc')
    if (!docId || importedRef.current === docId) return
    importedRef.current = docId
    ;(async () => {
      try {
        toast('Opening drawing from the vault…', 'info', 4000)
        const existing = await fetch(`/api/cad-models?document_id=${encodeURIComponent(docId)}`)
        const saved = await existing.json().catch(() => ({}))
        if (saved.model?.urn && saved.model.status === 'ready') {
          const model: CadModel = {
            urn: saved.model.urn,
            name: saved.model.name,
            status: 'ready',
            addedAt: Date.now(),
          }
          setModels((prev) => {
            const next = [model, ...prev.filter((m) => m.urn !== model.urn)]
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
            return next
          })
          setSelected(model.urn)
          toast('Opened the translated drawing', 'success')
          return
        }
        const file = await fetchVaultFile(docId)
        await uploadCadFile(file, docId)
      } catch (e: any) {
        toast(e?.message || 'Could not open that drawing in the CAD viewer', 'error', 8000)
      }
    })()
  }, [connected, toast])

  const removeModel = async (model: CadModel) => {
    const ok = await confirm({
      title: 'Remove this model?',
      message: `${model.name} will be taken out of your viewer list. To see it again you would have to upload and re-translate the file.`,
      confirmLabel: 'Remove',
      variant: 'danger',
    })
    if (!ok) return
    const urn = model.urn
    if (pollers.current[urn]) { clearInterval(pollers.current[urn]); delete pollers.current[urn] }
    const next = models.filter(m => m.urn !== urn)
    persist(next)
    if (selected === urn) setSelected(next[0]?.urn ?? null)
    toast(`${model.name} removed from your models`, 'info')
  }

  const selectedModel = models.find(m => m.urn === selected)

  // ── Connection check failed — do not pretend Autodesk is disconnected ──
  if (statusError) {
    return (
      <div className="page-m">
        <PageHeader />
        <ErrorState
          className="mt-6"
          title="Could not check your Autodesk connection"
          description="We cannot tell whether Autodesk is linked, so the viewer is on hold. Your models and connection are unaffected."
          error={statusError}
          onRetry={loadStatus}
        />
      </div>
    )
  }

  // ── Checking connection ──
  if (connected === null) {
    return (
      <div className="page-m">
        <PageHeader />
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 mt-6">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="w-full" style={{ minHeight: 540 }} />
        </div>
      </div>
    )
  }

  // ── Not connected gate ──
  if (connected === false) {
    return (
      <div className="page-m">
        <PageHeader />
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="card-m flex flex-col items-center justify-center text-center py-20 mt-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--amber)' }}>
            <span className="material-icons-outlined text-[28px]">architecture</span>
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>
            {configured ? 'Connect Autodesk to view CAD files' : 'Autodesk is not configured on this server'}
          </h3>
          <p className="text-sm mt-1 mb-5 max-w-md" style={{ color: 'var(--stone)' }}>
            {configured
              ? 'View DWG, RVT, IFC and Fusion 360 models in 5Bloc — powered by Autodesk Platform Services.'
              : 'Set AUTODESK_CLIENT_ID and AUTODESK_CLIENT_SECRET, then restart the app. Until then the CAD viewer cannot translate or display drawings.'}
          </p>
          {configured ? (
            <Link href="/integrations" className="btn-primary text-sm">Connect Autodesk</Link>
          ) : (
            <Link href="/integrations" className="btn-secondary text-sm">Open Integrations</Link>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page-m">
      <PageHeader />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 mt-6">
        {/* ── Sidebar — model list + upload ── */}
        <div className="space-y-4">
          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => fileInputRef.current?.click()}
            className="card-m p-6 text-center cursor-pointer transition-all"
            style={{
              boxShadow: dragOver
                ? '0 0 0 1.5px var(--amber)'
                : '0 1px 2px rgba(0,0,0,0.04), inset 0 0 0 1px var(--hairline)',
              background: dragOver ? 'rgba(245,166,35,0.06)' : 'var(--surface-elevated)',
            }}
          >
            <input ref={fileInputRef} type="file" hidden
              accept=".dwg,.rvt,.dwf,.dxf,.ifc,.nwd,.nwc,.3dm,.f3d,.step,.stp,.iges,.igs,.obj,.fbx,.glb,.gltf"
              onChange={e => handleFiles(e.target.files)} />
            {uploading ? (
              <>
                <div className="w-7 h-7 mx-auto rounded-full border-2 animate-spin mb-2"
                  style={{ borderColor: 'rgba(245,166,35,0.2)', borderTopColor: 'var(--amber)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--on-surface)' }}>Uploading…</p>
              </>
            ) : (
              <>
                <span className="material-icons-outlined text-[26px] mb-1" style={{ color: 'var(--amber)' }}>upload_file</span>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--on-surface)' }}>Upload CAD file</p>
                <p className="text-[10.5px] mt-1" style={{ color: 'var(--stone)' }}>DWG · RVT · IFC · DXF · F3D · STEP</p>
              </>
            )}
          </div>

          {/* Model list */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] px-1" style={{ color: 'var(--stone)' }}>
              Your Models
            </p>
            {models.length === 0 ? (
              <p className="text-xs px-1 py-3 leading-relaxed" style={{ color: 'var(--stone)' }}>
                No models yet. Drop a DWG, RVT or IFC above — Autodesk translates it once, then it opens instantly here.
              </p>
            ) : models.map(m => (
              <div key={m.urn}
                onClick={() => m.status === 'ready' && setSelected(m.urn)}
                className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: selected === m.urn ? 'rgba(245,166,35,0.10)' : 'var(--surface-elevated)',
                  boxShadow: selected === m.urn ? 'inset 0 0 0 1px rgba(245,166,35,0.25)' : 'inset 0 0 0 1px var(--hairline)',
                  cursor: m.status === 'ready' ? 'pointer' : 'default',
                }}
              >
                <span className="feed-m-icon"
                  style={{ color: m.status === 'ready' ? 'var(--amber)' : 'var(--stone)' }}>
                  <span className="material-icons-outlined">
                    {m.status === 'ready' ? 'view_in_ar' : m.status === 'failed' ? 'error_outline' : 'hourglass_top'}
                  </span>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--on-surface)' }}>{m.name}</p>
                  <p className="text-[10px]" style={{
                    color: m.status === 'failed' ? 'var(--error)' : m.status === 'ready' ? 'var(--success)' : 'var(--stone)',
                  }}>
                    {m.status === 'translating' ? 'Translating…' : m.status === 'ready' ? 'Ready' : 'Failed'}
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); void removeModel(m) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  style={{ color: 'var(--stone)' }}>
                  <span className="material-icons-outlined text-[15px]">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Viewer ── */}
        <div className="card-m overflow-hidden" style={{ minHeight: 540 }}>
          <AnimatePresence mode="wait">
            {selectedModel?.status === 'ready' ? (
              <motion.div key={selectedModel.urn} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                <AutodeskViewer urn={selectedModel.urn} className="h-full" />
              </motion.div>
            ) : selectedModel?.status === 'translating' ? (
              <div className="flex flex-col items-center justify-center h-full text-center" style={{ minHeight: 540 }}>
                <div className="w-9 h-9 rounded-full border-2 animate-spin mb-4"
                  style={{ borderColor: 'rgba(245,166,35,0.2)', borderTopColor: 'var(--amber)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>Preparing model…</p>
                <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--stone)' }}>
                  Autodesk is translating your file for the viewer. Large models can take a few minutes — you can keep working.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center" style={{ minHeight: 540 }}>
                <span className="material-icons-outlined text-[28px] mb-3" style={{ color: 'var(--stone)', opacity: 0.4 }}>view_in_ar</span>
                <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>No model selected</p>
                <p className="text-xs mt-1" style={{ color: 'var(--stone)' }}>Upload a CAD file to view it here</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function PageHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <p className="text-[12px] mb-1" style={{ color: 'var(--stone)' }}>Autodesk Platform Services</p>
      <h1 className="page-m-title">
        CAD Plan Viewer
      </h1>
      <p className="page-m-sub">
        View DWG, RVT &amp; Fusion 360 models in 2D and 3D — no AutoCAD install required.
      </p>
    </motion.div>
  )
}
