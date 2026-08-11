'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type PickedDriveItem = {
  id: string
  name: string
  mimeType: string
}

type PickerConfig = {
  accessToken: string
  appId: string
  apiKey?: string | null
}

declare global {
  interface Window {
    gapi?: {
      load: (name: string, callback: () => void) => void
    }
    google?: {
      picker: {
        Action: { PICKED: string; CANCEL: string }
        Feature: { MULTISELECT_ENABLED: string }
        ViewId: { DOCS: string; FOLDERS: string }
        DocsView: new (viewId?: string) => {
          setIncludeFolders: (v: boolean) => unknown
          setSelectFolderEnabled: (v: boolean) => unknown
        }
        PickerBuilder: new () => {
          addView: (view: unknown) => unknown
          setOAuthToken: (token: string) => unknown
          setDeveloperKey: (key: string) => unknown
          setAppId: (id: string) => unknown
          enableFeature: (feature: string) => unknown
          setCallback: (cb: (data: PickerResponse) => void) => unknown
          build: () => { setVisible: (v: boolean) => void }
        }
      }
    }
  }
}

type PickerResponse = {
  action: string
  docs?: { id: string; name: string; mimeType: string }[]
}

let pickerScriptPromise: Promise<void> | null = null

function loadPickerScript(): Promise<void> {
  if (pickerScriptPromise) return pickerScriptPromise

  pickerScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.picker) {
      resolve()
      return
    }

    const existing = document.querySelector('script[data-google-picker]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Picker script failed')))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.async = true
    script.defer = true
    script.dataset.googlePicker = 'true'
    script.onload = () => {
      window.gapi?.load('picker', () => resolve())
    }
    script.onerror = () => reject(new Error('Failed to load Google API script'))
    document.body.appendChild(script)
  })

  return pickerScriptPromise
}

export function useGooglePicker(
  onPicked: (items: PickedDriveItem[]) => void | Promise<void>,
  options?: { foldersOnly?: boolean }
) {
  const foldersOnly = options?.foldersOnly ?? false
  const [opening, setOpening] = useState(false)
  const [ready, setReady] = useState(false)
  const onPickedRef = useRef(onPicked)
  onPickedRef.current = onPicked

  useEffect(() => {
    loadPickerScript()
      .then(() => setReady(true))
      .catch(() => setReady(false))
  }, [])

  const openPicker = useCallback(async () => {
    setOpening(true)
    try {
      await loadPickerScript()

      const res = await fetch('/api/integrations/google/token')
      const data = await res.json() as PickerConfig & { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Could not load Google token')

      if (!window.google?.picker) throw new Error('Google Picker unavailable')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = window.google.picker as any

      const foldersView = new p.DocsView(p.ViewId.FOLDERS)
      foldersView.setSelectFolderEnabled(true)

      let builder = new p.PickerBuilder()
        .setOAuthToken(data.accessToken)
        .setAppId(data.appId)
        .enableFeature(p.Feature.MULTISELECT_ENABLED)

      if (foldersOnly) {
        builder = builder.addView(foldersView)
      } else {
        const docsView = new p.DocsView(p.ViewId.DOCS)
        docsView.setIncludeFolders(true)
        docsView.setSelectFolderEnabled(true)
        builder = builder.addView(docsView).addView(foldersView)
      }

      builder = builder
        .setCallback(async (response: PickerResponse) => {
          if (response.action !== p.Action.PICKED || !response.docs?.length) return
          await onPickedRef.current(
            response.docs.map((d) => ({ id: d.id, name: d.name, mimeType: d.mimeType }))
          )
        })

      if (data.apiKey) builder = builder.setDeveloperKey(data.apiKey)

      builder.build().setVisible(true)
    } finally {
      setOpening(false)
    }
  }, [foldersOnly])

  return { openPicker, opening, ready }
}
