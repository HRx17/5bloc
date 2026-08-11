'use client'

import { useState } from 'react'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'

const DARK = {
  base: '#0b0c10',
  mid: '#13151a',
  border: 'rgba(255,255,255,0.07)',
  txt: '#d8d3cc',
  txtDim: '#6e6660',
  accent: '#F5A623',
  accentHover: '#ffb94a',
  btnText: '#0d0a00',
  focusRing: 'rgba(245,166,35,0.5)',
  focusGlow: 'rgba(245,166,35,0.08)',
}

const APPLE = {
  base: '#ffffff',
  mid: '#f5f5f7',
  border: 'rgba(0,0,0,0.12)',
  txt: '#1d1d1f',
  txtDim: '#86868b',
  accent: '#f5a623',
  accentHover: '#ffb94a',
  btnText: '#0C1220',
  focusRing: 'rgba(245,166,35,0.55)',
  focusGlow: 'rgba(245,166,35,0.14)',
}

type Palette = typeof DARK

function Field({
  label,
  required,
  palette,
  children,
}: {
  label: string
  required?: boolean
  palette: Palette
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <label
        className="text-[12px] font-medium"
        style={{ color: palette.txtDim }}
      >
        {label}
        {required && <span style={{ color: palette.accent }}> *</span>}
      </label>
      {children}
    </div>
  )
}

export function WaitlistForm({
  source = 'landing',
  compact = false,
  theme = 'dark',
}: {
  source?: string
  compact?: boolean
  theme?: 'dark' | 'apple'
}) {
  const P = theme === 'apple' ? APPLE : DARK
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('architect')
  const [firm, setFirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const roles = [
    { key: 'architect', label: 'Architect' },
    { key: 'contractor', label: 'Contractor / Vendor' },
    { key: 'builder', label: 'Builder / Developer' },
    { key: 'consultant', label: 'Consultant' },
    { key: 'client', label: 'Client' },
    { key: 'other', label: 'Something else' },
  ]

  const inputCls = 'h-11 w-full rounded-xl px-3.5 py-2 text-[15px] outline-none transition-all'
  const inputStyle = {
    background: P.base,
    color: P.txt,
    boxShadow: `inset 0 0 0 1px ${P.border}`,
  }

  function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    ;(e.target as HTMLElement).style.boxShadow =
      `inset 0 0 0 1px ${P.focusRing}, 0 0 0 3px ${P.focusGlow}`
  }

  function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    ;(e.target as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${P.border}`
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setError('')
    try {
      const supabase = createSupabaseClient()
      const { error: dbError } = await supabase.from('waitlist').insert({
        email: email.trim().toLowerCase(),
        name: name.trim() || null,
        role,
        firm: firm.trim() || null,
      })
      if (dbError) {
        if (dbError.code === '23505') {
          setDone(true)
        } else {
          setError('Something went wrong. Please try again.')
        }
      } else {
        setDone(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div
        className="rounded-2xl p-6 sm:p-7"
        style={{ background: P.mid, boxShadow: `inset 0 0 0 1px ${P.border}` }}
      >
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium mb-4"
          style={{ background: 'rgba(46,204,138,0.12)', color: '#2ECC8A' }}
        >
          <Check className="h-3.5 w-3.5" /> You&apos;re in
        </div>
        <p className="text-[17px] font-medium mb-2" style={{ color: P.txt }}>
          Thanks{name ? `, ${name.split(' ')[0]}` : ''}. We&apos;ve registered{' '}
          <span style={{ color: P.accent }}>{email}</span> for private beta onboarding.
        </p>
        <p className="text-[14px]" style={{ color: P.txtDim }}>
          Questions?{' '}
          <a href="mailto:contact@5bloc.com" className="underline" style={{ color: P.accent }}>
            contact@5bloc.com
          </a>
        </p>
      </div>
    )
  }

  if (compact) {
    return (
      <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row mx-auto">
        <input
          type="email"
          required
          placeholder="you@studio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputCls} flex-1`}
          style={inputStyle}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-6 text-[15px] font-normal transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: P.accent, color: P.btnText }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = P.accentHover)}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = P.accent)}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Join waitlist <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-2xl p-6 sm:p-7"
      style={{
        background: P.mid,
        boxShadow: `inset 0 0 0 1px ${P.border}`,
        color: P.txt,
      }}
    >
      <Field label="Work email" required palette={P}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studio.com"
          className={inputCls}
          style={inputStyle}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" palette={P}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aanya Mehta"
            className={inputCls}
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </Field>
        <Field label="I'm a" palette={P}>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputCls}
            style={{ ...inputStyle, appearance: 'none' as const }}
            onFocus={onFocus}
            onBlur={onBlur}
          >
            {roles.map((r) => (
              <option key={r.key} value={r.key} style={{ background: P.base, color: P.txt }}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Firm / organisation" palette={P}>
        <input
          value={firm}
          onChange={(e) => setFirm(e.target.value)}
          placeholder="Mehta + Rao Architects"
          className={inputCls}
          style={inputStyle}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </Field>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 items-center gap-1.5 rounded-full px-7 text-[15px] font-normal transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: P.accent, color: P.btnText }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = P.accentHover)}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = P.accent)}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Get early access <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        {error ? (
          <p className="text-[13px]" style={{ color: '#ff6b6b' }}>
            {error}
          </p>
        ) : null}
      </div>
      <p className="text-[11px]" style={{ color: theme === 'apple' ? '#8C8680' : P.txtDim }}>
        No spam · Unsubscribe anytime · 10 practices onboarded per week
      </p>
    </form>
  )
}
