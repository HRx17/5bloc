'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/brand/LogoMark'
import { createSupabaseClient } from '@/lib/supabase/client'
import { getRoleConfig, USER_ROLES, type UserRole } from '@/lib/roles'

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<UserRole>('architect')
  const [loading, setLoading] = useState(false)
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
    const saved = localStorage.getItem('5bloc_signup_role') as UserRole | null
    if (saved && USER_ROLES.some((r) => r.id === saved)) setRole(saved)

    async function loadUser() {
      try {
        const supabase = createSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const r = (user.user_metadata?.role ?? saved ?? 'architect') as UserRole
          setRole(r)
          setFormData((prev) => ({
            ...prev,
            name: user.user_metadata?.full_name ?? prev.name,
            email: user.email ?? prev.email,
          }))
        }
      } catch { /* demo mode */ }
    }
    loadUser()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFinish = async () => {
    setLoading(true)
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
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Setup failed')
      }

      localStorage.removeItem('5bloc_signup_role')
      localStorage.setItem('onboarding_checklist_v1', JSON.stringify({
        client: false, project: false, document: false, ai: false, invite: false,
      }))
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error(err)
      // Demo fallback — still proceed
      localStorage.setItem('5bloc_demo_role', role)
      localStorage.removeItem('5bloc_signup_role')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 font-body" style={{ background: 'var(--surface-canvas)' }}>
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface-container)', boxShadow: 'inset 0 0 0 1px var(--hairline), var(--shadow-3)' }}
      >
        <div className="px-7 pt-7 flex items-center justify-between">
          <Logo size={28} showTagline={false} />
          <span className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--stone)' }}>
            STEP {step}/2
          </span>
        </div>

        <div className="p-7 min-h-[380px] flex flex-col">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="flex-1 flex flex-col">
                <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>Welcome to 5BLOC</h1>
                <p className="text-[13px] mb-5" style={{ color: 'var(--stone)' }}>Confirm your profile to get started.</p>

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

                <div className="mt-auto pt-6 flex justify-end">
                  <button type="button" onClick={() => setStep(2)} disabled={!formData.name.trim()} className="btn-primary">
                    Continue <span className="material-icons-outlined text-[15px]">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="flex-1 flex flex-col">
                <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>{roleConfig.onboardingTitle}</h1>
                <p className="text-[13px] mb-5" style={{ color: 'var(--stone)' }}>This appears on invoices, portals and project invites.</p>

                <div className="space-y-3">
                  <div>
                    <label className="label-sm block mb-1.5" style={{ color: 'var(--stone)' }}>{roleConfig.orgLabel} *</label>
                    <input type="text" name="orgName" value={formData.orgName} onChange={handleInputChange} className="input-5bloc" placeholder={roleConfig.orgPlaceholder} />
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
                  {(role === 'architect' || role === 'contractor' || role === 'vendor') && (
                    <div>
                      <label className="label-sm block mb-1.5" style={{ color: 'var(--stone)' }}>GSTIN (optional)</label>
                      <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} className="input-5bloc font-mono" placeholder="27AAAAA1111A1Z1" />
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-6 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary btn-sm">
                    <span className="material-icons-outlined text-[14px]">arrow_back</span> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={loading || !formData.orgName.trim() || !formData.city.trim()}
                    className="btn-primary"
                  >
                    {loading ? 'Setting up…' : 'Launch workspace →'}
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
