import { createFileRoute } from '@tanstack/react-router'
import SignupClient from '@/components/auth/SignupClient'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
  head: () => ({
    meta: [
      { title: 'Create your 5Bloc account' },
      {
        name: 'description',
        content: 'Start your 5Bloc workspace — projects, drawings, site records and invoices for architect-led teams.',
      },
      { property: 'og:title', content: 'Create your 5Bloc account' },
      {
        property: 'og:description',
        content: 'Start your 5Bloc workspace — projects, drawings, site records and invoices for architect-led teams.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
})

function SignupPage() {
  return <SignupClient />
}
