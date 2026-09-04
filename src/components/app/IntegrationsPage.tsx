import React, { useCallback, useEffect, useState } from 'react'
import Link from '@/compat/next-link'
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

function formatTime(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Just now'
  return d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })
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
  const [detailsFor, setDetailsFor] = useState<IntegrationItem | null>(null)
  const [pendingDisconnect, setPendingDisconnect] = useState<IntegrationItem | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

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

    router.replace('/integrations', { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConnect = (item: IntegrationItem) => {
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
    window.location.href = `/api/integrations/${item.provider}/connect`
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
        // eslint-disable-next-line no-await-in-loop
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

  const filtered =
    activeCategory === 'all' ? INTEGRATIONS : INTEGRATIONS.filter((item) => item.category === activeCategory)

  const showCalendarWidget = providers.google.connected && (activeCategory === 'all' || activeCategory === 'workspace')

  return (
    <div className="p-6 space-y-8 max-w-screen-xl mx-auto font-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="label-sm mb-1" style={{ color: 'var(--stone)' }}>
            System Automation
          </p>
          <h1
            className="font-display text-[22px] lg:text-[26px] leading-[30px]"
            style={{ color: 'var(--on-surface)' }}
          >
            Enterprise Integrations
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--on-surface-variant)' }}>
            Connect third-party accounts so documents, drawings, emails, and schedules stay in one place.
          </p>
        </div>

        <button
          onClick={handleSyncAll}
          disabled={syncing !== null || loading || !!statusError}
          className="btn-primary shrink-0 py-2.5 px-5 flex items-center gap-2"
        >
          <span className={`material-icons-outlined text-[16px] ${syncing === 'all' ? 'animate-spin' : ''}`}>
            sync
          </span>
          {syncing === 'all' ? 'Resyncing...' : 'Resync connected'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-glass" style={{ padding: '16px 20px', borderRadius: '12px' }}>
          <p className="label-sm text-[10px]" style={{ color: 'var(--stone)' }}>
            Linked accounts
          </p>
          <div className="flex items-center gap-2.5 mt-2">
            <span className="text-[22px] font-medium" style={{ color: 'var(--on-surface)' }}>
              {connectedCount} / {totalProviders}
            </span>
            {connectedCount > 0 && (
              <span className="chip" style={{ background: 'rgba(111,220,140,.12)', color: 'var(--success)' }}>
                Active
              </span>
            )}
          </div>
        </div>

        <div className="card-glass" style={{ padding: '16px 20px', borderRadius: '12px' }}>
          <p className="label-sm text-[10px]" style={{ color: 'var(--stone)' }}>
            Items seen in last sync
          </p>
          <div className="flex items-center gap-2.5 mt-2">
            <span className="text-[22px] font-medium" style={{ color: 'var(--on-surface)' }}>
              {hasSynced ? syncedItems : '--'}
            </span>
            <span className="chip" style={{ background: 'rgba(122,184,255,.12)', color: 'var(--blue)' }}>
              {hasSynced ? 'Live count' : 'Not synced yet'}
            </span>
          </div>
        </div>

        <div className="card-glass" style={{ padding: '16px 20px', borderRadius: '12px' }}>
          <p className="label-sm text-[10px]" style={{ color: 'var(--stone)' }}>
            Server credentials
          </p>
          <div className="flex items-center gap-2.5 mt-2">
            <span className="text-[12px] font-medium truncate" style={{ color: 'var(--on-surface)' }}>
              {statusError
                ? 'Status unavailable'
                : loading
                  ? 'Checking...'
                  : unconfigured.length === 0
                    ? 'All providers configured'
                    : `${unconfigured.map((p) => PROVIDER_LABEL[p]).join(', ')} not configured`}
            </span>
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                background: statusError
                  ? 'var(--error)'
                  : loading
                    ? 'var(--stone)'
                    : unconfigured.length === 0
                      ? 'var(--success)'
                      : 'var(--warning, var(--amber))',
              }}
            />
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap border-b pb-px gap-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="px-4 py-3 text-xs font-semibold relative transition flex items-center gap-2"
            style={{
              color: activeCategory === cat.id ? 'var(--amber)' : 'var(--stone)',
              boxShadow: activeCategory === cat.id ? 'inset 0 -2px 0 var(--amber-dk)' : 'none',
            }}
          >
            <span className="material-icons-outlined text-[15px]">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {statusError ? (
        <ErrorState
          title="Could not check your connected accounts"
          error={statusError}
          description="Nothing has been disconnected — we just could not read the current status. Connecting or syncing now could behave unexpectedly."
          onRetry={loadStatus}
        />
      ) : null}

      {loading && !statusError && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      )}

      {/* Integration cards */}
      {!loading && !statusError && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((item) => {
          const state = providers[item.provider]
          const result = syncResults[item.provider]
          const isBusy = syncing === item.provider || syncing === 'all'

          return (
            <div
              key={item.id}
              className="card-5bloc flex flex-col justify-between relative overflow-hidden"
              style={{
                borderRadius: '16px',
                border: `1px solid ${
                  state.connected ? `color-mix(in srgb, ${item.color} 20%, transparent)` : 'rgba(159,142,122,0.08)'
                }`,
                boxShadow: 'var(--shadow-2)',
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: state.connected ? item.color : 'rgba(255,255,255,0.06)' }}
              />

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 flex items-center justify-center rounded-xl shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${item.color} ${state.connected ? 18 : 10}%, transparent)`,
                        color: item.color,
                      }}
                    >
                      <span className="material-icons-outlined text-[18px]">{item.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-[14px] font-medium leading-tight" style={{ color: 'var(--on-surface)' }}>
                        {item.name}
                      </h3>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--stone)' }}>
                        Provider: {item.providerLabel}
                      </p>
                    </div>
                  </div>

                  <span
                    className="px-3 py-1 rounded-full text-[10px] font-bold uppercase shrink-0"
                    style={
                      loading
                        ? { background: 'rgba(255,255,255,0.05)', color: 'var(--stone)' }
                        : state.connected
                          ? {
                              background: 'rgba(46,204,138,0.12)',
                              color: 'var(--success)',
                              border: '1px solid rgba(46,204,138,0.25)',
                            }
                          : state.configured
                            ? {
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--stone)',
                                border: '1px solid rgba(255,255,255,0.08)',
                              }
                            : {
                                background: 'rgba(245,166,35,0.10)',
                                color: 'var(--amber)',
                                border: '1px solid rgba(245,166,35,0.25)',
                              }
                    }
                  >
                    {loading
                      ? 'Checking'
                      : state.connected
                        ? 'Connected'
                        : state.configured
                          ? 'Not connected'
                          : 'Setup required'}
                  </span>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                  {item.description}
                </p>

                {state.connected && state.account && (
                  <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--stone)' }}>
                    <span className="material-icons-outlined text-[13px]">account_circle</span>
                    {state.account.email || state.account.name || `Connected via ${item.providerLabel} OAuth`}
                  </p>
                )}

                {!state.configured && !loading && (
                  <div
                    className="rounded-xl px-3 py-2.5 text-[11px] leading-relaxed"
                    style={{ background: 'rgba(245,166,35,0.08)', color: 'var(--on-surface-variant)' }}
                  >
                    This server has no {item.providerLabel} credentials. Add{' '}
                    {state.missingEnv.length ? (
                      state.missingEnv.map((name, i) => (
                        <React.Fragment key={name}>
                          {i > 0 && ' and '}
                          <code style={{ color: 'var(--amber)' }}>{name}</code>
                        </React.Fragment>
                      ))
                    ) : (
                      <code style={{ color: 'var(--amber)' }}>OAuth credentials</code>
                    )}{' '}
                    to the environment, then restart the app.
                  </div>
                )}

                {result && (
                  <div className="space-y-1">
                    {result.resources.map((r) => (
                      <p key={r.key} className="text-[11px] flex items-start gap-1.5">
                        <span
                          className="material-icons-outlined text-[13px] shrink-0"
                          style={{ color: r.error ? 'var(--error)' : 'var(--success)' }}
                        >
                          {r.error ? 'error_outline' : 'check_circle'}
                        </span>
                        <span style={{ color: r.error ? 'var(--error)' : 'var(--on-surface-variant)' }}>
                          {r.error ? `${r.label}: ${r.error}` : `${r.count ?? 0} ${r.label.toLowerCase()}`}
                        </span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                className="mt-6 pt-4 flex items-center justify-between gap-3 flex-wrap"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] block" style={{ color: 'var(--stone)' }}>
                    LAST SYNC
                  </span>
                  <span className="font-mono text-[11px] font-semibold" style={{ color: 'var(--on-surface)' }}>
                    {result ? formatTime(result.syncedAt) : 'Never'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {state.connected ? (
                    <>
                      <button
                        onClick={() => setDetailsFor(item)}
                        className="btn-secondary py-1.5 px-3 text-[11px] font-bold rounded-lg"
                      >
                        Details
                      </button>
                      {item.surface && (
                        <Link
                          href={item.surface.href}
                          className="btn-secondary py-1.5 px-3 text-[11px] font-bold rounded-lg flex items-center gap-1"
                        >
                          <span className="material-icons-outlined text-[13px]">open_in_new</span>
                          Open
                        </Link>
                      )}
                      <button
                        onClick={() => handleSync(item.provider)}
                        disabled={isBusy}
                        className="btn-ghost-amber py-1.5 px-3 text-[11px] font-bold rounded-lg flex items-center gap-1"
                      >
                        <span className={`material-icons-outlined text-[13px] ${isBusy ? 'animate-spin' : ''}`}>
                          sync
                        </span>
                        {isBusy ? 'Syncing' : 'Sync'}
                      </button>
                      <button
                        onClick={() => setPendingDisconnect(item)}
                        className="btn-ghost-error py-1.5 px-3 text-[11px] font-bold rounded-lg"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(item)}
                      disabled={loading}
                      className={state.configured ? 'btn-primary py-1.5 px-4 text-[11px] font-bold rounded-lg' : 'btn-secondary py-1.5 px-4 text-[11px] font-bold rounded-lg'}
                    >
                      {state.configured ? `Connect ${item.providerLabel}` : 'Setup required'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {/* Live calendar preview - the Calendar integration has no other surface yet */}
      {showCalendarWidget && (
        <div className="card-5bloc relative" style={{ borderRadius: '16px', boxShadow: 'var(--shadow-2)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="label-sm" style={{ color: 'var(--stone)' }}>
                Google Calendar
              </p>
              <h2 className="text-[14px] font-medium" style={{ color: 'var(--on-surface)' }}>
                Next 30 days
              </h2>
            </div>
            <span className="material-icons-outlined text-[18px]" style={{ color: '#0F9D58' }}>
              event
            </span>
          </div>
          <CalendarWidget className="max-h-[320px]" />
        </div>
      )}

      {/* Details panel - real connection facts only, nothing editable that is not persisted */}
      {detailsFor && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-6"
          style={{ background: 'var(--scrim)', backdropFilter: 'blur(6px)' }}
          onClick={() => setDetailsFor(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden flex flex-col"
            style={{ borderRadius: '24px', background: 'var(--surface-container)', boxShadow: 'var(--shadow-4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-[18px]" style={{ color: detailsFor.color }}>
                  {detailsFor.icon}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--on-surface)' }}>
                  {detailsFor.name}
                </span>
              </div>
              <button onClick={() => setDetailsFor(null)} style={{ color: 'var(--stone)' }} aria-label="Close">
                <span className="material-icons-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-[12px]">
              {(() => {
                const state = providers[detailsFor.provider]
                const account = state.account
                const rows: { label: string; value: string }[] = [
                  { label: 'Account', value: account?.email || account?.name || 'Unknown' },
                  { label: 'Connected on', value: formatDate(account?.connectedAt) },
                  { label: 'Access token renews', value: formatDate(account?.expiresAt) },
                ]

                return (
                  <>
                    <div className="space-y-2">
                      {rows.map((row) => (
                        <div key={row.label} className="flex items-baseline justify-between gap-4">
                          <span style={{ color: 'var(--stone)' }}>{row.label}</span>
                          <span className="text-right font-medium" style={{ color: 'var(--on-surface)' }}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {detailsFor.provider === 'google' && (
                      <div>
                        <p className="mb-2" style={{ color: 'var(--stone)' }}>
                          Linked Drive folders
                        </p>
                        {account?.driveFolders?.length ? (
                          <ul className="space-y-1.5">
                            {account.driveFolders.map((folder) => (
                              <li
                                key={folder.id}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)' }}
                              >
                                <span className="material-icons-outlined text-[14px]" style={{ color: 'var(--stone)' }}>
                                  folder
                                </span>
                                <span className="truncate">{folder.name}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ color: 'var(--on-surface-variant)' }}>
                            None yet. Open <strong>Documents</strong> and link a project folder to expose it to 5Bloc.
                          </p>
                        )}
                        {state.missingOptionalEnv.length > 0 && (
                          <p className="mt-2 text-[11px]" style={{ color: 'var(--amber)' }}>
                            Folder picking needs {state.missingOptionalEnv.join(' and ')} on the server.
                          </p>
                        )}
                      </div>
                    )}

                    {detailsFor.provider === 'autodesk' && (
                      <p style={{ color: 'var(--on-surface-variant)' }}>
                        Upload DWG or RVT files from the CAD viewer. 5Bloc stores them in Autodesk Platform Services,
                        translates them to SVF2, and renders them in-app.
                      </p>
                    )}

                    {detailsFor.surface && (
                      <Link
                        href={detailsFor.surface.href}
                        className="btn-secondary py-2 px-3 text-[11px] inline-flex items-center gap-1"
                      >
                        <span className="material-icons-outlined text-[13px]">open_in_new</span>
                        {detailsFor.surface.label}
                      </Link>
                    )}
                  </>
                )
              })()}
            </div>

            <div className="px-6 py-4 flex justify-end" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setDetailsFor(null)} className="btn-secondary py-1.5 px-4 text-xs rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDisconnect !== null}
        title={`Disconnect ${pendingDisconnect ? PROVIDER_LABEL[pendingDisconnect.provider] : ''}?`}
        message={
          pendingDisconnect?.provider === 'google'
            ? 'This removes the stored token for Drive, Gmail, and Calendar, and 5Bloc will stop showing data from them until you reconnect.'
            : 'This removes the stored Autodesk token. Uploaded models stay in Autodesk Platform Services but 5Bloc cannot open them until you reconnect.'
        }
        confirmLabel="Disconnect"
        variant="danger"
        loading={disconnecting}
        onConfirm={confirmDisconnect}
        onCancel={() => setPendingDisconnect(null)}
      />
    </div>
  )
}
