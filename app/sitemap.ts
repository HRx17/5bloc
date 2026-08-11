import type { MetadataRoute } from 'next'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.5bloc.com').replace(/\/$/, '')

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Public marketing pages that exist under app/
  const paths = [
    '/',
    '/privacy',
    '/terms',
    '/list-your-business',
    '/join-as-vendor',
  ] as const

  return paths.map((path) => ({
    url: `${APP_URL}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.6,
  }))
}
