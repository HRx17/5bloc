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

const isProd = process.env.NODE_ENV === 'production'

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://apis.google.com https://accounts.google.com https://*.posthog.com https://browser.sentry-cdn.com https://developer.api.autodesk.com https://in.heycatch.ai",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://developer.api.autodesk.com",
  "font-src 'self' https://fonts.gstatic.com data: https://developer.api.autodesk.com",
  "img-src 'self' data: blob: https:",
  // Autodesk APS: viewer SDK + OSS signed uploads land on S3 buckets
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://*.razorpay.com https://*.googleapis.com https://oauth2.googleapis.com https://accounts.google.com https://*.r2.cloudflarestorage.com https://api.resend.com https://*.posthog.com https://*.sentry.io https://api.anthropic.com https://developer.api.autodesk.com https://*.autodesk.com https://*.s3.amazonaws.com https://*.s3.us-east-1.amazonaws.com https://*.s3.us-west-2.amazonaws.com https://s3.amazonaws.com https://in.heycatch.ai",
  "frame-src 'self' blob: https://checkout.razorpay.com https://*.razorpay.com https://accounts.google.com https://docs.google.com https://drive.google.com https://*.supabase.co https://*.r2.cloudflarestorage.com https://*.cloudflarestorage.com https://developer.api.autodesk.com",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const securityHeaders: { key: string; value: string }[] = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(self)' },
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
]

if (isProd) {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  })
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow Cursor browser / local tooling on 127.0.0.1 during `next dev`
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  async redirects() {
    return [
      {
        source: '/:l([a-z0-9])',
        destination: '/?utm_source=heycatch&utm_campaign=:l',
        permanent: false,
      },
    ]
  },
}

export default withPWA(nextConfig)
