'use client'

import { useState } from 'react'
import { ArrowRight, Check, Loader2 } from 'lucide-react'

export function WaitlistForm({ source = 'landing', compact = false }: { source?: string; compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('architect')
  const [practice, setPractice] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const roles = [
    { key: 'architect', label: 'Architect' },
    { key: 'contractor', label: 'Contractor / Vendor' },
    { key: 'builder', label: 'Builder / Developer' },
    { key: 'consultant', label: 'Consultant' },
    { key: 'client', label: 'Client' },
    { key: 'other', label: 'Something else' },
  ]

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)

    // Simulate server call
    await new Promise((resolve) => setTimeout(resolve, 800))

    try {
      const submissions = JSON.parse(localStorage.getItem('5bloc_waitlist') || '[]')
      submissions.push({
        email: email.trim().toLowerCase(),
        name: name.trim() || null,
        role,
        practice: practice.trim() || null,
        city: city.trim() || null,
        notes: notes.trim() || null,
        source,
        timestamp: new Date().toISOString()
      })
      localStorage.setItem('5bloc_waitlist', JSON.stringify(submissions))
    } catch (err) {
      console.error('Local storage error:', err)
    }

    setBusy(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[rgba(26,23,20,0.1)] bg-white p-6 text-sm text-[#1a1714]">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(26,23,20,0.1)] bg-[#f5f2ee] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#F5A623]">
          <Check className="h-3.5 w-3.5" /> You're in
        </div>
        <p className="mt-4 text-base font-medium">
          Thanks{name ? `, ${name.split(' ')[0]}` : ''}. We've registered{' '}
          <span className="font-mono text-[#F5A623]">{email}</span> for private beta onboarding.
        </p>
        <p className="mt-2 text-[#6b5e50]">
          Want to skip the queue? Contact us at{' '}
          <a href="mailto:contact@5bloc.com" className="underline font-semibold hover:text-[#F5A623]">
            contact@5bloc.com
          </a>{' '}
          with details about your active project.
        </p>
      </div>
    )
  }

  if (compact) {
    return (
      <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          placeholder="you@studio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 flex-1 rounded-lg border border-[rgba(26,23,20,0.15)] bg-white px-4 py-2 text-sm text-[#1a1714] outline-none transition-shadow focus:ring-2 focus:ring-[#F5A623]"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-[#F5A623] px-6 text-sm font-semibold text-white transition-all hover:bg-[#ffb94a] active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Join waitlist <ArrowRight className="h-4 w-4" /></>)}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-[rgba(26,23,20,0.1)] bg-white p-6 text-[#1a1714] sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]">
            Work email <span className="text-[#F5A623]">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@studio.com"
            className="h-10 rounded-lg border border-[rgba(26,23,20,0.15)] bg-white px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[#F5A623]"
          />
        </div>
        <div className="grid gap-1.5">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]">
            Full name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aanya Mehta"
            className="h-10 rounded-lg border border-[rgba(26,23,20,0.15)] bg-white px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[#F5A623]"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]">
            I'm a
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-10 rounded-lg border border-[rgba(26,23,20,0.15)] bg-white px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[#F5A623]"
          >
            {roles.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]">
            Practice / company
          </label>
          <input
            value={practice}
            onChange={(e) => setPractice(e.target.value)}
            placeholder="Mehta + Rao Architects"
            className="h-10 rounded-lg border border-[rgba(26,23,20,0.15)] bg-white px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[#F5A623]"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]">
            City
          </label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Bengaluru"
            className="h-10 rounded-lg border border-[rgba(26,23,20,0.15)] bg-white px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[#F5A623]"
          />
        </div>
        <div className="grid gap-1.5">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b5e50]">
            First Use Case
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="RFI chaos on a project…"
            className="h-10 rounded-lg border border-[rgba(26,23,20,0.15)] bg-white px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[#F5A623]"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-[#F5A623] px-6 text-sm font-semibold text-white transition-all hover:bg-[#ffb94a] active:scale-[0.98] disabled:opacity-50 justify-self-start"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Request access <ArrowRight className="h-4 w-4" /></>)}
      </button>
      <p className="text-xs text-[#6b5e50]">
        No spam. We onboard 10 practices per week.
      </p>
    </form>
  )
}
