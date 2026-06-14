'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SaveBarProps {
  visible: boolean
  message?: string
  saving?: boolean
  onSave: () => void
  onDiscard: () => void
}

/** Sticky bottom bar when form has unsaved changes */
export function SaveBar({
  visible,
  message = 'You have unsaved changes',
  saving = false,
  onSave,
  onDiscard,
}: SaveBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3 rounded-2xl"
          style={{
            background: 'var(--surface-elevated)',
            boxShadow: 'var(--shadow-3), inset 0 0 0 1px var(--hairline-strong)',
          }}
        >
          <span className="material-icons-outlined text-[18px]" style={{ color: 'var(--amber)' }}>
            edit_note
          </span>
          <span className="text-[13px] font-medium" style={{ color: 'var(--on-surface)' }}>
            {message}
          </span>
          <div className="flex items-center gap-2 ml-2">
            <button type="button" onClick={onDiscard} disabled={saving} className="btn-secondary btn-sm">
              Discard
            </button>
            <button type="button" onClick={onSave} disabled={saving} className="btn-primary btn-sm">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
