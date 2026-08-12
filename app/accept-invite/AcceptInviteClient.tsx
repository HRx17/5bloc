'use client'

import React, { useCallback, useEffect, useState } from 'react'
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

  const loadInvite = useCallback(() => {
    if (!token) {
      setError('This link is missing its invite code. Ask whoever invited you to send it again.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    fetch(`/api/invites/accept?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'This invitation is no longer valid.')
        setInvite(data.invite)
      })
      .catch((e) =>
        setError(
          /failed to fetch|networkerror/i.test(e?.message || '')
            ? 'Could not reach the server. Check your connection and try again.'
            : e.message
        )
      )
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    loadInvite()
  }, [loadInvite])

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

        {loading && (
          <div className="mt-6 space-y-3" aria-busy="true">
            <span className="sr-only">Loading your invitation…</span>
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-white/10" />
          </div>
        )}

        {!loading && error && (
          <div className="mt-6" role="alert">
            <p className="text-error text-sm">{error}</p>
            <p className="text-[12px] text-stone mt-2 leading-relaxed">
              Invitations expire after a while and can only be used once. If yours has run out, ask the
              architect to send a new one.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {token && (
                <button type="button" onClick={loadInvite} className="btn-secondary btn-sm">
                  Try again
                </button>
              )}
              <Link href="/login" className="btn-secondary btn-sm">
                Sign in
              </Link>
              <Link href="/" className="btn-secondary btn-sm">
                Go home
              </Link>
            </div>
          </div>
        )}

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
