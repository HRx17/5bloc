'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { startRazorpayCheckout } from '@/lib/payments/checkout'
import { billingForRole, BILLING_ROLES } from '@/lib/payments/plans'
import { isRoleKey, type RoleKey } from '@/lib/rbac/roles'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { fileToAvatarDataUrl } from '@/lib/images/avatar'

interface OrgMember {
  id: string
  name: string
  email: string
  role: string
  joined_at: string
}

type PaymentMethod = {
  id: string
  kind: 'card' | 'upi' | 'netbanking'
  brand?: string | null
  last4?: string | null
  upi_vpa?: string | null
  exp_month?: number | null
  exp_year?: number | null
  is_default: boolean
}

type Subscription = {
  id: string
  status: string
  current_end: string | null
  cancelled_at_cycle_end: boolean
}

type BillingHistoryItem = {
  id: string
  amount: number | null
  status: string
  paid_at: string | null
  receipt_url: string | null
}

type TabId = 'profile' | 'organisation' | 'team' | 'billing' | 'notifications' | 'integrations'

const ALL_ROLES: RoleKey[] = ['architect', 'contractor', 'builder', 'consultant', 'client']

const ALL_TABS: { id: TabId; label: string; icon: string; roles: RoleKey[] }[] = [
  { id: 'profile', label: 'User Profile', icon: 'person_outline', roles: ALL_ROLES },
  { id: 'organisation', label: 'Organisation', icon: 'domain', roles: ['architect'] },
  { id: 'team', label: 'Org Team', icon: 'contacts', roles: ['architect'] },
  { id: 'billing', label: 'Billing & Payments', icon: 'receipt_long', roles: BILLING_ROLES },
  { id: 'notifications', label: 'Notifications', icon: 'notifications', roles: ALL_ROLES },
  { id: 'integrations', label: 'Integrations', icon: 'sync_alt', roles: ['architect', 'contractor', 'builder', 'consultant'] },
]

/**
 * Third-party accounts a user can link. Connecting and revoking lives in the
 * Integrations workspace; settings only reports status and links across to it.
 */
const INTEGRATION_PROVIDERS: {
  provider: string
  label: string
  icon: string
  desc: string
}[] = [
  {
    provider: 'google',
    label: 'Google Workspace',
    icon: 'cloud_queue',
    desc: 'Drive, Gmail and Calendar — sync sheets, ingest email and mirror milestone dates.',
  },
  {
    provider: 'autodesk',
    label: 'Autodesk',
    icon: 'architecture',
    desc: 'Upload and inspect DWG and Revit models in the CAD viewer.',
  },
]

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '👤'
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

