import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.5bloc.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/pricing', '/privacy', '/terms', '/list-your-business', '/join-as-vendor'],
      disallow: [
        '/dashboard',
        '/api',
        '/login',
        '/admin',
        '/signup',
        '/onboarding',
        '/portal',
        '/projects',
        '/settings',
        '/messages',
        '/clients',
        '/invoices',
        '/ai',
        '/cad',
        '/marketplace',
        '/coordination',
        '/documents',
        '/integrations',
      ],
    },
    sitemap: `${APP_URL.replace(/\/$/, '')}/sitemap.xml`,
  }
}
