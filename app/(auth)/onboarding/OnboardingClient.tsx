'use client'

import React, { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/brand/LogoMark'
import { ROLES, type RoleKey, isRoleKey } from '@/lib/rbac/roles'

const TRADES = ['Civil', 'RCC', 'MEP', 'HVAC', 'Electrical', 'Plumbing', 'Facade', 'Interior', 'Landscape']
const DISCIPLINES = ['structural', 'mep', 'electrical', 'plumbing', 'hvac', 'facade', 'interior']

export default function Onboarding() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite_token')
  const orgInviteToken = searchParams.get('org_invite')
  const roleParam = searchParams.get('role')

  const initialRole: RoleKey = isRoleKey(roleParam) ? roleParam : 'architect'
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<RoleKey>(initialRole)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    firm_name: '',
    company_name: '',
    city: '',
    state: '',
    firm_type: 'both',
    gst_number: '',
    bio: '',
    specializations: [] as string[],
    service_cities: '' as string,
    years_experience: '',
    team_size: '',
    discipline: 'structural',
  })

  const isInvitee = !!inviteToken || !!orgInviteToken || ROLES[role].invitedOnly
  const createsOrg = ROLES[role].createsOrg && !inviteToken && !orgInviteToken

  const steps = useMemo(() => {
    if (inviteToken || orgInviteToken) return 2
    if (role === 'architect' || role === 'contractor') return 3
    return 2
  }, [inviteToken, orgInviteToken, role])

  const toggleSpec = (spec: string) => {
    setForm((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec],
    }))
  }

  const canContinue = () => {
    if (step === 1) return !!form.full_name.trim()
    if (step === 2 && createsOrg) {
      return !!form.firm_name.trim() && !!form.city.trim()
    }
    if (step === 2 && role === 'contractor' && !inviteToken) {
      return !!form.company_name.trim() || !!form.firm_name.trim()
    }
    return true
  }

  const continueBlockedReason = () => {
    if (step === 1 && !form.full_name.trim()) return 'Enter your name to continue.'
    if (step === 2 && createsOrg && !form.firm_name.trim()) return 'Enter your firm name.'
    if (step === 2 && createsOrg && !form.city.trim()) return 'Enter your city — clients and marketplace listings use it.'
    if (step === 2 && role === 'contractor' && !inviteToken && !(form.company_name.trim() || form.firm_name.trim())) {
      return 'Enter your company name.'
    }
    return ''
  }

  const handleFinish = async () => {
    if (createsOrg && (!form.firm_name.trim() || !form.city.trim())) {
      setError('Firm name and city are required to create your workspace.')
      return
    }
    if (!form.full_name.trim()) {
      setError('Enter your name to continue.')
      return
    }
    setLoading(true)
    setError('')
    try {
      let finalRole = role
      let redirectOverride: string | null = null

      if (inviteToken) {
        const accept = await fetch('/api/invites/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: inviteToken,
            full_name: form.full_name,
          }),
        })
        const acceptData = await accept.json()
        if (!accept.ok) throw new Error(acceptData.error || 'Invite accept failed')
        if (isRoleKey(acceptData.role)) finalRole = acceptData.role
        redirectOverride = acceptData.redirect || null
      } else if (orgInviteToken) {
        const accept = await fetch('/api/org/invites/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: orgInviteToken,
            full_name: form.full_name,
          }),
        })
        const acceptData = await accept.json()
        if (!accept.ok) throw new Error(acceptData.error || 'Organisation invite accept failed')
        if (isRoleKey(acceptData.role)) finalRole = acceptData.role
        redirectOverride = acceptData.redirect || null
      }

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: finalRole,
          invite_flow: !!inviteToken || !!orgInviteToken,
          full_name: form.full_name,
          phone: form.phone,
          firm_name: form.firm_name,
          company_name: form.company_name || form.firm_name,
          city: form.city,
          state: form.state,
          firm_type: form.firm_type,
          gst_number: form.gst_number,
          bio: form.bio,
          specializations: form.specializations,
          service_cities: form.service_cities
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          years_experience: form.years_experience ? Number(form.years_experience) : null,
          team_size: form.team_size ? Number(form.team_size) : null,
          discipline: form.discipline,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Onboarding failed')

      if (finalRole === 'architect' && !inviteToken && !orgInviteToken) {
        localStorage.setItem(
          'onboarding_checklist_v1',
          JSON.stringify({ client: false, project: false, document: false, ai: false, invite: false })
        )
      }

      router.push(redirectOverride || data.redirect || ROLES[finalRole].homePath)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden font-body"
      style={{ background: 'var(--surface-canvas)', color: 'var(--on-surface)' }}
    >
      <div className="absolute inset-0 opacity-[0.12] pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#f5a623_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div
        className="w-full max-w-xl relative z-10"
        style={{
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-2)',
          borderRadius: 16,
        }}
      >
        <div className="px-8 pt-8 flex items-center justify-between">
          <Logo size={32} showTagline={false} />
          <div className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-stone">
            {Array.from({ length: steps }).map((_, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span>•</span>}
                <span className={step >= i + 1 ? 'font-bold' : ''} style={step >= i + 1 ? { color: 'var(--amber-text)' } : undefined}>
                  Step {i + 1}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="p-8 min-h-[380px] flex flex-col justify-between">
          {error && (
            <div className="mb-4 p-3 bg-error/10 text-error text-xs">{error}</div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={`${role}-${step}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-semibold">Welcome to 5Bloc</h1>
                  <p className="text-stone text-sm">Tell us who you are so we can set up the right workspace.</p>
                  <div>
                    <label className="label-sm text-stone">Full name</label>
                    <input
                      className="input-5bloc mt-1"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="label-sm text-stone">Phone</label>
                    <input
                      className="input-5bloc mt-1"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91…"
                    />
                  </div>
                  {!inviteToken && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {(['architect', 'contractor'] as RoleKey[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setRole(key)}
                          className="p-3 text-left rounded-xl text-[12px]"
                          style={{
                            background:
                              role === key ? 'rgba(245,166,35,0.12)' : 'var(--surface-container-high)',
                            color: role === key ? 'var(--amber-text)' : 'var(--stone)',
                            boxShadow:
                              role === key
                                ? 'inset 0 0 0 1px var(--amber)'
                                : 'inset 0 0 0 1px var(--hairline)',
                          }}
                        >
                          <div className="font-semibold">{ROLES[key].shortLabel}</div>
                          <div className="text-[10px] mt-1 opacity-80">{ROLES[key].tagline}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {isInvitee && (
                    <p className="text-[12px] text-stone">
                      Joining as <span className="text-amber">{ROLES[role].label}</span> via invite.
                    </p>
                  )}
                </div>
              )}

              {step === 2 && createsOrg && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-semibold">Your firm</h1>
                  <input
                    className="input-5bloc"
                    placeholder="Firm name *"
                    value={form.firm_name}
                    onChange={(e) => setForm({ ...form, firm_name: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="input-5bloc"
                      placeholder="City *"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                    <input
                      className="input-5bloc"
                      placeholder="State"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                  </div>
                  <select
                    className="input-5bloc"
                    value={form.firm_type}
                    onChange={(e) => setForm({ ...form, firm_type: e.target.value })}
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="both">Both</option>
                  </select>
                  <input
                    className="input-5bloc"
                    placeholder="GST number (optional)"
                    value={form.gst_number}
                    onChange={(e) => setForm({ ...form, gst_number: e.target.value })}
                  />
                </div>
              )}

              {step === 2 && role === 'contractor' && !inviteToken && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-semibold">Contractor / vendor profile</h1>
                  <input
                    className="input-5bloc"
                    placeholder="Company name *"
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  />
                  <textarea
                    className="input-5bloc min-h-[80px]"
                    placeholder="Short bio"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  />
                  <div>
                    <p className="label-sm text-stone mb-2">Specializations</p>
                    <div className="flex flex-wrap gap-2">
                      {TRADES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleSpec(t)}
                          className="chip text-[11px]"
                          style={{
                            background: form.specializations.includes(t)
                              ? 'rgba(245,166,35,0.18)'
                              : 'var(--surface-container-high)',
                            color: form.specializations.includes(t)
                              ? 'var(--amber-text)'
                              : 'var(--stone)',
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
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
                </div>
              )}

              {step === 2 && (role === 'builder' || role === 'consultant' || role === 'client' || inviteToken) && !createsOrg && role !== 'contractor' && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-semibold">Almost ready</h1>
                  <p className="text-stone text-sm">
                    You&apos;ll land in the projects you&apos;ve been invited to. No firm setup needed.
                  </p>
                  {role === 'consultant' && (
                    <div>
                      <label className="label-sm text-stone">Discipline</label>
                      <select
                        className="input-5bloc mt-1"
                        value={form.discipline}
                        onChange={(e) => setForm({ ...form, discipline: e.target.value })}
                      >
                        {DISCIPLINES.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 text-center py-6">
                  <span className="material-icons-outlined text-amber text-[48px]">check_circle</span>
                  <h1 className="text-2xl font-semibold">
                    You&apos;re set up as {ROLES[role].shortLabel}
                  </h1>
                  <p className="text-stone text-sm">{ROLES[role].tagline}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <button
              type="button"
              className="btn-secondary"
              disabled={step === 1 || loading}
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </button>
            {step < steps ? (
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const reason = continueBlockedReason()
                    if (reason) {
                      setError(reason)
                      return
                    }
                    setError('')
                    setStep((s) => s + 1)
                  }}
                  disabled={!canContinue()}
                >
                  Continue
                </button>
                {!canContinue() && (
                  <p className="text-[11px]" style={{ color: 'var(--stone)' }}>
                    {continueBlockedReason()}
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={handleFinish}
                disabled={loading || (createsOrg && (!form.firm_name.trim() || !form.city.trim()))}
              >
                {loading ? 'Setting up…' : 'Enter workspace'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
