'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AutodeskViewer } from '@/components/integrations/AutodeskViewer'
import { fetchVaultFile, translateCadFile } from '@/lib/cad/client-upload'

type Props = {
  documentId: string
  projectId: string
  filename?: string | null
}

type Phase = 'checking' | 'unconfigured' | 'uploading' | 'translating' | 'ready' | 'error'

export function DocumentCadViewer({ documentId, projectId, filename }: Props) {
  const [phase, setPhase] = useState<Phase>('checking')
  const [urn, setUrn] = useState<string | null>(null)
  const [error, setError] = useState('')
  const started = useRef<string | null>(null)

  useEffect(() => {
    if (!documentId || started.current === documentId) return
    started.current = documentId
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | null = null

    const poll = (modelUrn: string) => {
      timer = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/integrations/autodesk/translate-status?urn=${encodeURIComponent(modelUrn)}`
          )
          const data = await res.json()
          if (cancelled) return
          if (data.status === 'success') {
            if (timer) clearInterval(timer)
            await fetch('/api/cad-models', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ document_id: documentId, status: 'ready', urn: modelUrn }),
            }).catch(() => {})
            setUrn(modelUrn)
            setPhase('ready')
          } else if (data.status === 'failed' || data.status === 'timeout') {
            if (timer) clearInterval(timer)
            setError('Autodesk could not translate this drawing')
            setPhase('error')
          }
        } catch {
          /* keep polling */
        }
      }, 5000)
    }

    ;(async () => {
      try {
        const statusRes = await fetch('/api/integrations/status')
        const status = await statusRes.json().catch(() => ({}))
        if (!status.providers?.autodesk?.configured) {
          if (!cancelled) setPhase('unconfigured')
          return
        }

        const existingRes = await fetch(
          `/api/cad-models?document_id=${encodeURIComponent(documentId)}`
        )
        const existing = await existingRes.json().catch(() => ({}))
        if (existing.model?.urn && existing.model.status === 'ready') {
          if (!cancelled) {
            setUrn(existing.model.urn)
            setPhase('ready')
          }
          return
        }
        if (existing.model?.urn && existing.model.status === 'translating') {
          if (!cancelled) {
            setUrn(existing.model.urn)
            setPhase('translating')
            poll(existing.model.urn)
          }
          return
        }

        if (!cancelled) setPhase('uploading')
        const file = await fetchVaultFile(documentId)
        const translated = await translateCadFile(file)
        await fetch('/api/cad-models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id: documentId,
            project_id: projectId,
            urn: translated.urn,
            name: translated.name || filename || file.name,
            status: 'translating',
          }),
        })
        if (cancelled) return
        setUrn(translated.urn)
        setPhase('translating')
        poll(translated.urn)
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Could not load this drawing')
          setPhase('error')
        }
      }
    })()

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [documentId, projectId, filename])

  return (
    <div className="w-full h-full flex flex-col bg-navy border rounded-md overflow-hidden min-h-[420px]">
      <div className="bg-navy-mid border-b px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-stone">
          <span className="font-semibold text-white">{filename || 'Drawing'}</span>
          {phase === 'ready'
            ? ' — live Autodesk model'
            : phase === 'translating'
              ? ' — translating for the viewer…'
              : phase === 'uploading'
                ? ' — sending to Autodesk…'
                : ''}
        </p>
        <div className="flex items-center gap-2">
          <a href={`/cad?doc=${documentId}`} className="btn-secondary py-1 px-3 text-[10px]">
            Open full CAD viewer
          </a>
        </div>
      </div>

      {phase === 'ready' && urn ? (
        <AutodeskViewer urn={urn} className="flex-1" />
      ) : phase === 'unconfigured' ? (
        <EmptyCad
          title="Autodesk is not configured"
          body="Set AUTODESK_CLIENT_ID and AUTODESK_CLIENT_SECRET, then restart the app. Until then the real DWG cannot be displayed."
        />
      ) : phase === 'error' ? (
        <EmptyCad title="Could not show this drawing" body={error} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(245,166,35,0.2)', borderTopColor: 'var(--amber)' }}
          />
          <p className="text-xs" style={{ color: 'var(--stone)' }}>
            {phase === 'translating'
              ? 'Autodesk is converting this file. Large DWGs can take a minute.'
              : phase === 'uploading'
                ? 'Uploading the stored drawing to Autodesk…'
                : 'Checking CAD viewer…'}
          </p>
        </div>
      )}
    </div>
  )
}

function EmptyCad({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
      <span className="material-icons-outlined text-[28px] text-amber">architecture</span>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-[11px] text-stone max-w-md leading-relaxed">{body}</p>
      <Link href="/integrations" className="btn-secondary py-1.5 px-3 text-[11px]">
        Open Integrations
      </Link>
    </div>
  )
}
