import { createFileRoute } from '@tanstack/react-router'
import AcceptInvitePage from '@/components/app/AcceptInvitePage'

export const Route = createFileRoute('/accept-invite')({
  component: AcceptInvitePage,
  head: () => ({
    meta: [
      { title: 'Accept Project Invitation | 5BLOC' },
      {
        name: 'description',
        content: 'Accept your invitation and join the project team on 5BLOC.',
      },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: 'Accept Project Invitation | 5BLOC' },
      { property: 'og:description', content: 'Join the project team you were invited to.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
})
