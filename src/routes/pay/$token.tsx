import { createFileRoute } from '@tanstack/react-router'
import PayTokenPage from '@/components/app/PayTokenPage'

export const Route = createFileRoute('/pay/$token')({
  component: PayTokenPage,
  head: () => ({
    meta: [
      { title: 'Pay Invoice | 5BLOC' },
      {
        name: 'description',
        content: 'Securely view and pay your architecture project invoice online.',
      },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: 'Pay Invoice | 5BLOC' },
      { property: 'og:description', content: 'View and pay your project invoice online.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
})
