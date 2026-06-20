'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/brand/LogoMark'
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen'
import { createSupabaseClient } from '@/lib/supabase/client'
import { getRoleConfig, USER_ROLES, type UserRole } from '@/lib/roles'

type Step = 1 | 2 | 3

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [role, setRole] = useState<UserRole>('architect')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [inviteOrgName, setInviteOrgName] = useState('')
  const [successKind, setSuccessKind] = useState<'default' | 'join_request' | 'invited' | null>(null)
  const [successOrgName, setSuccessOrgName] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orgName: '',
    city: '',
    state: '',
    gstNumber: '',
  })

  const roleConfig = getRoleConfig(role)

  useEffect(() => {
    async function init() {
      try {
        const supabase = createSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.replace('/login')
          return
        }

        const saved = localStorage.getItem('5bloc_signup_role') as UserRole | null
        if (saved && USER_ROLES.some((r) => r.id === saved)) setRole(saved)

        const storedInvite = localStorage.getItem('5bloc_invite_token') ?? ''
        if (storedInvite) {
          setInviteToken(storedInvite)
          try {
            const invRes = await fetch(`/api/org/invites/lookup?token=${encodeURIComponent(storedInvite)}`)
            const invJson = await invRes.json()
            if (invRes.ok) {
              setInviteOrgName(invJson.orgName ?? '')
              if (invJson.userRole && USER_ROLES.some((r) => r.id === invJson.userRole)) {
                setRole(invJson.userRole as UserRole)
              }
              setFormData((prev) => ({
                ...prev,
                orgName: invJson.orgName ?? prev.orgName,
                email: invJson.email ?? prev.email,
              }))
            }
          } catch { /* ignore */ }
        }

        const res = await fetch('/api/profile/me')
        if (res.ok) {
          const data = await res.json()
          if (data.user?.onboarding_complete) {
            router.replace('/dashboard')
            return
          }
          const r = (data.user?.role ?? saved ?? 'architect') as UserRole
          setRole(r)
          setFormData((prev) => ({
            ...prev,
            name: data.user?.full_name ?? user.user_metadata?.full_name ?? prev.name,
            email: data.user?.email ?? user.email ?? prev.email,
            orgName: data.organisation?.name ?? prev.orgName,
            city: data.metadata?.city ?? prev.city,
            state: data.metadata?.state ?? prev.state,
            gstNumber: data.metadata?.gst_number ?? prev.gstNumber,
          }))
          if (data.user?.onboarding_complete === false && data.user?.full_name) {
            setStep(2)
          }
        } else {
          setFormData((prev) => ({
            ...prev,
            name: user.user_metadata?.full_name ?? prev.name,
            email: user.email ?? prev.email,
          }))
        }
      } catch {
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFinish = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          full_name: formData.name,
          org_name: formData.orgName,
          city: formData.city,
          state: formData.state,
          gst_number: formData.gstNumber || undefined,
          invite_token: inviteToken || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? 'Setup failed')
      }

      localStorage.removeItem('5bloc_signup_role')
      localStorage.removeItem('5bloc_demo_role')
      localStorage.removeItem('5bloc_invite_token')
      localStorage.setItem('onboarding_checklist_v1', JSON.stringify({
        client: false, project: false, document: false, ai: false, invite: false,
      }))

      if (data.joinRequestPending) {
        setSuccessKind('join_request')
        setSuccessOrgName(data.orgName ?? formData.orgName)
        return
      }
      if (data.joinedOrg) {
        setSuccessKind('invited')
        setSuccessOrgName(data.orgName ?? inviteOrgName)
        setTimeout(() => { router.push('/dashboard'); router.refresh() }, 1800)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <AuthLoadingScreen message="Preparing your workspace…" submessage="One moment" />
  }

  if (successKind === 'join_request') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10 font-body" style={{ background: 'var(--surface-canvas)' }}>
        <div className="w-full max-w-lg rounded-2xl p-8 text-center" style={{ background: 'var(--surface-container)', boxShadow: 'inset 0 0 0 1px var(--hairline), var(--shadow-3)' }}>
          <span className="material-icons-outlined text-[40px] mb-3" style={{ color: 'var(--amber)' }}>hourglass_top</span>
          <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--on-surface)' }}>Request sent to join {successOrgName}</h1>
          <p className="text-[13px] mb-6" style={{ color: 'var(--stone)' }}>
            The firm admin will review your request. You&apos;ll get access once approved.
          </p>
          <button type="button" onClick={() => router.push('/dashboard')} className="btn-primary">Go to dashboard</button>
        </div>
      </div>
    )
  }

  if (successKind === 'invited') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10 font-body" style={{ background: 'var(--surface-canvas)' }}>
        <div className="w-full max-w-lg rounded-2xl p-8 text-center" style={{ background: 'var(--surface-container)', boxShadow: 'inset 0 0 0 1px var(--hairline), var(--shadow-3)' }}>
          <span className="material-icons-outlined text-[40px] mb-3" style={{ color: 'var(--success)' }}>check_circle</span>
          <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--on-surface)' }}>Welcome to {successOrgName}</h1>
          <p className="text-[13px]" style={{ color: 'var(--stone)' }}>Opening your workspace…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 font-body" style={{ background: 'var(--surface-canvas)' }}>
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface-container)', boxShadow: 'inset 0 0 0 1px var(--hairline), var(--shadow-3)' }}
      >
        <div className="px-7 pt-7 flex items-center justify-between">
          <Logo size={28} showTagline={false} color="var(--on-surface)" />
          <span className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--stone)' }}>
            STEP {step}/3
          </span>
        </div>

        <div className="px-7 pt-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full transition-colors"
                style={{ background: step >= s ? 'var(--amber)' : 'var(--hairline-strong)' }}
              />
            ))}
          </div>
        </div>

        <div className="p-7 min-h-[420px] flex flex-col">
          {error && (
            <div
              className="mb-4 rounded-xl px-4 py-3 text-[12px]"
              style={{ background: 'rgba(255,138,128,0.10)', color: 'var(--error)' }}
            >
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="flex-1 flex flex-col">
                <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>How will you use 5Bloc?</h1>
                <p className="text-[13px] mb-5" style={{ color: 'var(--stone)' }}>Choose your role — we&apos;ll tailor your workspace.</p>

                <div className="grid grid-cols-1 gap-2.5">
                  {USER_ROLES.map((r) => {
                    const selected = role === r.id
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className="flex items-start gap-3 p-3.5 rounded-xl text-left transition-all"
                        style={{
                          background: selected ? 'rgba(245,166,35,0.08)' : 'var(--surface-container-low)',
                          boxShadow: selected
                            ? 'inset 0 0 0 1.5px var(--amber)'
                            : 'inset 0 0 0 1px var(--hairline)',
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${r.color}18`, color: r.color }}
                        >
                          <span className="material-icons-outlined text-[18px]">{r.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold" style={{ color: 'var(--on-surface)' }}>{r.label}</p>
                          <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--stone)' }}>{r.signupDesc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-auto pt-6 flex justify-end">
                  <button type="button" onClick={() => setStep(2)} className="btn-primary">
                    Continue as {roleConfig.label}
                    <span className="material-icons-outlined text-[15px]">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="flex-1 flex flex-col">
                <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>Your profile</h1>
                <p className="text-[13px] mb-5" style={{ color: 'var(--stone)' }}>Confirm the name and email shown across the app.</p>

                <div
                  className="flex items-start gap-3 p-4 rounded-xl mb-5"
                  style={{ background: `${roleConfig.color}10`, boxShadow: `inset 0 0 0 1px ${roleConfig.color}30` }}
                >
                  <span className="material-icons-outlined text-[22px]" style={{ color: roleConfig.color }}>{roleConfig.icon}</span>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--on-surface)' }}>{roleConfig.label}</p>
                    <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>{roleConfig.signupDesc}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="label-sm block mb-1.5" style={{ color: 'var(--stone)' }}>Your name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input-5bloc" placeholder="Full name" />
                  </div>
                  <div>
                    <label className="label-sm block mb-1.5" style={{ color: 'var(--stone)' }}>Email</label>
                    <input type="email" name="email" value={formData.email} disabled className="input-5bloc opacity-60" />
                  </div>
                </div>

                <div className="mt-auto pt-6 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary btn-sm">
                    <span className="material-icons-outlined text-[14px]">arrow_back</span> Back
                  </button>
                  <button type="button" onClick={() => setStep(3)} disabled={!formData.name.trim()} className="btn-primary">
                    Continue <span className="material-icons-outlined text-[15px]">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="flex-1 flex flex-col">
                <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>{roleConfig.onboardingTitle}</h1>
                <p className="text-[13px] mb-5" style={{ color: 'var(--stone)' }}>
                  {inviteToken
                    ? 'Your firm details are prefilled from the invite.'
                    : 'This appears on invoices, portals and project invites.'}
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="label-sm block mb-1.5" style={{ color: 'var(--stone)' }}>{roleConfig.orgLabel} *</label>
                    <input type="text" name="orgName" value={formData.orgName} onChange={handleInputChange} className="input-5bloc" placeholder={roleConfig.orgPlaceholder} readOnly={!!inviteToken && !!inviteOrgName} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-sm block mb-1.5" style={{ color: 'var(--stone)' }}>City *</label>
                      <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="input-5bloc" placeholder="Mumbai" />
                    </div>
                    <div>
                      <label className="label-sm block mb-1.5" style={{ color: 'var(--stone)' }}>State</label>
                      <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="input-5bloc" placeholder="MH" />
                    </div>
                  </div>
                  {(role === 'architect' || role === 'contractor' || role === 'vendor' || role === 'interior_designer') && (
                    <div>
                      <label className="label-sm block mb-1.5" style={{ color: 'var(--stone)' }}>GSTIN (optional)</label>
                      <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} className="input-5bloc font-mono" placeholder="27AAAAA1111A1Z1" />
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-6 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setStep(2)} className="btn-secondary btn-sm">
                    <span className="material-icons-outlined text-[14px]">arrow_back</span> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={submitting || !formData.orgName.trim() || !formData.city.trim()}
                    className="btn-primary"
                  >
                    {submitting ? 'Setting up…' : 'Launch workspace →'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
