import React, { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useRouter } from '@/compat/next-navigation'
import { useToast } from '@/components/ui5/Toast'
import { ConfirmDialog } from '@/components/ui5/ConfirmDialog'
import { ErrorState } from '@/components/ui5/ErrorState'
import { Skeleton } from '@/components/ui5/Skeleton'
import { CalendarWidget } from '@/components/integrations/CalendarWidget'

type ProviderId = 'google' | 'autodesk'

interface IntegrationItem {
  id: string
  name: string
  provider: ProviderId
  providerLabel: string
  icon: string
  color: string
  description: string
  category: 'workspace' | 'communication' | 'engineering'
  /** Where in the app this integration's data is actually used. */
  surface?: { href: string; label: string }
}

interface ProviderState {
  configured: boolean
  connected: boolean
  missingEnv: string[]
  missingOptionalEnv: string[]
  account?: {
    email: string | null
    name: string | null
    connectedAt: string | null
    expiresAt: string | null
    driveFolders: { id: string; name: string }[]
  }
}

interface SyncResource {
  key: string
  label: string
  count?: number
  error?: string
}

interface SyncResult {
  syncedAt: string
  resources: SyncResource[]
}

const INTEGRATIONS: IntegrationItem[] = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    provider: 'google',
    providerLabel: 'Google',
    icon: 'cloud_queue',
    color: '#4285F4',
    description:
      'Link project folders from Drive and browse drawings, specs, and sheets straight from your document vault.',
    category: 'workspace',
    surface: { href: '/documents', label: 'Open Documents' },
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    provider: 'google',
    providerLabel: 'Google',
    icon: 'calendar_today',
    color: '#0F9D58',
    description:
      'Read site visits, inspections, and client meetings from your primary calendar, and push 5Bloc meetings back to it.',
    category: 'workspace',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    provider: 'google',
    providerLabel: 'Google',
    icon: 'mail',
    color: '#EA4335',
    description:
      'Read quotes, NOC approvals, and test certificates from your inbox next to the project they belong to.',
    category: 'communication',
    surface: { href: '/coordination', label: 'Open Coordination' },
  },
  {
    id: 'autodesk',
    name: 'Autodesk AutoCAD & Fusion 360',
    provider: 'autodesk',
    providerLabel: 'Autodesk',
    icon: 'architecture',
    color: '#D82424',
    description:
      'Upload DWG and RVT models to Autodesk Platform Services, translate them, and inspect 2D sheets and 3D models in-app.',
    category: 'engineering',
    surface: { href: '/cad', label: 'Open CAD viewer' },
  },
]

const CATEGORIES = [
  { id: 'all', label: 'All Integrations', icon: 'extension' },
  { id: 'workspace', label: 'Workspace Cloud', icon: 'cloud_queue' },
  { id: 'communication', label: 'Chats & Emails', icon: 'chat' },
  { id: 'engineering', label: 'CAD / BIM Systems', icon: 'architecture' },
] as const

const PROVIDER_LABEL: Record<ProviderId, string> = {
  google: 'Google Workspace',
  autodesk: 'Autodesk',
}

const EMPTY_PROVIDERS: Record<ProviderId, ProviderState> = {
  google: { configured: false, connected: false, missingEnv: [], missingOptionalEnv: [] },
  autodesk: { configured: false, connected: false, missingEnv: [], missingOptionalEnv: [] },
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Unknown'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Unknown'
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
}

function summarise(resources: SyncResource[]): string {
  const ok = resources.filter((r) => r.error === undefined)
  const failed = resources.filter((r) => r.error !== undefined)
  const counts = ok.map((r) => `${r.count ?? 0} ${r.label.toLowerCase()}`).join(', ')
  if (!failed.length) return counts || 'nothing to sync'
  return `${counts || 'nothing synced'} (${failed.length} failed)`
}

