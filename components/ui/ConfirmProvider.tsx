'use client'

import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

export type ConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn>(async () => true)

/**
 * Ask for confirmation from anywhere without wiring dialog state into the page.
 *
 *   const confirm = useConfirm()
 *   if (!(await confirm({ title: 'Delete file', message: 'This cannot be undone.', variant: 'danger' }))) return
 *
 * Replaces `window.confirm`, which is unstyled and blocks the main thread.
 */
export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext)
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value)
    resolverRef.current = null
    setOptions(null)
  }, [])

  const confirm = useCallback<ConfirmFn>((next) => {
    // A second request supersedes the first; the caller waiting on it gets a decline.
    resolverRef.current?.(false)
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={!!options}
        title={options?.title ?? ''}
        message={options?.message ?? ''}
        confirmLabel={options?.confirmLabel}
        cancelLabel={options?.cancelLabel}
        variant={options?.variant}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </ConfirmContext.Provider>
  )
}
