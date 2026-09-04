import { createFileRoute } from '@tanstack/react-router'
import AdminPage from '@/components/app/AdminPage'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: 'Admin Sign In | 5BLOC' },
      { name: 'description', content: 'Administrator sign in for the 5BLOC construction platform.' },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: 'Admin Sign In | 5BLOC' },
      { property: 'og:description', content: 'Administrator sign in for 5BLOC.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
})