export default function IntegrationsPage() {
  const { toast } = useToast()
  const router = useRouter()

  const [providers, setProviders] = useState<Record<ProviderId, ProviderState>>(EMPTY_PROVIDERS)
  const [loading, setLoading] = useState(true)
  const [statusError, setStatusError] = useState<unknown>(null)
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]['id']>('all')
  const [syncing, setSyncing] = useState<ProviderId | 'all' | null>(null)
  const [syncResults, setSyncResults] = useState<Partial<Record<ProviderId, SyncResult>>>({})
  const [pendingDisconnect, setPendingDisconnect] = useState<IntegrationItem | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadStatus = useCallback(async () => {
    setLoading(true)
    setStatusError(null)
    try {
      const res = await fetch('/api/integrations/status')
      const data = (await res.json()) as { error?: string; providers?: Record<string, ProviderState> }
      if (!res.ok) throw new Error(data.error || 'Could not load integration status')
      setProviders({
        google: { ...EMPTY_PROVIDERS.google, ...(data.providers?.google ?? {}) },
        autodesk: { ...EMPTY_PROVIDERS.autodesk, ...(data.providers?.autodesk ?? {}) },
      })
    } catch (err) {
      setStatusError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  // Report the outcome of an OAuth round trip, then strip the params from the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const connected = params.get('connected')
    const error = params.get('error')
    if (!connected && !error) return

    const detail = params.get('msg') ? decodeURIComponent(params.get('msg')!) : ''

    if (connected === 'google') toast('Google Drive, Gmail and Calendar connected.', 'success', 5000)
    if (connected === 'autodesk') toast('Autodesk AutoCAD and Fusion 360 connected.', 'success', 5000)
    if (error === 'google_denied') toast('Google connection cancelled.', 'info')
    if (error === 'autodesk_denied') toast('Autodesk connection cancelled.', 'info')
    if (error === 'google_not_configured') {
      toast('Google is not configured on this server. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.', 'error', 9000)
    }
    if (error === 'autodesk_not_configured') {
      toast('Autodesk is not configured on this server. Add AUTODESK_CLIENT_ID and AUTODESK_CLIENT_SECRET.', 'error', 9000)
    }
    if (error === 'google_callback_failed') {
      toast(`Google connection failed${detail ? `: ${detail}` : '. Please try again.'}`, 'error', 9000)
    }
    if (error === 'autodesk_callback_failed') {
      toast(`Autodesk connection failed${detail ? `: ${detail}` : '. Please try again.'}`, 'error', 9000)
    }

    // Move router.replace into a microtask or next tick to avoid state update warning if triggered by toast
    // Actually router.replace is fine here, but if the toast causes a re-render it might be an issue.
    // Using a microtask just in case.
    Promise.resolve().then(() => {
      router.replace('/integrations', { scroll: false })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConnect = async (item: IntegrationItem) => {
    const state = providers[item.provider]
    if (!state.configured) {
      toast(
        `${PROVIDER_LABEL[item.provider]} is not configured on this server. Missing: ${
          state.missingEnv.join(', ') || 'OAuth credentials'
        }`,
        'error',
        9000,
      )
      return
    }
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    window.location.href = `/api/integrations/${item.provider}/connect${
      token ? `?t=${encodeURIComponent(token)}` : ''
    }`
  }

  const confirmDisconnect = async () => {
    if (!pendingDisconnect) return
    const provider = pendingDisconnect.provider
    setDisconnecting(true)
    try {
      const res = await fetch(`/api/integrations/${provider}/disconnect`, { method: 'POST' })
      if (!res.ok) throw new Error('Disconnect request failed')
      setSyncResults((prev) => ({ ...prev, [provider]: undefined }))
      await loadStatus()
      toast(`${PROVIDER_LABEL[provider]} disconnected.`, 'info')
      setPendingDisconnect(null)
    } catch {
      toast(`Could not disconnect ${PROVIDER_LABEL[provider]}. Please try again.`, 'error')
    } finally {
      setDisconnecting(false)
    }
  }

  const runSync = useCallback(
    async (provider: ProviderId): Promise<boolean> => {
      const res = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      const data = (await res.json()) as {
        error?: string
        syncedAt?: string
        resources?: SyncResource[]
      }

      if (!res.ok) {
        toast(data.error ?? `${PROVIDER_LABEL[provider]} sync failed.`, 'error', 9000)
        return false
      }

      const resources = data.resources ?? []
      setSyncResults((prev) => ({
        ...prev,
        [provider]: { syncedAt: data.syncedAt ?? new Date().toISOString(), resources },
      }))

      const failed = resources.filter((r) => r.error !== undefined)
      toast(
        `${PROVIDER_LABEL[provider]}: ${summarise(resources)}`,
        failed.length ? 'warning' : 'success',
        failed.length ? 8000 : 5000,
      )
      return true
    },
    [toast],
  )

  const handleSync = async (provider: ProviderId) => {
    setSyncing(provider)
    try {
      await runSync(provider)
    } catch {
      toast(`${PROVIDER_LABEL[provider]} sync failed. Check your connection and try again.`, 'error')
    } finally {
      setSyncing(null)
    }
  }

  const handleSyncAll = async () => {
    const connected = (Object.keys(providers) as ProviderId[]).filter((p) => providers[p].connected)
    if (!connected.length) {
      toast('Nothing to sync yet. Connect an integration first.', 'info')
      return
    }
    setSyncing('all')
    let succeeded = 0
    try {
      for (const provider of connected) {
        if (await runSync(provider)) succeeded += 1
      }
      if (succeeded === connected.length) {
        toast(`Resynced ${succeeded} of ${connected.length} integrations.`, 'success')
      }
    } finally {
      setSyncing(null)
    }
  }

  const connectedCount = (Object.keys(providers) as ProviderId[]).filter((p) => providers[p].connected).length
  const totalProviders = (Object.keys(providers) as ProviderId[]).length
  const syncedItems = Object.values(syncResults).reduce(
    (acc, result) =>
      acc + (result?.resources ?? []).reduce((sum, r) => sum + (r.error === undefined ? r.count ?? 0 : 0), 0),
    0,
  )
  const unconfigured = (Object.keys(providers) as ProviderId[]).filter((p) => !providers[p].configured)
  const hasSynced = Object.keys(syncResults).some((k) => syncResults[k as ProviderId])

  const filtered = INTEGRATIONS.filter((item) => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="page-m">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="page-m-title">Enterprise Integrations</h1>
          <p className="page-m-sub">
            Connect third-party accounts so documents, drawings, emails, and schedules stay in one place.
          </p>
        </div>

        <button
          onClick={handleSyncAll}
          disabled={syncing !== null || loading || !!statusError}
          className="btn-primary"
        >
          <span className={`material-icons-outlined text-[18px] ${syncing === 'all' ? 'animate-spin' : ''}`}>
            sync
          </span>
          {syncing === 'all' ? 'Resyncing...' : 'Resync all connected'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="card-m stat-m">
          <p className="stat-m-label">Linked accounts</p>
          <div className="flex items-end justify-between">
            <span className="stat-m-value">{connectedCount} / {totalProviders}</span>
            {connectedCount > 0 && <span className="chip-m chip-m-green">Active</span>}
          </div>
          <p className="stat-m-note">{connectedCount === totalProviders ? 'All accounts linked' : `${totalProviders - connectedCount} remaining`}</p>
        </div>

        <div className="card-m stat-m">
          <p className="stat-m-label">Last Sync Items</p>
          <div className="flex items-end justify-between">
            <span className="stat-m-value">{hasSynced ? syncedItems : '--'}</span>
            <span className="chip-m chip-m-blue">{hasSynced ? 'Live count' : 'Pending'}</span>
          </div>
          <p className="stat-m-note">{hasSynced ? 'Data fetched successfully' : 'Not synced yet'}</p>
        </div>

        <div className="card-m stat-m">
          <p className="stat-m-label">Server Config</p>
          <div className="flex items-center gap-3 mt-2">
            <div className={`w-3 h-3 rounded-full ${unconfigured.length === 0 ? 'bg-success' : 'bg-amber'}`} />
            <span className="text-[14px] font-semibold">
              {unconfigured.length === 0 ? 'Fully Configured' : `${unconfigured.length} Missing`}
            </span>
          </div>
          <p className="stat-m-note truncate">
            {unconfigured.length === 0 ? 'All providers ready' : unconfigured.map(p => PROVIDER_LABEL[p]).join(', ')}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex bg-surface-container-low rounded-lg p-0.5 border border-hairline w-fit">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
                activeCategory === cat.id 
                  ? 'bg-surface-elevated text-amber shadow-sm border border-hairline-strong' 
                  : 'text-stone hover:text-on-surface'
              }`}
            >
              <span className="material-icons-outlined text-[16px]">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        <div className="search-5bloc w-full md:w-64">
          <span className="material-icons-outlined">search</span>
          <input 
            type="text" 
            placeholder="Search integrations…" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {!!statusError && (
        <div className="mb-8">
          <ErrorState
            title="Connection Status Unavailable"
            error={statusError}
            onRetry={loadStatus}
          />
        </div>
      )}

      {loading && !statusError ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item) => {
            const state = providers[item.provider]
            const result = syncResults[item.provider]
            const isBusy = syncing === item.provider || syncing === 'all'

            return (
              <div key={item.id} className="card-m overflow-hidden flex flex-col">
                <div className="card-m-head">
                  <div className="flex items-center gap-3">
                    <div className="feed-m-icon" style={{ color: item.color, background: `color-mix(in srgb, ${item.color} 10%, transparent)` }}>
                      <span className="material-icons-outlined">{item.icon}</span>
                    </div>
                    <div>
                      <h3 className="card-m-title">{item.name}</h3>
                      <p className="text-[11px] text-stone uppercase font-bold tracking-tight">{item.providerLabel}</p>
                    </div>
                  </div>
                  {state.connected ? (
                    <span className="chip-m chip-m-green">Connected</span>
                  ) : (
                    <span className="chip-m">Not Linked</span>
                  )}
                </div>
                
                <div className="p-5 flex-1">
                  <p className="text-[13.5px] leading-relaxed text-on-surface-variant mb-6">
                    {item.description}
                  </p>
                  
                  {state.connected && (
                    <div className="bg-surface-container-low rounded-xl p-3 mb-6 border border-hairline">
                      <div className="flex items-center justify-between text-[12px] mb-2">
                        <span className="text-stone font-medium">Account</span>
                        <span className="font-semibold">{state.account?.email || 'Active'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-stone font-medium">Last Sync</span>
                        <span className="font-semibold">{result?.syncedAt ? formatDate(result.syncedAt) : 'Never'}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {!state.connected ? (
                      <button 
                        className="btn-primary w-full" 
                        onClick={() => handleConnect(item)}
                        disabled={!state.configured}
                      >
                        Connect {item.providerLabel}
                      </button>
                    ) : (
                      <>
                        <button
                          className="btn-secondary flex-1"
                          onClick={() => handleSync(item.provider)}
                          disabled={isBusy}
                        >
                          <span className={`material-icons-outlined text-[16px] ${isBusy ? 'animate-spin' : ''}`}>sync</span>
                          Sync Now
                        </button>
                        <button
                          className="btn-ghost-error btn-icon"
                          onClick={() => setPendingDisconnect(item)}
                          title="Disconnect"
                        >
                          <span className="material-icons-outlined text-[18px]">link_off</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {providers.google.connected && (activeCategory === 'all' || activeCategory === 'workspace') && (
        <div className="mt-8 pt-8 border-t border-hairline">
          <h2 className="card-m-title mb-6 px-1">Calendar Overview</h2>
          <CalendarWidget />
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDisconnect}
        title={`Disconnect ${pendingDisconnect?.providerLabel}?`}
        message={`This will stop 5Bloc from reading your ${pendingDisconnect?.name} data. You can reconnect at any time.`}
        confirmLabel={disconnecting ? 'Disconnecting...' : 'Disconnect'}
        onConfirm={confirmDisconnect}
        onCancel={() => setPendingDisconnect(null)}
        variant="danger"
      />
    </div>
  )
}
