'use client'

import { useState } from 'react'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'

/* Dark palette matching the rest of the landing page */
const C = {
  base:    '#0b0c10',
  mid:     '#13151a',
  raised:  '#1a1d24',
  hover:   '#1f2330',
  border:  'rgba(255,255,255,0.07)',
  txt:     '#d8d3cc',
  txtDim:  '#6e6660',
  amber:   '#F5A623',
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <label
        className="font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color: C.txtDim }}
      >
        {label}
        {required && <span style={{ color: C.amber }}> *</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = `
  h-10 w-full rounded-lg px-3 py-2 text-sm outline-none transition-all
`
const inputStyle = {
  background: C.base,
  color: C.txt,
  boxShadow: `inset 0 0 0 1px ${C.border}`,
}
function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  ;(e.target as HTMLElement).style.boxShadow = `inset 0 0 0 1px rgba(245,166,35,0.5), 0 0 0 3px rgba(245,166,35,0.08)`
}
function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  ;(e.target as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${C.border}`
}

export function WaitlistForm({
  source = 'landing',
  compact = false,
}: {
  source?: string
  compact?: boolean
}) {
  const [email, setEmail] = useState('')
  const [name,  setName]  = useState('')
  const [role,  setRole]  = useState('architect')
  const [busy,  setBusy]  = useState(false)
  const [done,  setDone]  = useState(false)

  const roles = [
    { key: 'architect',  label: 'Architect' },
    { key: 'contractor', label: 'Contractor / Vendor' },
    { key: 'builder',    label: 'Builder / Developer' },
    { key: 'consultant', label: 'Consultant' },
    { key: 'client',     label: 'Client' },
    { key: 'other',      label: 'Something else' },
  ]

  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setError('')
    try {
      const supabase = createSupabaseClient()
      const { error: dbError } = await supabase.from('waitlist').insert({
        email: email.trim().toLowerCase(),
        name:  name.trim() || null,
        role,
      })
      if (dbError) {
        if (dbError.code === '23505') {
          // unique_violation — already on waitlist
          setDone(true)
        } else {
          setError('Something went wrong. Please try again.')
        }
      } else {
        setDone(true)
      }
    } catch (_) {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  /* ── Success state ── */
  if (done) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{ background: C.mid, boxShadow: `inset 0 0 0 1px ${C.border}` }}
      >
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] mb-4"
          style={{ background: 'rgba(46,204,138,0.12)', color: '#2ECC8A' }}
        >
          <Check className="h-3.5 w-3.5" /> You're in
        </div>
        <p className="text-base font-medium mb-2" style={{ color: C.txt }}>
          Thanks{name ? `, ${name.split(' ')[0]}` : ''}. We've registered{' '}
          <span className="font-mono" style={{ color: C.amber }}>{email}</span>{' '}
          for private beta onboarding.
        </p>
        <p className="text-sm" style={{ color: C.txtDim }}>
          Want to skip the queue?{' '}
          <a
            href="mailto:contact@5bloc.com"
            className="underline font-semibold transition-colors"
            style={{ color: C.txtDim }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = C.amber)}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.txtDim)}
          >
            contact@5bloc.com
          </a>
        </p>
      </div>
    )
  }

  /* ── Compact (inline / hero) variant ── */
  if (compact) {
    return (
      <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          placeholder="you@studio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls + ' flex-1'}
          style={inputStyle}
          onFocus={focusStyle}
          onBlur={blurStyle}
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-6 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: C.amber, color: '#0d0a00' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#ffb94a')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = C.amber)}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>Join waitlist <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </form>
    )
  }

  /* ── Full form ── */
  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-2xl p-6 sm:p-7"
      style={{
        background: C.mid,
        boxShadow: `inset 0 0 0 1px ${C.border}`,
        color: C.txt,
      }}
    >
      <Field label="Work email" required>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studio.com"
          className={inputCls}
          style={inputStyle}
          onFocus={focusStyle}
          onBlur={blurStyle}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aanya Mehta"
            className={inputCls}
            style={inputStyle}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </Field>
        <Field label="I'm a">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputCls}
            style={{ ...inputStyle, appearance: 'none' as const }}
            onFocus={focusStyle}
            onBlur={blurStyle}
          >
            {roles.map((r) => (
              <option key={r.key} value={r.key} style={{ background: C.mid, color: C.txt }}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex items-center justify-between gap-4 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 items-center gap-1.5 rounded-full px-7 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: C.amber, color: '#0d0a00' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#ffb94a')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = C.amber)}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>Get early access <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
        {error && (
          <p className="text-xs" style={{ color: '#ff6b6b' }}>{error}</p>
        )}
        {!error && (
          <p className="text-xs" style={{ color: C.txtDim }}>
            No spam · 10 practices per week
          </p>
        )}
      </div>
    </form>
  )
}
