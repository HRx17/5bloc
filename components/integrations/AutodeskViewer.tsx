'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface ViewerProps {
  urn:       string   // base64 URN of the model derivative
  className?: string
}

declare global {
  interface Window {
    Autodesk?: any
  }
}

/**
 * Embeds the Autodesk Platform Services (Forge) Viewer for a given model URN.
 * The viewer SDK is loaded once from the Autodesk CDN.
 */
export function AutodeskViewer({ urn, className = '' }: ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef    = useRef<any>(null)
  const [status, setStatus]     = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!urn) return
    loadViewerSDK().then(() => initViewer()).catch(err => {
      setErrorMsg(String(err))
      setStatus('error')
    })
    return () => {
      if (viewerRef.current) {
        viewerRef.current.finish()
        viewerRef.current = null
      }
    }
  }, [urn])

  async function getToken() {
    const res = await fetch('/api/integrations/autodesk/viewer-token')
    if (!res.ok) throw new Error('Could not get viewer token')
    const { access_token } = await res.json()
    return access_token
  }

  async function initViewer() {
    if (!containerRef.current) return
    const AV = window.Autodesk?.Viewing
    if (!AV) throw new Error('Viewer SDK not loaded')

    const accessToken = await getToken()

    await new Promise<void>((resolve, reject) => {
      AV.Initializer({ accessToken, env: 'AutodeskProduction2', api: 'streamingV2' }, () => {
        resolve()
      })
      setTimeout(() => reject(new Error('Viewer init timeout')), 15000)
    })

    const viewer = new AV.GuiViewer3D(containerRef.current, {
      extensions: ['Autodesk.DocumentBrowser'],
    })

    const startCode = viewer.start()
    if (startCode > 0) throw new Error('Failed to start viewer')

    viewerRef.current = viewer

    AV.Document.load(
      `urn:${urn}`,
      (doc: any) => {
        const viewables = doc.getRoot().getDefaultGeometry()
        viewer.loadDocumentNode(doc, viewables)
        setStatus('ready')
      },
      (errorCode: number, errorMsg: string) => {
        setErrorMsg(`Failed to load model (${errorCode}): ${errorMsg}`)
        setStatus('error')
      }
    )
  }

  return (
    <div className={`relative flex flex-col ${className}`} style={{ minHeight: 400 }}>
      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl z-10"
          style={{ background: 'var(--surface-1)' }}>
          <div className="w-8 h-8 rounded-full border-2 border-amber-lt border-t-amber animate-spin mb-3"
            style={{ borderColor: 'rgba(245,166,35,0.2)', borderTopColor: 'var(--amber)' }} />
          <p className="text-xs" style={{ color: 'var(--stone)' }}>Loading model viewer…</p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl z-10 text-center p-6"
          style={{ background: 'var(--surface-1)' }}>
          <span className="material-icons-outlined text-[32px] mb-3" style={{ color: 'var(--error)' }}>error_outline</span>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>Could not load model</p>
          <p className="text-xs mb-4" style={{ color: 'var(--stone)' }}>{errorMsg || 'Connect Autodesk to view DWG/RVT files'}</p>
          <Link href="/integrations" className="btn-primary py-2 px-4 text-xs rounded-lg">Connect Autodesk</Link>
        </div>
      )}

      {/* Viewer container — Forge mounts into this div */}
      <div ref={containerRef} className="flex-1 rounded-2xl overflow-hidden" style={{ minHeight: 400 }} />
    </div>
  )
}

/** Load the Autodesk Viewer SDK from CDN once */
function loadViewerSDK(): Promise<void> {
  if (window.Autodesk?.Viewing) return Promise.resolve()

  return new Promise((resolve, reject) => {
    // CSS
    if (!document.getElementById('aps-viewer-css')) {
      const link   = document.createElement('link')
      link.id      = 'aps-viewer-css'
      link.rel     = 'stylesheet'
      link.href    = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css'
      document.head.appendChild(link)
    }
    // JS
    if (!document.getElementById('aps-viewer-js')) {
      const script = document.createElement('script')
      script.id    = 'aps-viewer-js'
      script.src   = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js'
      script.onload  = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Autodesk Viewer SDK'))
      document.head.appendChild(script)
    } else {
      const check = setInterval(() => {
        if (window.Autodesk?.Viewing) { clearInterval(check); resolve() }
      }, 200)
      setTimeout(() => { clearInterval(check); reject(new Error('SDK load timeout')) }, 20000)
    }
  })
}
