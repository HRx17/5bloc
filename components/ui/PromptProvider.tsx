'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type PromptField = {
  name: string
  label: string
  type?: 'text' | 'number' | 'textarea'
  placeholder?: string
  defaultValue?: string
  required?: boolean
  /** Rejects the value and shows the returned message. */
  validate?: (value: string) => string | null
}

export type PromptOptions = {
  title: string
  message?: string
  fields: PromptField[]
  confirmLabel?: string
  cancelLabel?: string
}

type PromptResult = Record<string, string> | null
type PromptFn = (options: PromptOptions) => Promise<PromptResult>

const PromptContext = createContext<PromptFn>(async () => null)

/**
 * Collect one or more values in a styled dialog.
 *
 *   const prompt = usePrompt()
 *   const values = await prompt({ title: 'Add payout', fields: [{ name: 'name', label: 'Consultant' }] })
 *   if (!values) return
 *
 * Replaces `window.prompt`, which is unstyled, unlabelled and blocks the main thread.
 */
export function usePrompt(): PromptFn {
  return useContext(PromptContext)
}

export function PromptProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<PromptOptions | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const resolverRef = useRef<((value: PromptResult) => void) | null>(null)
  const firstFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  const settle = useCallback((result: PromptResult) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setOptions(null)
    setValues({})
    setErrors({})
  }, [])

  const prompt = useCallback<PromptFn>((next) => {
    resolverRef.current?.(null)
    setOptions(next)
    setValues(Object.fromEntries(next.fields.map((f) => [f.name, f.defaultValue ?? ''])))
    setErrors({})
    return new Promise<PromptResult>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  useEffect(() => {
    if (options) {
      const t = setTimeout(() => firstFieldRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [options])

  const submit = () => {
    if (!options) return
    const nextErrors: Record<string, string> = {}
    for (const field of options.fields) {
      const value = (values[field.name] ?? '').trim()
      if (field.required !== false && !value) {
        nextErrors[field.name] = `${field.label} is required.`
        continue
      }
      const custom = field.validate?.(value)
      if (custom) nextErrors[field.name] = custom
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    settle(Object.fromEntries(options.fields.map((f) => [f.name, (values[f.name] ?? '').trim()])))
  }

  return (
    <PromptContext.Provider value={prompt}>
      {children}
      <AnimatePresence>
        {options && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: 'var(--scrim)', backdropFilter: 'blur(4px)' }}
              onClick={() => settle(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[420px] rounded-2xl p-6"
              style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-4)' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="prompt-title"
            >
              <h2 id="prompt-title" className="text-[15px] font-semibold mb-2" style={{ color: 'var(--on-surface)' }}>
                {options.title}
              </h2>
              {options.message && (
                <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'var(--on-surface-variant)' }}>
                  {options.message}
                </p>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  submit()
                }}
                className="space-y-3"
              >
                {options.fields.map((field, index) => (
                  <div key={field.name}>
                    <label
                      htmlFor={`prompt-${field.name}`}
                      className="block text-[11px] font-semibold mb-1"
                      style={{ color: 'var(--stone)' }}
                    >
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        id={`prompt-${field.name}`}
                        ref={index === 0 ? (el) => { firstFieldRef.current = el } : undefined}
                        className="input-5bloc w-full min-h-[88px]"
                        placeholder={field.placeholder}
                        value={values[field.name] ?? ''}
                        aria-invalid={!!errors[field.name]}
                        onChange={(e) => {
                          setValues((p) => ({ ...p, [field.name]: e.target.value }))
                          setErrors((p) => ({ ...p, [field.name]: '' }))
                        }}
                      />
                    ) : (
                      <input
                        id={`prompt-${field.name}`}
                        ref={index === 0 ? (el) => { firstFieldRef.current = el } : undefined}
                        type={field.type === 'number' ? 'number' : 'text'}
                        inputMode={field.type === 'number' ? 'decimal' : undefined}
                        className="input-5bloc w-full"
                        placeholder={field.placeholder}
                        value={values[field.name] ?? ''}
                        aria-invalid={!!errors[field.name]}
                        onChange={(e) => {
                          setValues((p) => ({ ...p, [field.name]: e.target.value }))
                          setErrors((p) => ({ ...p, [field.name]: '' }))
                        }}
                      />
                    )}
                    {errors[field.name] && (
                      <p className="text-[11px] mt-1" role="alert" style={{ color: 'var(--error)' }}>
                        {errors[field.name]}
                      </p>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={() => settle(null)} className="btn-secondary btn-sm">
                    {options.cancelLabel ?? 'Cancel'}
                  </button>
                  <button type="submit" className="btn-primary btn-sm">
                    {options.confirmLabel ?? 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PromptContext.Provider>
  )
}
