'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'
import { AutodeskViewer } from '@/components/integrations/AutodeskViewer'

interface CadModel {
  urn:    string
  name:   string
  status: 'translating' | 'ready' | 'failed'
  addedAt: number
}

const STORAGE_KEY = '5bloc_cad_models'

export default function CadViewerPage() {
  const { toast } = useToast()
  const [connected, setConnected]   = useState<boolean | null>(null)
  const [models, setModels]         = useState<CadModel[]>([])
  const [selected, setSelected]     = useState<string | null>(null)
  const [uploading, setUploading]   = useState(false)
  const [dragOver, setDragOver]     = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollers = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  // Load connection status + saved models
  useEffect(() => {
    fetch('/api/integrations/status')
      .then(r => r.json())
      .then(({ connected }) => setConnected((connected ?? []).includes('autodesk')))
      .catch(() => setConnected(false))

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

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return
    const file = files[0]
    setUploading(true)
    try {
      // Step 1 — get a pre-signed S3 URL from Autodesk (tiny request, no file data)
      const prep = await fetch('/api/integrations/autodesk/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name }),
      })
      const prepData = await prep.json()
      if (!prep.ok) throw new Error(prepData.error ?? 'Failed to prepare upload')

      // Step 2 — PUT file directly to the Autodesk/AWS signed URL (bypasses Vercel)
      const s3 = await fetch(prepData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: file,
      })
      if (!s3.ok) throw new Error(`Upload to Autodesk failed (${s3.status})`)

      // Step 3 — notify our API to finalise & kick off translation
      const done = await fetch('/api/integrations/autodesk/complete-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadKey: prepData.uploadKey,
          objectKey: prepData.objectKey,
          bucketKey: prepData.bucketKey,
          fileName:  file.name,
        }),
      })
      const doneData = await done.json()
      if (!done.ok) throw new Error(doneData.error ?? 'Failed to complete upload')

      const model: CadModel = { urn: doneData.urn, name: doneData.name, status: 'translating', addedAt: Date.now() }
      persist([model, ...models])
      setSelected(doneData.urn)
      startPolling(doneData.urn)
      toast('Uploaded — translating model for the viewer…', 'info', 6000)
    } catch (e: any) {
      toast(e.message ?? 'Upload failed', 'error', 8000)
    } finally {
      setUploading(false)
    }
  }

  const removeModel = (urn: string) => {
    if (pollers.current[urn]) { clearInterval(pollers.current[urn]); delete pollers.current[urn] }
    const next = models.filter(m => m.urn !== urn)
    persist(next)
    if (selected === urn) setSelected(next[0]?.urn ?? null)
  }

  const selectedModel = models.find(m => m.urn === selected)

  // ── Not connected gate ──
  if (connected === false) {
    return (
      <div className="p-5 lg:p-7 max-w-[1240px] mx-auto">
        <PageHeader />
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="app-card flex flex-col items-center justify-center text-center py-20 mt-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--amber)' }}>
            <span className="material-icons-outlined text-[28px]">architecture</span>
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Connect Autodesk to view CAD files</h3>
          <p className="text-sm mt-1 mb-5 max-w-md" style={{ color: 'var(--stone)' }}>
            View DWG, RVT, IFC and Fusion 360 models directly in 5BLOC with full 2D/3D navigation, powered by Autodesk Platform Services.
          </p>
          <Link href="/integrations" className="btn-primary text-sm">Connect Autodesk</Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-5 lg:p-7 max-w-[1240px] mx-auto">
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
            className="rounded-2xl p-6 text-center cursor-pointer transition-all"
            style={{
              border: `1.5px dashed ${dragOver ? 'var(--amber)' : 'rgba(159,142,122,0.25)'}`,
              background: dragOver ? 'rgba(245,166,35,0.06)' : 'var(--surface-container)',
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
              <p className="text-xs px-1 py-3" style={{ color: 'var(--stone)' }}>No models yet. Upload one to begin.</p>
            ) : models.map(m => (
              <div key={m.urn}
                onClick={() => m.status === 'ready' && setSelected(m.urn)}
                className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: selected === m.urn ? 'rgba(245,166,35,0.10)' : 'var(--surface-container)',
                  boxShadow: selected === m.urn ? 'inset 0 0 0 1px rgba(245,166,35,0.25)' : 'none',
                  cursor: m.status === 'ready' ? 'pointer' : 'default',
                }}
              >
                <span className="material-icons-outlined text-[18px] shrink-0"
                  style={{ color: m.status === 'ready' ? 'var(--amber)' : 'var(--stone)' }}>
                  {m.status === 'ready' ? 'view_in_ar' : m.status === 'failed' ? 'error_outline' : 'hourglass_top'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--on-surface)' }}>{m.name}</p>
                  <p className="text-[10px]" style={{
                    color: m.status === 'failed' ? 'var(--error)' : m.status === 'ready' ? 'var(--success)' : 'var(--stone)',
                  }}>
                    {m.status === 'translating' ? 'Translating…' : m.status === 'ready' ? 'Ready' : 'Failed'}
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeModel(m.urn) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  style={{ color: 'var(--stone)' }}>
                  <span className="material-icons-outlined text-[15px]">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Viewer ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-container)', minHeight: 540 }}>
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
                <span className="material-icons-outlined text-[40px] mb-3" style={{ color: 'var(--stone)', opacity: 0.4 }}>view_in_ar</span>
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
      <h1 className="font-display font-bold text-[28px] lg:text-[34px] leading-tight" style={{ color: 'var(--on-surface)' }}>
        CAD Plan Viewer
      </h1>
      <p className="text-[13px] mt-1" style={{ color: 'var(--on-surface-variant)' }}>
        View DWG, RVT &amp; Fusion 360 models in 2D and 3D — no AutoCAD install required.
      </p>
    </motion.div>
  )
}
