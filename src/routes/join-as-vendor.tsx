import { createFileRoute } from '@tanstack/react-router'
import JoinAsVendorPage from '@/components/app/JoinAsVendorPage'

export const Route = createFileRoute('/join-as-vendor')({
  component: JoinAsVendorPage,
  head: () => ({
    meta: [
      { title: 'Join as a Material Vendor | 5BLOC' },
      {
        name: 'description',
        content:
          'List your building materials business on 5BLOC and reach architects and builders sourcing for live projects.',
      },
      { property: 'og:title', content: 'Join as a Material Vendor | 5BLOC' },
      {
        property: 'og:description',
        content: 'Reach architects and builders sourcing materials for live projects.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
})
