import { createFileRoute } from '@tanstack/react-router'
import PortalTokenPage from '@/components/app/PortalTokenPage'

export const Route = createFileRoute('/portal/$token')({
  component: PortalTokenPage,
  head: () => ({
    meta: [
      { title: 'Client Portal | 5BLOC' },
      {
        name: 'description',
        content:
          'Review drawings, approve documents and ask your architect questions from your private project portal.',
      },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: 'Client Portal | 5BLOC' },
      {
        property: 'og:description',
        content: 'Review drawings, approve documents and message your architect.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
})
