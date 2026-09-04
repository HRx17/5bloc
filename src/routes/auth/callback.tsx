import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen'
import { supabase } from '@/integrations/supabase/client'
import { safeRedirectPath } from '@/lib/auth/safe-redirect'

export const Route = createFileRoute('/auth/callback')({
  ssr: false,
  component: AuthCallbackPage,
  head: () => ({
    meta: [
      { title: 'Signing you in — 5Bloc' },
      { name: 'description', content: 'Completing your 5Bloc sign-in.' },
      { property: 'og:title', content: 'Signing you in — 5Bloc' },
      { property: 'og:description', content: 'Completing your 5Bloc sign-in.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
})

function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const finish = async () => {
      const params = new URLSearchParams(window.location.search)
      const errorCode = params.get('error_code') || params.get('error')
      if (errorCode) {
        void router.navigate({ href: `/login?error=${encodeURIComponent(errorCode)}` })
        return
      }

      const next = safeRedirectPath(params.get('next'), '/dashboard')

      // The client library completes the exchange from the URL on load.
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const { data } = await supabase.auth.getSession()
        if (cancelled) return
        if (data.session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarded_at')
            .eq('auth_id', data.session.user.id)
            .maybeSingle()
          const dest = profile?.onboarded_at ? next : '/onboarding'
          void router.navigate({ href: dest })
          return
        }
        await new Promise((resolve) => setTimeout(resolve, 250))
      }

      if (!cancelled) void router.navigate({ href: '/login?error=auth_callback_failed' })
    }

    void finish()
    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <AuthLoadingScreen message="Signing you in…" submessage="Connecting your account" />
  )
}
