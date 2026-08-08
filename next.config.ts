import type { NextConfig } from 'next'

// We use require to bypass import type issues with next-pwa on different Next.js versions
const withPWA = require('next-pwa')({
  dest:        'public',
  register:    true,
  skipWaiting: true,
  disable:     process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.r2\.cloudflarestorage\.com\/.*/i,
      handler:    'CacheFirst',
      options:    { cacheName: 'r2-files', expiration: { maxEntries: 50, maxAgeSeconds: 604800 } },
    },
    {
      urlPattern: /\/api\/projects(\/.*)?$/,
      handler:    'NetworkFirst',
      options:    { cacheName: 'api-projects', networkTimeoutSeconds: 3 },
    },
  ],
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Expose deploy metadata + enable demo role login for device testing.
  // Set NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false in Vercel to disable.
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? '',
    NEXT_PUBLIC_ENABLE_DEMO_LOGIN: process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN ?? 'true',
  },
}

export default withPWA(nextConfig)
