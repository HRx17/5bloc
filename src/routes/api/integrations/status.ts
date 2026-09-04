import { createFileRoute } from '@tanstack/react-router'
import { createSupabaseServer } from '@/lib/supabase/server'
import { listConnections } from '@/lib/integrations/token-store'
import { getAllProviderStatus } from '@/lib/integrations/config'

export const dynamic = 'force-dynamic'

export interface IntegrationsStatus {
  connected: string[]
  providers: Record<string, {
    configured:         boolean
    missingEnv:         string[]
    missingOptionalEnv: string[]
    connected:          boolean
    account?: {
      email:       string | null
      name:        string | null
      connectedAt: string | null
      expiresAt:   string | null
      driveFolders: { id: string; name: string }[]
    }
  }>
}

const handleGET = async ({ request }: any) => {
  const providerStatus = getAllProviderStatus()

  // Env-derived config is safe to report even when the session lookup fails, so the
  // page can still explain *why* an integration is unavailable.
  const base: IntegrationsStatus = {
    connected: [],
    providers: Object.fromEntries(
      Object.entries(providerStatus).map(([id, s]) => [id, { ...s, connected: false }])
    ),
  }

  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return json(base)

    const connections = await listConnections(user.id)

    for (const conn of connections) {
      const entry = base.providers[conn.provider]
      if (!entry) continue
      const meta = conn.metadata as { driveFolders?: { id: string; name: string }[] }
      entry.connected = true
      entry.account = {
        email:        conn.provider_email,
        name:         conn.provider_name,
        connectedAt:  conn.connected_at,
        expiresAt:    conn.expires_at,
        driveFolders: meta?.driveFolders ?? [],
      }
    }

    base.connected = connections.map((c) => c.provider)
    return json(base)
  } catch (e) {
    console.error('Integrations status error:', e)
    return json(base)
  }
}

export const Route = createFileRoute('/api/integrations/status')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})
