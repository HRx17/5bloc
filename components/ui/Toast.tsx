'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const ICONS: Record<ToastType, string> = {
  success: 'check_circle',
  error:   'error',
  info:    'info',
  warning: 'warning',
}

const COLORS: Record<ToastType, { bg: string; color: string; border: string }> = {
  success: { bg: 'rgba(46,204,138,.10)',  color: 'var(--success)', border: 'rgba(46,204,138,.25)' },
  error:   { bg: 'rgba(255,138,128,.10)', color: 'var(--error)',   border: 'rgba(255,138,128,.25)' },
  info:    { bg: 'rgba(122,184,255,.10)', color: 'var(--blue)',    border: 'rgba(122,184,255,.25)' },
  warning: { bg: 'rgba(245,166,35,.10)',  color: 'var(--amber)',   border: 'rgba(245,166,35,.25)'  },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const c = COLORS[toast.type]

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), toast.duration ?? 3500)
    return () => clearTimeout(t)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 px-4 py-3 rounded-xl max-w-[340px] w-full shadow-xl cursor-pointer select-none"
      style={{
        background: 'var(--surface-container-high)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px ${c.border}`,
        backdropFilter: 'blur(20px)',
      }}
      onClick={() => onDismiss(toast.id)}
    >
      <span className="material-icons-outlined text-[18px] mt-0.5 shrink-0" style={{ color: c.color }}>
        {ICONS[toast.type]}
      </span>
      <p className="text-[13px] leading-snug font-medium flex-1" style={{ color: 'var(--on-surface)' }}>
        {toast.message}
      </p>
    </motion.div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev.slice(-4), { id, message, type, duration }])
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
