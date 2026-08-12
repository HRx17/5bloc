'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { startRazorpayCheckout } from '@/lib/payments/checkout'
import { useToast } from '@/components/ui/Toast'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

const TRADES = ['Civil', 'RCC', 'MEP', 'HVAC', 'Electrical', 'Plumbing', 'Facade', 'Interior']

export default function ContractorProfilePage() {
  const { toast } = useToast()
  const [form, setForm] = useState({
    company_name: '',
    bio: '',
    specializations: [] as string[],
    service_cities: '',
    gst_number: '',
    years_experience: '',
    team_size: '',
    verified: false,
    badge_active: false,
    rating: 0,
  })
  const [saving, setSaving] = useState(false)
  const [badgeLoading, setBadgeLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [meRes, listRes] = await Promise.all([fetch('/api/me'), fetch('/api/contractors?mine=1')])
      if (!meRes.ok || !listRes.ok) throw new Error('Could not load your vendor profile')
      const me = await meRes.json()
      const d = await listRes.json()
      const myId = me.profile?.id
      const list = d.contractors || []
      const mine =
        list.find((c: any) => c.user_id === myId) ||
        (me.profile?.role === 'contractor' ? list[0] : null)
      if (mine) {
        setForm({
          company_name: mine.company_name || '',
          bio: mine.bio || '',
          specializations: mine.specializations || [],
          service_cities: (mine.service_cities || []).join(', '),
          gst_number: mine.gst_number || '',
          years_experience: String(mine.years_experience || ''),
          team_size: String(mine.team_size || ''),
          verified: !!mine.verified,
          badge_active: !!mine.badge_active,
          rating: mine.rating || 0,
        })
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggle = (spec: string) => {
    setForm((p) => ({
      ...p,
      specializations: p.specializations.includes(spec)
        ? p.specializations.filter((s) => s !== spec)
        : [...p.specializations, spec],
    }))
  }

  const save = async () => {
    if (!form.company_name.trim()) {
      toast('Add your company name before saving', 'warning')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/contractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: form.company_name,
          bio: form.bio,
          specializations: form.specializations,
          service_cities: form.service_cities.split(',').map((s) => s.trim()).filter(Boolean),
          gst_number: form.gst_number,
          years_experience: form.years_experience ? Number(form.years_experience) : null,
          team_size: form.team_size ? Number(form.team_size) : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast(data.error || 'Could not save your profile. Try again.', 'error')
        return
      }
      toast('Vendor profile saved — architects can find you with these details', 'success')
    } catch (err: any) {
      toast(err?.message || 'Could not reach the server. Try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-[32px]">Vendor profile</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
          This is how architects find you in the marketplace.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 p-5 rounded-2xl" style={{ background: 'var(--surface-container)' }}>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load your vendor profile"
          description="Your saved details are intact. Retry before editing, so you do not overwrite them with a blank form."
          error={error}
          onRetry={load}
        />
      ) : (
        <>
          {(form.verified || form.badge_active) && (
            <div className="flex gap-2">
              {form.verified && (
                <span className="chip" style={{ color: 'var(--success)', background: 'rgba(46,204,138,0.12)' }}>
                  Verified
                </span>
              )}
              {form.badge_active && (
                <span className="chip" style={{ color: 'var(--amber)', background: 'rgba(245,166,35,0.12)' }}>
                  ₹999 badge active
                </span>
              )}
              <span className="chip" style={{ color: 'var(--stone)' }}>
                Rating {form.rating || '—'}
              </span>
            </div>
          )}

          <div className="space-y-3 p-5 rounded-2xl" style={{ background: 'var(--surface-container)' }}>
            <input
              className="input-5bloc"
              placeholder="Company name"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            />
            <textarea
              className="input-5bloc min-h-[100px]"
              placeholder="Bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
            <div className="flex flex-wrap gap-2">
              {TRADES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggle(t)}
                  className="chip"
                  style={{
                    color: form.specializations.includes(t) ? 'var(--amber)' : 'var(--stone)',
                    background: form.specializations.includes(t)
                      ? 'rgba(245,166,35,0.12)'
                      : 'rgba(159,142,122,0.1)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              className="input-5bloc"
              placeholder="Service cities (comma separated)"
              value={form.service_cities}
              onChange={(e) => setForm({ ...form, service_cities: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className="input-5bloc"
                placeholder="Years experience"
                value={form.years_experience}
                onChange={(e) => setForm({ ...form, years_experience: e.target.value })}
              />
              <input
                className="input-5bloc"
                placeholder="Team size"
                value={form.team_size}
                onChange={(e) => setForm({ ...form, team_size: e.target.value })}
              />
            </div>
            <input
              className="input-5bloc"
              placeholder="GST number"
              value={form.gst_number}
              onChange={(e) => setForm({ ...form, gst_number: e.target.value })}
            />
            <div className="flex justify-between items-center pt-2">
              <button
                className="btn-secondary text-[12px]"
                type="button"
                disabled={badgeLoading}
                onClick={async () => {
                  setBadgeLoading(true)
                  try {
                    const result = await startRazorpayCheckout({
                      plan: 'badge',
                      redirect: '/contractor/profile?subscribed=true',
                    })
                    if (result.message) toast(result.message, result.ok ? 'success' : 'info')
                  } finally {
                    setBadgeLoading(false)
                  }
                }}
              >
                {badgeLoading ? 'Opening checkout…' : 'Get verified badge (₹999/mo)'}
              </button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