function cardBrand(number: string) {
  const n = number.replace(/\D/g, '')
  if (/^4/.test(n)) return 'Visa'
  if (/^5[1-5]/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'Amex'
  if (/^6/.test(n)) return 'RuPay'
  return 'Card'
}

export default function Settings() {
  const { toast } = useToast()
  const confirm = useConfirm()
  const [role, setRole] = useState<RoleKey>('architect')
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [hydrated, setHydrated] = useState(false)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [billingError, setBillingError] = useState<unknown>(null)
  const [teamError, setTeamError] = useState<unknown>(null)

  const [profile, setProfile] = useState({ name: '', email: '', phone: '', avatar: '' })
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [org, setOrg] = useState({ name: '', logo: '', gst: '', city: '', address: '' })
  const [planKey, setPlanKey] = useState('free')
  const [aiAddOn, setAiAddOn] = useState(false)

  const [team, setTeam] = useState<OrgMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<{ id: string; email: string; role: string }[]>([])
  const [newTeamEmail, setNewTeamEmail] = useState('')
  const [teamBusy, setTeamBusy] = useState(false)
  const [billingBusy, setBillingBusy] = useState(false)
  const [removeMember, setRemoveMember] = useState<OrgMember | null>(null)

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [history, setHistory] = useState<BillingHistoryItem[]>([])
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelBusy, setCancelBusy] = useState(false)

  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [methodBusy, setMethodBusy] = useState(false)
  const [removeMethod, setRemoveMethod] = useState<PaymentMethod | null>(null)
  const [showAddMethod, setShowAddMethod] = useState(false)
  const [methodForm, setMethodForm] = useState({
    kind: 'card' as 'card' | 'upi',
    cardNumber: '',
    expMonth: '',
    expYear: '',
    upi: '',
    makeDefault: false,
  })

  const [notifications, setNotifications] = useState({
    new_projects: true,
    comments: true,
    approvals: true,
    rfis: true,
    weekly_digest: false,
  })
  // Kept verbatim so toggling one preference never drops keys we do not render
  const [prefsBase, setPrefsBase] = useState<Record<string, unknown>>({})

  const [connected, setConnected] = useState<string[] | null>(null)

  const tabs = useMemo(() => ALL_TABS.filter((t) => t.roles.includes(role)), [role])
  const billing = useMemo(() => billingForRole(role), [role])
  const showsBilling = tabs.some((t) => t.id === 'billing')

  const loadTeam = async () => {
    setTeamError(null)
    const res = await fetch('/api/org/team').catch(() => null)
    if (!res || !res.ok) {
      setTeamError(new Error('Could not load your firm members'))
      return
    }
    const d = await res.json()
    setTeam(
      (d.members || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        joined_at: m.joined_at || '—',
      }))
    )
    setPendingInvites(d.invites || [])
  }

  const loadMethods = async () => {
    const res = await fetch('/api/payments/methods')
    if (!res.ok) throw new Error('Could not load your saved payment methods')
    const d = await res.json()
    setMethods(d.methods || [])
  }

  const loadSubscription = async () => {
    const res = await fetch('/api/payments/subscription')
    if (!res.ok) throw new Error('Could not load your subscription')
    const d = await res.json()
    setSubscription(d.subscription || null)
    setHistory(d.history || [])
  }

  const loadBilling = useCallback(async () => {
    setBillingError(null)
    try {
      await Promise.all([loadMethods(), loadSubscription()])
    } catch (err) {
      setBillingError(err)
    }
  }, [])

  const loadMe = useCallback(() => {
    setLoadError(null)
    return fetch('/api/me')
      .then((r) => {
        if (!r.ok) throw new Error('Could not load your account')
        return r.json()
      })
      .then(async (d) => {
        const p = d.profile
        if (!p) throw new Error('Your account could not be found. Try signing in again.')
        const resolvedRole: RoleKey = isRoleKey(p.role) ? p.role : 'architect'
        setRole(resolvedRole)
        setProfile({
          name: p.full_name || '',
          email: p.email || '',
          phone: p.phone || '',
          avatar: p.avatar_url || '',
        })
        setOrg({
          name: p.organisations?.name || '',
          logo: p.organisations?.logo_url || '',
          gst: p.organisations?.gst_number || '',
          city: p.organisations?.city || '',
          address: p.organisations?.address || '',
        })
        setAiAddOn(!!p.ai_add_on)
        const prefs =
          p.notification_preferences && typeof p.notification_preferences === 'object'
            ? (p.notification_preferences as Record<string, unknown>)
            : {}
        setPrefsBase(prefs)
        setNotifications({
          new_projects: p.notify_email !== false,
          comments: p.notify_bids !== false,
          approvals: p.notify_approvals !== false,
          rfis: p.notify_rfi !== false,
          weekly_digest: prefs.weekly_digest === true,
        })

        if (resolvedRole === 'architect') {
          setPlanKey(p.organisations?.plan || p.plan || 'free')
          loadTeam().catch(() => {})
        } else if (resolvedRole === 'contractor') {
          const mine = await fetch('/api/contractors?mine=1')
            .then((r) => r.json())
            .catch(() => ({}))
          const me = (mine.contractors || [])[0]
          setPlanKey(me?.badge_active ? 'badge' : 'free')
        }

        if (BILLING_ROLES.includes(resolvedRole)) {
          loadBilling()
        }

        // Deep links like /settings?tab=billing
        const requested = new URLSearchParams(window.location.search).get('tab') as TabId | null
        const allowedForRole = ALL_TABS.filter((t) => t.roles.includes(resolvedRole)).map((t) => t.id)
        if (requested && allowedForRole.includes(requested)) setActiveTab(requested)
      })
      .catch((err) => setLoadError(err))
      .finally(() => setHydrated(true))
  }, [loadBilling])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  // Razorpay sends the user back here after checkout; say what actually happened.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const subscribed = params.get('subscribed')
    const payment = params.get('payment')
    if (!subscribed && !payment) return

    if (subscribed === 'true') {
      toast(
        'Payment received. Your plan is being activated — it can take a few seconds to appear below.',
        'success',
        8000
      )
      setActiveTab('billing')
      loadBilling()
    } else if (payment === 'cancelled') {
      toast('Checkout was cancelled. You have not been charged and your plan is unchanged.', 'info', 7000)
      setActiveTab('billing')
    } else if (payment === 'failed') {
      toast(
        'That payment did not go through. Nothing was charged — check your card or UPI details and try again.',
        'error',
        9000
      )
      setActiveTab('billing')
    }

    const url = new URL(window.location.href)
    url.searchParams.delete('subscribed')
    url.searchParams.delete('payment')
    window.history.replaceState({}, '', url.toString())
  }, [loadBilling, toast])

  useEffect(() => {
    fetch('/api/integrations/status')
      .then((r) => r.json())
      .then((d) => setConnected(Array.isArray(d.connected) ? d.connected : []))
      .catch(() => setConnected([]))
  }, [])

  const saveAvatar = async (dataUrl: string | null) => {
    setAvatarBusy(true)
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: dataUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save avatar')
      setProfile((prev) => ({ ...prev, avatar: dataUrl || '' }))
      toast(dataUrl ? 'Avatar updated' : 'Avatar removed', 'success')
    } catch (err: any) {
      toast(err?.message || 'Could not save avatar', 'error')
    } finally {
      setAvatarBusy(false)
    }
  }

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAvatarBusy(true)
    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      await saveAvatar(dataUrl)
    } catch (err: any) {
      toast(err?.message || 'Could not read that image', 'error')
      setAvatarBusy(false)
    }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: profile.name,
        phone: profile.phone,
        avatar_url: profile.avatar || null,
      }),
    })
    const data = await res.json()
    toast(res.ok ? 'Profile saved' : data.error || 'Save failed', res.ok ? 'success' : 'error')
  }

  const handleOrgSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org: { name: org.name, gst: org.gst, city: org.city, address: org.address } }),
    })
    const data = await res.json()
    toast(res.ok ? 'Organisation saved' : data.error || 'Save failed', res.ok ? 'success' : 'error')
  }

  const handleInviteTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamEmail || teamBusy) return
    setTeamBusy(true)
    try {
      const res = await fetch('/api/org/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newTeamEmail, member_role: 'member' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invite failed')
      setNewTeamEmail('')
      await loadTeam()
      toast(
        data.email_warning
          ? `${data.email_warning} Link: ${data.accept_url || ''}`
          : `Invite sent to ${data.invite?.email || newTeamEmail}`,
        data.email_warning ? 'warning' : 'success'
      )
    } catch (err: any) {
      toast(err?.message || 'Invite failed', 'error')
    } finally {
      setTeamBusy(false)
    }
  }

  const confirmRemoveTeam = async () => {
    if (!removeMember) return
    setTeamBusy(true)
    const res = await fetch(`/api/org/team?member_id=${encodeURIComponent(removeMember.id)}`, {
      method: 'DELETE',
    })
    const data = await res.json().catch(() => ({}))
    setTeamBusy(false)
    setRemoveMember(null)
    if (!res.ok) {
      toast(data.error || 'Remove failed', 'error')
      return
    }
    toast('Member removed', 'success')
    await loadTeam()
  }

  const handleBilling = async (
    plan: 'solo' | 'team' | 'ai' | 'badge',
    label: string,
    price: string,
    term: string
  ) => {
    if (billingBusy) return
    const period = term.split('·')[0].trim()
    const ok = await confirm({
      title: `Switch to ${label}?`,
      message: `You will be taken to Razorpay to pay ${price} ${period}, recurring until you cancel. Nothing is charged until you finish checkout there.`,
      confirmLabel: 'Continue to payment',
    })
    if (!ok) return

    setBillingBusy(true)
    try {
      const result = await startRazorpayCheckout({ plan, redirect: '/settings?tab=billing&subscribed=true' })
      if (result.ok) return
      toast(
        result.message === 'Checkout cancelled'
          ? 'Checkout cancelled. You have not been charged and your plan is unchanged.'
          : `${result.message || 'Checkout could not be started'} — nothing was charged.`,
        'warning',
        7000
      )
    } catch (err) {
      toast(
        err instanceof Error
          ? `${err.message} — nothing was charged.`
          : 'Could not reach the payment provider. Nothing was charged, please try again.',
        'error',
        7000
      )
    } finally {
      setBillingBusy(false)
    }
  }

  const confirmCancelSubscription = async () => {
    setCancelBusy(true)
    const res = await fetch('/api/payments/subscription', { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    setCancelBusy(false)
    setCancelOpen(false)
    if (!res.ok) {
      toast(data.error || 'Could not cancel the subscription', 'error')
      return
    }
    toast(data.message || 'Subscription cancelled', 'success', 6000)
    await loadSubscription()
  }

  const addMethod = async (e: React.FormEvent) => {
    e.preventDefault()
    if (methodBusy) return
    setMethodBusy(true)
    try {
      const payload =
        methodForm.kind === 'card'
          ? {
              kind: 'card',
              brand: cardBrand(methodForm.cardNumber),
              last4: methodForm.cardNumber.replace(/\D/g, '').slice(-4),
              exp_month: methodForm.expMonth,
              exp_year: methodForm.expYear,
              is_default: methodForm.makeDefault,
            }
          : { kind: 'upi', upi_vpa: methodForm.upi, is_default: methodForm.makeDefault }

      const res = await fetch('/api/payments/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save payment method')
      toast('Payment method added', 'success')
      setShowAddMethod(false)
      setMethodForm({ kind: 'card', cardNumber: '', expMonth: '', expYear: '', upi: '', makeDefault: false })
      await loadMethods()
    } catch (err: any) {
      toast(err?.message || 'Could not save payment method', 'error')
    } finally {
      setMethodBusy(false)
    }
  }

  const makeDefaultMethod = async (id: string) => {
    setMethodBusy(true)
    const res = await fetch('/api/payments/methods', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setMethodBusy(false)
    if (!res.ok) {
      toast('Could not update default', 'error')
      return
    }
    toast('Default payment method updated', 'success')
    await loadMethods()
  }

  const confirmRemoveMethod = async () => {
    if (!removeMethod) return
    setMethodBusy(true)
    const res = await fetch(`/api/payments/methods?id=${encodeURIComponent(removeMethod.id)}`, {
      method: 'DELETE',
    })
    setMethodBusy(false)
    setRemoveMethod(null)
    if (!res.ok) {
      toast('Could not remove payment method', 'error')
      return
    }
    toast('Payment method removed', 'success')
    await loadMethods()
  }

  const handleToggleNotification = async (key: keyof typeof notifications) => {
    const previous = notifications
    const next = { ...notifications, [key]: !notifications[key] }
    setNotifications(next)
    const prefs = { ...prefsBase, weekly_digest: next.weekly_digest }
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notify_email: next.new_projects,
        notify_rfi: next.rfis,
        notify_approvals: next.approvals,
        notify_bids: next.comments,
        notification_preferences: prefs,
      }),
    })
    if (!res.ok) {
      setNotifications(previous)
      toast('Could not save that preference', 'error')
      return
    }
    setPrefsBase(prefs)
  }

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  const methodLabel = (m: PaymentMethod) =>
    m.kind === 'upi'
      ? m.upi_vpa || 'UPI'
      : `${m.brand || 'Card'} •••• ${m.last4 || '––––'}${
          m.exp_month && m.exp_year ? ` · ${String(m.exp_month).padStart(2, '0')}/${m.exp_year}` : ''
        }`

  if (loadError) {
    return (
      <div className="p-6 font-body max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">Workspace Settings</h1>
        </div>
        <ErrorState
          title="Could not load your settings"
          error={loadError}
          description="Your profile, plan and payment details are safe — we just could not read them right now."
          onRetry={loadMe}
        />
      </div>
    )
  }

  return (
    <div className="p-6 font-body select-none max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-wide">Workspace Settings</h1>
        <p className="text-xs text-stone mt-1">
          {hydrated
            ? showsBilling
              ? 'Configure your profile, notifications, and payments.'
              : 'Configure your profile and notifications.'
            : 'Loading your account…'}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="card-5bloc w-full md:w-56 shrink-0 py-4 px-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition ${
                activeTab === tab.id ? 'bg-amber text-navy font-semibold' : 'text-stone hover:text-white hover:bg-navy-lt'
              }`}
            >
              <span className="material-icons-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-grow w-full">
          {!hydrated && (
            <div className="card-5bloc space-y-4">
              <Skeleton className="h-5 w-40" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-32" />
            </div>
          )}

          {hydrated && activeTab === 'profile' && (
            <div className="card-5bloc space-y-6">
              <h3 className="text-sm font-semibold text-amber pb-2.5">User Profile</h3>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="flex items-center gap-4 pb-2">
                  <div
                    className="w-14 h-14 border flex items-center justify-center font-bold text-lg text-amber overflow-hidden bg-navy-lt"
                    style={{ borderRadius: '50%' }}
                  >
                    {profile.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials(profile.name)
                    )}
                  </div>
                  <div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleAvatarPick}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={avatarBusy}
                        onClick={() => avatarInputRef.current?.click()}
                        className="btn-secondary py-1 px-3 text-xs"
                      >
                        {avatarBusy ? 'Uploading…' : 'Upload avatar'}
                      </button>
                      {profile.avatar && (
                        <button
                          type="button"
                          disabled={avatarBusy}
                          onClick={() => saveAvatar(null)}
                          className="text-[11px] text-stone hover:text-error"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-stone mt-1">PNG, JPG, or WebP. Cropped to a square automatically.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone text-xs font-medium mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={profile.name}
                      onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                      className="input-5bloc py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-stone text-xs font-medium mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                      className="input-5bloc py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone text-xs font-medium mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="input-5bloc py-1.5 text-xs opacity-60 cursor-not-allowed"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button type="submit" className="btn-primary py-1.5 px-6 text-xs">
                    Save profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {hydrated && activeTab === 'organisation' && (
            <div className="card-5bloc space-y-6">
              <h3 className="text-sm font-semibold text-amber pb-2.5">Firm Information</h3>
              <form onSubmit={handleOrgSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone text-xs font-medium mb-1.5">Firm Name *</label>
                    <input
                      type="text"
                      required
                      value={org.name}
                      onChange={(e) => setOrg((prev) => ({ ...prev, name: e.target.value }))}
                      className="input-5bloc py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-stone text-xs font-medium mb-1.5">Firm GSTIN (Optional)</label>
                    <input
                      type="text"
                      value={org.gst}
                      onChange={(e) => setOrg((prev) => ({ ...prev, gst: e.target.value }))}
                      className="input-5bloc py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-stone text-xs font-medium mb-1.5">Street Address</label>
                    <input
                      type="text"
                      value={org.address}
                      onChange={(e) => setOrg((prev) => ({ ...prev, address: e.target.value }))}
                      className="input-5bloc py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-stone text-xs font-medium mb-1.5">Firm City</label>
                    <input
                      type="text"
                      value={org.city}
                      onChange={(e) => setOrg((prev) => ({ ...prev, city: e.target.value }))}
                      className="input-5bloc py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button type="submit" className="btn-primary py-1.5 px-6 text-xs">
                    Save organisation
                  </button>
                </div>
              </form>
            </div>
          )}

          {hydrated && activeTab === 'team' && (
            <div className="space-y-6">
              <div className="card-5bloc space-y-4">
                <h3 className="text-sm font-semibold text-amber pb-2.5">Invite Firm Co-Worker</h3>
                <form onSubmit={handleInviteTeam} className="flex gap-4 items-end">
                  <div className="flex-grow">
                    <label className="block text-stone text-xs font-medium mb-1.5">Co-worker Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. colleague@firm.com"
                      value={newTeamEmail}
                      onChange={(e) => setNewTeamEmail(e.target.value)}
                      className="input-5bloc py-1.5 text-xs"
                    />
                  </div>
                  <button type="submit" disabled={teamBusy} className="btn-primary py-2 px-6 text-xs h-[34px]">
                    {teamBusy ? 'Sending…' : 'Send invite'}
                  </button>
                </form>
                {pendingInvites.length > 0 && (
                  <div className="pt-2 space-y-1">
                    <p className="text-[10px] text-stone uppercase tracking-wider">Pending invites</p>
                    {pendingInvites.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between text-xs text-stone">
                        <span>{inv.email}</span>
                        <button
                          type="button"
                          className="text-error text-[11px]"
                          onClick={async () => {
                            await fetch(`/api/org/team?invite_id=${encodeURIComponent(inv.id)}`, { method: 'DELETE' })
                            toast('Invite revoked', 'success')
                            await loadTeam()
                          }}
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card-5bloc space-y-4">
                <h3 className="text-xs font-semibold text-stone pb-2.5">Firm Workspace Members</h3>
                {teamError ? (
                  <ErrorState
                    compact
                    title="Could not load your firm members"
                    description="Nobody has been removed — we just could not read the list."
                    onRetry={() => loadTeam()}
                  />
                ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-stone text-[10px] pb-2 font-medium">
                        <th className="pb-2 pl-2">Name</th>
                        <th className="pb-2">Email</th>
                        <th className="pb-2">Joined Date</th>
                        <th className="pb-2">Workspace Role</th>
                        <th className="pb-2 pr-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-lt/40 text-stone">
                      {team.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 pl-2 text-[11px]">
                            Nobody else is in this workspace yet. Invite a co-worker above to share projects with them.
                          </td>
                        </tr>
                      )}
                      {team.map((member) => (
                        <tr key={member.id}>
                          <td className="py-3 pl-2 font-semibold text-white">{member.name}</td>
                          <td className="py-3 text-xs">{member.email}</td>
                          <td className="py-3 text-xs">{member.joined_at}</td>
                          <td className="py-3">
                            <span
                              className="chip"
                              style={{
                                background: member.role === 'Owner' ? 'rgba(245,166,35,.12)' : 'rgba(159,142,122,.10)',
                                color: member.role === 'Owner' ? 'var(--amber)' : 'var(--stone)',
                              }}
                            >
                              {member.role}
                            </span>
                          </td>
                          <td className="py-3 pr-2 text-right">
                            {member.role !== 'Owner' && (
                              <button
                                onClick={() => setRemoveMember(member)}
                                className="text-stone hover:text-error transition font-semibold"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            </div>
          )}

          {hydrated && activeTab === 'billing' && (
            <div className="space-y-6">
              {billingError ? (
                <ErrorState
                  compact
                  title="Could not load your billing details"
                  description="Your subscription and saved payment methods could not be read, so what you see below may be incomplete. Nothing has changed on your account."
                  onRetry={loadBilling}
                />
              ) : null}

              <div className="card-5bloc space-y-3">
                <h3 className="text-sm font-semibold text-amber">{billing.heading}</h3>
                <p className="text-[11px] text-stone leading-relaxed">{billing.blurb}</p>

                {subscription && (
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'var(--surface-container-low)' }}
                  >
                    <div>
                      <p className="text-xs font-medium capitalize">Subscription {subscription.status}</p>
                      <p className="text-[11px]" style={{ color: 'var(--stone)' }}>
                        {subscription.cancelled_at_cycle_end
                          ? `Ends on ${formatDate(subscription.current_end)} — no further charges.`
                          : subscription.current_end
                            ? `Renews on ${formatDate(subscription.current_end)}.`
                            : 'Renewal date unavailable.'}
                      </p>
                    </div>
                    {!subscription.cancelled_at_cycle_end && subscription.status !== 'cancelled' && (
                      <button className="btn-secondary py-1.5 px-4 text-xs" onClick={() => setCancelOpen(true)}>
                        Cancel subscription
                      </button>
                    )}
                  </div>
                )}
              </div>

              {billing.showsPlans && (
                <div className={`grid grid-cols-1 gap-5 ${billing.plans.length > 2 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                  {billing.plans.map((plan) => {
                    const current = plan.key === planKey
                    return (
                      <div
                        key={plan.key}
                        className="card-5bloc flex flex-col justify-between"
                        style={
                          current
                            ? { boxShadow: 'var(--shadow-amber)', background: 'rgba(245,166,35,.06)', color: 'var(--amber)' }
                            : { color: 'var(--on-surface)' }
                        }
                      >
                        <div>
                          <h4 className="text-xs font-semibold text-stone">{plan.name}</h4>
                          <h2 className="text-2xl font-bold text-white mt-2">{plan.price}</h2>
                          <p className="text-[11px] text-stone mt-2 leading-relaxed">{plan.term}</p>
                        </div>
                        <div className="pt-4">
                          {current ? (
                            <span
                              className="w-full text-center block text-[11px] py-1.5 font-medium"
                              style={{ background: 'rgba(245,166,35,.10)', color: 'var(--amber)' }}
                            >
                              Current plan
                            </span>
                          ) : plan.checkout ? (
                            <button
                              onClick={() => handleBilling(plan.checkout!, plan.name, plan.price, plan.term)}
                              disabled={billingBusy}
                              className="w-full btn-primary text-xs py-1.5 font-medium"
                            >
                              {billingBusy ? 'Opening…' : `Upgrade to ${plan.name}`}
                            </button>
                          ) : (
                            <span className="w-full text-center block text-[11px] py-1.5 text-stone">Included</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {billing.addOns.map((addOn) => (
                <div key={addOn.key} className="card-5bloc flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber/10 border text-amber flex items-center justify-center shrink-0">
                      <span className="material-icons-outlined text-[20px]">auto_awesome</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{addOn.name}</h4>
                      <p className="text-[11px] text-stone mt-0.5">
                        {addOn.price} {addOn.term}
                      </p>
                    </div>
                  </div>
                  {aiAddOn && addOn.key === 'ai' ? (
                    <span className="chip text-[11px]" style={{ color: 'var(--success)' }}>
                      Active
                    </span>
                  ) : (
                    <button
                      onClick={() =>
                        addOn.checkout && handleBilling(addOn.checkout, addOn.name, addOn.price, addOn.term)
                      }
                      disabled={billingBusy}
                      className="btn-secondary py-1.5 text-xs font-medium text-amber"
                    >
                      {billingBusy ? 'Opening…' : 'Add to billing'}
                    </button>
                  )}
                </div>
              ))}

              <div className="card-5bloc space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-amber">Saved payment references</h3>
                    <p className="text-[11px] text-stone mt-0.5">
                      Saved for your records only (last 4 digits / UPI ID). Subscriptions and invoice
                      payments still run through Razorpay checkout — these are not charged automatically.
                    </p>
                  </div>
                  <button className="btn-secondary py-1.5 px-4 text-xs" onClick={() => setShowAddMethod((v) => !v)}>
                    {showAddMethod ? 'Cancel' : 'Add method'}
                  </button>
                </div>

                {showAddMethod && (
                  <form onSubmit={addMethod} className="space-y-3 pt-2">
                    <div className="flex gap-2">
                      {(['card', 'upi'] as const).map((k) => (
                        <button
                          key={k}
                          type="button"
                          className="chip text-[11px]"
                          style={{
                            color: methodForm.kind === k ? 'var(--amber)' : 'var(--stone)',
                            background: methodForm.kind === k ? 'rgba(245,166,35,0.12)' : 'rgba(159,142,122,0.1)',
                          }}
                          onClick={() => setMethodForm((p) => ({ ...p, kind: k }))}
                        >
                          {k === 'card' ? 'Card' : 'UPI'}
                        </button>
                      ))}
                    </div>

                    {methodForm.kind === 'card' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-stone text-xs font-medium mb-1.5">Card number</label>
                          <input
                            className="input-5bloc py-1.5 text-xs font-mono"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            placeholder="4111 1111 1111 1111"
                            value={methodForm.cardNumber}
                            onChange={(e) => setMethodForm((p) => ({ ...p, cardNumber: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-stone text-xs font-medium mb-1.5">MM</label>
                            <input
                              className="input-5bloc py-1.5 text-xs font-mono"
                              inputMode="numeric"
                              placeholder="09"
                              value={methodForm.expMonth}
                              onChange={(e) => setMethodForm((p) => ({ ...p, expMonth: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-stone text-xs font-medium mb-1.5">YYYY</label>
                            <input
                              className="input-5bloc py-1.5 text-xs font-mono"
                              inputMode="numeric"
                              placeholder="2029"
                              value={methodForm.expYear}
                              onChange={(e) => setMethodForm((p) => ({ ...p, expYear: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-stone text-xs font-medium mb-1.5">UPI ID</label>
                        <input
                          className="input-5bloc py-1.5 text-xs"
                          placeholder="name@bank"
                          value={methodForm.upi}
                          onChange={(e) => setMethodForm((p) => ({ ...p, upi: e.target.value }))}
                          required
                        />
                      </div>
                    )}

                    <label className="flex items-center gap-2 text-[11px] text-stone">
                      <input
                        type="checkbox"
                        checked={methodForm.makeDefault}
                        onChange={(e) => setMethodForm((p) => ({ ...p, makeDefault: e.target.checked }))}
                      />
                      Set as default payment method
                    </label>

                    <div className="flex justify-end">
                      <button type="submit" disabled={methodBusy} className="btn-primary py-1.5 px-6 text-xs">
                        {methodBusy ? 'Saving…' : 'Save method'}
                      </button>
                    </div>
                  </form>
                )}

                {billingError ? null : methods.length === 0 ? (
                  <p className="text-[11px] text-stone">
                    No payment reference saved yet. Optional — useful so your firm remembers which card or UPI you usually use.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {methods.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                        style={{ background: 'var(--surface-container-low)' }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-icons-outlined text-[18px] text-stone">
                            {m.kind === 'upi' ? 'account_balance' : 'credit_card'}
                          </span>
                          <div>
                            <p className="text-xs font-medium">{methodLabel(m)}</p>
                            {m.is_default && (
                              <span className="text-[10px]" style={{ color: 'var(--amber)' }}>
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {!m.is_default && (
                            <button
                              className="text-[11px] text-stone hover:text-amber"
                              disabled={methodBusy}
                              onClick={() => makeDefaultMethod(m.id)}
                            >
                              Make default
                            </button>
                          )}
                          <button
                            className="text-[11px] text-stone hover:text-error"
                            disabled={methodBusy}
                            onClick={() => setRemoveMethod(m)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {history.length > 0 && (
                <div className="card-5bloc space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-amber">Billing history</h3>
                    <p className="text-[11px] text-stone mt-0.5">Receipts for your last twelve charges.</p>
                  </div>
                  <div className="space-y-2">
                    {history.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                        style={{ background: 'var(--surface-container-low)' }}
                      >
                        <div>
                          <p className="text-xs font-medium">
                            {h.amount != null ? `₹${h.amount.toLocaleString('en-IN')}` : '—'}
                          </p>
                          <p className="text-[11px] capitalize" style={{ color: 'var(--stone)' }}>
                            {h.status} · {formatDate(h.paid_at)}
                          </p>
                        </div>
                        {h.receipt_url && (
                          <a
                            href={h.receipt_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px]"
                            style={{ color: 'var(--amber)' }}
                          >
                            View receipt
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {hydrated && activeTab === 'notifications' && (
            <div className="card-5bloc space-y-6">
              <h3 className="text-sm font-semibold text-amber pb-2.5">Email Notifications</h3>
              <div className="space-y-4 text-xs">
                {[
                  { key: 'new_projects', label: 'New project invites', desc: 'Notify me when I am invited to a project workspace.' },
                  { key: 'comments', label: 'Document comments', desc: 'Notify me when someone comments on a drawing or sheet.' },
                  { key: 'approvals', label: 'Document approvals', desc: 'Notify me when a drawing is approved or revisions are requested.' },
                  { key: 'rfis', label: 'RFI activity', desc: 'Notify me when RFIs are raised or resolved.' },
                  {
                    key: 'weekly_digest',
                    label: 'Weekly summary digest',
                    desc: 'Send a Monday morning digest of progress across my active projects.',
                  },
                ].map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-4">
                    <div className="max-w-md">
                      <span className="text-white font-medium">{item.label}</span>
                      <p className="text-[11px] text-stone mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleNotification(item.key as keyof typeof notifications)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                        (notifications as any)[item.key] ? 'bg-success' : 'bg-navy-lt'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          (notifications as any)[item.key] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hydrated && activeTab === 'integrations' && (
            <div className="card-5bloc space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-amber pb-2.5">Connected Accounts</h3>
                <p className="text-[11px] text-stone leading-relaxed">
                  These accounts are linked to you personally, not to the whole firm. Connect or revoke them in the
                  Integrations workspace.
                </p>
              </div>

              <div className="space-y-3">
                {INTEGRATION_PROVIDERS.map((item) => {
                  const isConnected = !!connected?.includes(item.provider)
                  return (
                    <div key={item.provider} className="flex items-start justify-between gap-4 bg-navy/20 p-4">
                      <div className="flex items-start gap-3 max-w-md">
                        <span className="material-icons-outlined text-amber text-[20px]">{item.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-white">{item.label}</p>
                          <p className="text-[11px] text-stone mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-semibold px-2 py-1 shrink-0"
                        style={
                          connected === null
                            ? { color: 'var(--stone)', background: 'rgba(138,128,120,.12)' }
                            : isConnected
                              ? { color: 'var(--success)', background: 'rgba(46,204,138,.12)' }
                              : { color: 'var(--stone)', background: 'rgba(138,128,120,.12)' }
                        }
                      >
                        {connected === null ? 'Checking…' : isConnected ? 'Connected' : 'Not connected'}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a href="/integrations" className="btn-secondary py-1.5 px-4 text-xs inline-block w-fit">
                  Manage integrations
                </a>
                <a href="/cad" className="text-[11px] text-stone hover:text-amber">
                  Open CAD viewer
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!removeMember}
        title="Remove team member"
        message={`${removeMember?.name || 'This member'} will lose access to the firm workspace and its projects.`}
        confirmLabel="Remove member"
        variant="danger"
        loading={teamBusy}
        onConfirm={confirmRemoveTeam}
        onCancel={() => setRemoveMember(null)}
      />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel subscription?"
        message={
          subscription?.current_end
            ? `Your plan stays active until ${formatDate(subscription.current_end)}, then drops to the free tier with no further charges.`
            : 'Your plan will drop to the free tier at the end of the current billing period.'
        }
        confirmLabel="Cancel subscription"
        cancelLabel="Keep plan"
        variant="danger"
        loading={cancelBusy}
        onConfirm={confirmCancelSubscription}
        onCancel={() => setCancelOpen(false)}
      />

      <ConfirmDialog
        open={!!removeMethod}
        title="Remove payment method"
        message={`${removeMethod ? methodLabel(removeMethod) : 'This method'} will be removed from your saved references. Subscriptions and invoice payments are unaffected.`}
        confirmLabel="Remove"
        variant="danger"
        loading={methodBusy}
        onConfirm={confirmRemoveMethod}
        onCancel={() => setRemoveMethod(null)}
      />
    </div>
  )
}
