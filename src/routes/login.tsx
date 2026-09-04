import { createFileRoute } from '@tanstack/react-router'
import LoginClient from '@/components/auth/LoginClient'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: 'Log in — 5Bloc' },
      {
        name: 'description',
        content: 'Sign in to your 5Bloc workspace to manage projects, drawings, clients and invoices.',
      },
      { property: 'og:title', content: 'Log in — 5Bloc' },
      {
        property: 'og:description',
        content: 'Sign in to your 5Bloc workspace to manage projects, drawings, clients and invoices.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'robots', content: 'noindex, follow' },
    ],
  }),
})

function LoginPage() {
  return <LoginClient />
}
