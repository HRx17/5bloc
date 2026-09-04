import { createFileRoute } from '@tanstack/react-router'
import OnboardingClient from '@/components/auth/OnboardingClient'

export const Route = createFileRoute('/onboarding')({
  ssr: false,
  component: OnboardingPage,
  head: () => ({
    meta: [
      { title: 'Set up your 5Bloc workspace' },
      {
        name: 'description',
        content: 'Tell us about your practice so 5Bloc can set up your workspace, team and projects.',
      },
      { property: 'og:title', content: 'Set up your 5Bloc workspace' },
      {
        property: 'og:description',
        content: 'Tell us about your practice so 5Bloc can set up your workspace, team and projects.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
})

function OnboardingPage() {
  return <OnboardingClient />
}
