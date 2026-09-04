import { createFileRoute } from '@tanstack/react-router'
import ListYourBusinessPage from '@/components/app/ListYourBusinessPage'

export const Route = createFileRoute('/list-your-business')({
  component: ListYourBusinessPage,
  head: () => ({
    meta: [
      { title: 'List Your Contracting Business | 5BLOC' },
      {
        name: 'description',
        content:
          'Get discovered by architects and builders. List your contracting business on the 5BLOC marketplace and receive tender invitations.',
      },
      { property: 'og:title', content: 'List Your Contracting Business | 5BLOC' },
      {
        property: 'og:description',
        content: 'Get discovered by architects and builders hiring contractors.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
})
