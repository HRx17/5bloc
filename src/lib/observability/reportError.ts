/**
 * Lightweight error reporting — no Sentry SDK.
 * Always logs to console; optionally POSTs a Sentry envelope when a DSN is set.
 */

type ReportContext = Record<string, unknown>

function parseSentryDsn(dsn: string): {
  publicKey: string
  host: string
  projectId: string
} | null {
  try {
    const url = new URL(dsn)
    const publicKey = url.username
    const projectId = url.pathname.replace(/^\//, '').split('/')[0]
    if (!publicKey || !projectId) return null
    return { publicKey, host: url.host, projectId }
  } catch {
    return null
  }
}

function toError(err: unknown): Error {
  if (err instanceof Error) return err
  return new Error(typeof err === 'string' ? err : JSON.stringify(err))
}

function resolveDsn(): string {
  const clientDsn =
    (import.meta as any)?.env?.VITE_SENTRY_DSN ||
    (import.meta as any)?.env?.VITE_PUBLIC_SENTRY_DSN ||
    ''
  if (typeof clientDsn === 'string' && clientDsn.trim()) return clientDsn.trim()
  if (typeof process !== 'undefined') {
    return (process.env['SENTRY_DSN'] || '').trim()
  }
  return ''
}

/** Report an error to console and optionally Sentry (env-gated). */
export async function reportError(err: unknown, context?: ReportContext): Promise<void> {
  const error = toError(err)
  console.error('[5bloc]', error, context ?? '')

  const dsn = resolveDsn()
  if (!dsn || typeof fetch === 'undefined') return

  const parsed = parseSentryDsn(dsn)
  if (!parsed) return

  const { publicKey, host, projectId } = parsed
  const eventId = crypto.randomUUID?.() ?? `${Date.now()}`
  const timestamp = new Date().toISOString()

  const header = { event_id: eventId, dsn, sent_at: timestamp }
  const itemHeader = { type: 'event', content_type: 'application/json' }
  const payload = {
    event_id: eventId,
    timestamp,
    platform: 'javascript',
    level: 'error',
    exception: {
      values: [
        {
          type: error.name || 'Error',
          value: error.message,
          stacktrace: error.stack
            ? { frames: error.stack.split('\n').slice(0, 20).map((line) => ({ filename: line.trim() })) }
            : undefined,
        },
      ],
    },
    tags: { source: '5bloc-web' },
    extra: context ?? {},
  }

  const body = `${JSON.stringify(header)}\n${JSON.stringify(itemHeader)}\n${JSON.stringify(payload)}\n`
  const envelopeUrl = `https://${host}/api/${projectId}/envelope/?sentry_version=7&sentry_key=${encodeURIComponent(publicKey)}`

  try {
    await fetch(envelopeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      body,
      keepalive: true,
    })
  } catch {
    // never throw from reporter
  }
}
