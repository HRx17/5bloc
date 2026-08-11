/**
 * Next.js instrumentation hook — validates production env on server startup.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { assertServerEnv } = await import('./lib/env')
    assertServerEnv()
  }
}
