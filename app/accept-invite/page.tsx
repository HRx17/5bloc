'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/brand/LogoMark'
import { createSupabaseClient } from '@/lib/supabase/client'

function AcceptInviteInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [invite, setInvite] = useState<{ email: string; orgName: string; userRole: string | null } | null>(null)
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState(false)

  const acceptInvite = useCallback(async () => {
    if (!token) return
    setAccepting(true)
    setError('')
    try {
      const res = await fetch('/api/org/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Could not accept invite')
        return
      }
      localStorage.removeItem('5bloc_invite_token')
      setAccepted(true)
      setTimeout(() => router.replace('/dashboard'), 1200)
    } catch {
      setError('Could not accept invite')
    } finally {
      setAccepting(false)
    }
  }, [token, router])

  useEffect(() => {
    if (!token) {
      setError('Missing invite link')
      setLoading(false)
      return
    }
    localStorage.setItem('5bloc_invite_token', token)
    ;(async () => {
      try {
        const supabase = createSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.email) setSessionEmail(session.user.email.toLowerCase())

        const res = await fetch(`/api/org/invites/lookup?token=${encodeURIComponent(token)}`)
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'Invite not found')
        } else {
          setInvite(json)
        }
      } catch {
        setError('Could not load invite')
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-canvas)' }}>
        <p className="text-[13px]" style={{ color: 'var(--stone)' }}>Loading invite…</p>
      </div>
    )
  }

  const emailMatches =
    sessionEmail && invite && sessionEmail === invite.email.toLowerCase()

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: 'var(--surface-canvas)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{ background: 'var(--surface-container)', boxShadow: 'inset 0 0 0 1px var(--hairline), var(--shadow-3)' }}
      >
        <Logo size={32} showTagline={false} color="var(--on-surface)" />
        {accepted ? (
          <>
            <h1 className="text-xl font-semibold mt-6 mb-2" style={{ color: 'var(--on-surface)' }}>You&apos;re in!</h1>
            <p className="text-[13px]" style={{ color: 'var(--stone)' }}>Redirecting to your workspace…</p>
          </>
        ) : error ? (
          <>
            <h1 className="text-xl font-semibold mt-6 mb-2" style={{ color: 'var(--on-surface)' }}>Invite unavailable</h1>
            <p className="text-[13px] mb-6" style={{ color: 'var(--stone)' }}>{error}</p>
            <Link href="/signup" className="btn-primary">Create account</Link>
          </>
        ) : invite ? (
          <>
            <h1 className="text-xl font-semibold mt-6 mb-2" style={{ color: 'var(--on-surface)' }}>
              Join {invite.orgName}
            </h1>
            <p className="text-[13px] mb-6" style={{ color: 'var(--stone)' }}>
              You&apos;ve been invited to collaborate on 5Bloc
              {invite.userRole ? ` as ${invite.userRole.replace(/_/g, ' ')}` : ''}.
              {sessionEmail
                ? emailMatches
                  ? ' Accept below to join the workspace.'
                  : ` Sign in as ${invite.email} to accept.`
                : ` Sign up with ${invite.email}.`}
            </p>
            <div className="flex flex-col gap-2">
              {sessionEmail ? (
                emailMatches ? (
                  <button
                    type="button"
                    onClick={() => void acceptInvite()}
                    disabled={accepting}
                    className="btn-primary"
                  >
                    {accepting ? 'Joining…' : 'Accept invite'}
                  </button>
                ) : (
                  <>
                    <Link
                      href={`/login?next=${encodeURIComponent(`/accept-invite?token=${encodeURIComponent(token)}`)}`}
                      className="btn-primary"
                    >
                      Sign in as {invite.email}
                    </Link>
                    <p className="text-[11px]" style={{ color: 'var(--stone)' }}>
                      Currently signed in as {sessionEmail}
                    </p>
                  </>
                )
              ) : (
                <>
                  <Link
                    href={`/signup?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(invite.email)}`}
                    className="btn-primary"
                  >
                    Accept &amp; sign up
                  </Link>
                  <Link
                    href={`/login?next=${encodeURIComponent(`/accept-invite?token=${encodeURIComponent(token)}`)}`}
                    className="btn-secondary"
                  >
                    I already have an account
                  </Link>
                </>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteInner />
    </Suspense>
  )
}
