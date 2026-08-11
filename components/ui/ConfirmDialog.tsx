'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: 'var(--scrim)', backdropFilter: 'blur(4px)' }}
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[400px] rounded-2xl p-6"
            style={{
              background: 'var(--surface-container)',
              boxShadow: 'var(--shadow-4)',
            }}
            role="alertdialog"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
          >
            <h2 id="confirm-title" className="text-[15px] font-semibold mb-2" style={{ color: 'var(--on-surface)' }}>
              {title}
            </h2>
            <p id="confirm-message" className="text-[13px] leading-relaxed mb-6" style={{ color: 'var(--on-surface-variant)' }}>
              {message}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={onCancel} disabled={loading} className="btn-secondary btn-sm">
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={variant === 'danger' ? 'btn-ghost-error btn-sm' : 'btn-primary btn-sm'}
              >
                {loading ? 'Please wait…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
