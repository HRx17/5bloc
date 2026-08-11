'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Logo } from '@/components/brand/LogoMark'
import { ROLES, isRoleKey } from '@/lib/rbac/roles'

export default function AcceptInvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')
  const [invite, setInvite] = useState<any>(null)

  useEffect(() => {
    if (!token) {
      setError('Missing invite token')
      setLoading(false)
      return
    }
    fetch(`/api/invites/accept?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Invalid invite')
        setInvite(data.invite)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const accept = async () => {
    setAccepting(true)
    setError('')
    try {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (res.status === 401) {
        const role = invite?.role || 'contractor'
        router.push(
          `/signup?invite_token=${encodeURIComponent(token)}&email=${encodeURIComponent(invite?.invite_email || '')}&role=${role}`
        )
        return
      }
      if (!res.ok) throw new Error(data.error || 'Could not accept')
      router.push(data.redirect || `/projects/${data.project_id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4 font-body text-white">
      <div className="w-full max-w-md bg-navy-mid p-8">
        <Logo size={36} showTagline />
        <h1 className="text-2xl font-semibold mt-6">Project invitation</h1>

        {loading && <p className="text-stone text-sm mt-4">Loading invite…</p>}
        {error && <p className="text-error text-sm mt-4">{error}</p>}

        {!loading && invite && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-stone">
              You&apos;ve been invited to{' '}
              <span className="text-white font-semibold">{invite.project_name || 'a project'}</span> as{' '}
              <span className="text-amber">
                {isRoleKey(invite.role) ? ROLES[invite.role as keyof typeof ROLES].label : invite.role}
              </span>
              .
            </p>
            {invite.expired && (
              <p className="text-error text-sm">This invite has expired. Ask the architect to resend.</p>
            )}
            <button
              className="btn-primary w-full"
              disabled={accepting || invite.expired}
              onClick={accept}
            >
              {accepting ? 'Accepting…' : 'Accept invitation'}
            </button>
            <p className="text-[12px] text-stone text-center">
              Already have an account?{' '}
              <Link
                href={`/login?invite_token=${encodeURIComponent(token)}&email=${encodeURIComponent(invite?.invite_email || '')}`}
                className="text-amber"
              >
                Sign in
              </Link>
              {' · '}
              Need an account? Accepting will take you to signup if you&apos;re not signed in.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
