'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface IntegrationItem {
  id: string
  name: string
  provider: string
  icon: string
  color: string
  description: string
  status: 'connected' | 'disconnected'
  lastSync: string
  syncedItemsCount: number
  category: 'workspace' | 'communication' | 'engineering'
}

// Which integration IDs use real OAuth (others show "coming soon")
const OAUTH_PROVIDERS: Record<string, string> = {
  'google-drive': 'google',
  'gmail':        'google',
  'autodesk':     'autodesk',
}

export default function IntegrationsDashboard() {
  const { toast } = useToast()
  const router = useRouter()
  const [connectedProviders, setConnectedProviders] = useState<string[]>([])
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  // Load real connected status on mount + after OAuth redirect
  useEffect(() => {
    fetch('/api/integrations/status')
      .then(r => r.json())
      .then(({ connected }) => setConnectedProviders(connected ?? []))
      .catch(() => {})

    // Handle redirect back from OAuth
    const params = new URLSearchParams(window.location.search)
    const connected = params.get('connected')
    const error     = params.get('error')
    if (connected === 'google') toast('Google Drive, Gmail & Calendar connected!', 'success', 5000)
    if (connected === 'autodesk') toast('Autodesk AutoCAD & Fusion 360 connected!', 'success', 5000)
    if (error === 'google_denied') toast('Google connection cancelled.', 'info')
    if (error === 'autodesk_denied') toast('Autodesk connection cancelled.', 'info')
    if (error === 'google_callback_failed') {
      const msg = params.get('msg') ? decodeURIComponent(params.get('msg')!) : ''
      toast(`Google connection failed${msg ? `: ${msg}` : '. Try again.'}`, 'error', 8000)
    }
    if (error === 'autodesk_callback_failed') toast('Autodesk connection failed. Try again.', 'error')
    if (connected || error) {
      // Clean URL
      router.replace('/integrations', { scroll: false })
    }
  }, [])

  const [integrations, setIntegrations] = useState<IntegrationItem[]>([
    {
      id: 'google-drive',
      name: 'Google Workspace & Drive',
      provider: 'Google',
      icon: 'cloud_queue',
      color: '#4285F4',
      description: 'Sync design sheets, municipal bye-laws, rates comparisons, and project files directly with Google Drive.',
      status: 'disconnected',
      lastSync: 'Never',
      syncedItemsCount: 0,
      category: 'workspace',
    },
    {
      id: 'gmail',
      name: 'Gmail Sync',
      provider: 'Google',
      icon: 'mail',
      color: '#EA4335',
      description: 'Ingest stone quotes, fire NOC approvals, and steel test certificates. Automatically convert email threads to RFIs.',
      status: 'disconnected',
      lastSync: 'Never',
      syncedItemsCount: 0,
      category: 'communication',
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Site Channel',
      provider: 'WhatsApp',
      icon: 'chat',
      color: '#25D366',
      description: 'Link site supervisor chats. Log snags and defect issues instantly from photo messages. Prefill PDF drawing shares.',
      status: 'disconnected',
      lastSync: 'Never',
      syncedItemsCount: 0,
      category: 'communication',
    },
    {
      id: 'autodesk',
      name: 'Autodesk AutoCAD & Fusion 360',
      provider: 'Autodesk',
      icon: 'architecture',
      color: '#D82424',
      description: 'Inspect 2D blueprints (.dwg) and 3D wireframe models in real-time. Automated spatial clash detection for beams and ducts.',
      status: 'disconnected',
      lastSync: 'Never',
      syncedItemsCount: 0,
      category: 'engineering',
    },
  ])

  const [syncingAll, setSyncingAll] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'all' | 'workspace' | 'communication' | 'engineering'>('all')
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationItem | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [whatsappPhone, setWhatsappPhone] = useState('9876543210')
  const [googleFolder, setGoogleFolder] = useState('5Bloc Project Files')

  const handleConnect = (id: string) => {
    const provider = OAUTH_PROVIDERS[id]
    if (!provider) {
      toast('This integration is coming soon.', 'info')
      return
    }
    // Google Drive + Gmail share the same OAuth flow
    if (provider === 'google') {
      router.push('/api/integrations/google/connect')
    } else if (provider === 'autodesk') {
      router.push('/api/integrations/autodesk/connect')
    }
  }

  const handleDisconnect = async (id: string, name: string) => {
    const provider = OAUTH_PROVIDERS[id]
    if (!provider) return
    setDisconnecting(id)
    try {
      await fetch(`/api/integrations/${provider}/disconnect`, { method: 'POST' })
      setConnectedProviders(prev => prev.filter(p => p !== provider))
      toast(`${name} disconnected`, 'info')
    } catch {
      toast('Disconnect failed. Try again.', 'error')
    } finally {
      setDisconnecting(null)
    }
  }

  const triggerSync = (id: string) => {
    toast(`Sync initiated for ${id} — configure API keys to enable live sync.`, 'info')
    setIntegrations(prev =>
      prev.map(item =>
        item.id === id ? { ...item, lastSync: 'Just now' } : item
      )
    )
  }

  const syncAll = () => {
    setSyncingAll(true)
    setTimeout(() => {
      setSyncingAll(false)
      setIntegrations(prev =>
        prev.map(item =>
          item.status === 'connected' ? { ...item, lastSync: 'Just now' } : item
        )
      )
      toast('All integrations synced — add API keys to .env for live data.', 'success')
    }, 1500)
  }

  const filtered = activeCategory === 'all'
    ? integrations
    : integrations.filter(item => item.category === activeCategory)

  return (
    <div className="p-6 space-y-8 max-w-screen-xl mx-auto font-body select-none">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="label-sm mb-1" style={{ color: 'var(--stone)' }}>System Automation</p>
          <h1 className="font-display text-[36px] leading-[40px]" style={{ color: 'var(--on-surface)' }}>
            Enterprise Integrations
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--on-surface-variant)' }}>
            Configure and link third-party software pipelines to keep documents, drawings, emails, and chats synchronised.
          </p>
        </div>
        
        <button
          onClick={syncAll}
          disabled={syncingAll}
          className="btn-primary shrink-0 py-2.5 px-5 flex items-center gap-2 hover:bg-amber-lt"
        >
          <span className={`material-icons-outlined text-[16px] ${syncingAll ? 'animate-spin' : ''}`}>
            {syncingAll ? 'sync' : 'sync_all'}
          </span>
          {syncingAll ? 'Syncing All...' : 'Force Global Resync'}
        </button>
      </div>

      {/* ── Quick Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-glass border border-navy-lt/20" style={{ padding: '16px 20px', borderRadius: '12px' }}>
          <p className="label-sm text-[10px]" style={{ color: 'var(--stone)' }}>Linked Applications</p>
          <div className="flex items-center gap-2.5 mt-2">
            <span className="text-[26px] font-bold" style={{ color: 'var(--on-surface)' }}>
              {integrations.filter(i => i.status === 'connected').length} / {integrations.length}
            </span>
            <span className="chip" style={{ background: 'rgba(111,220,140,.12)', color: 'var(--success)' }}>Active</span>
          </div>
        </div>

        <div className="card-glass border border-navy-lt/20" style={{ padding: '16px 20px', borderRadius: '12px' }}>
          <p className="label-sm text-[10px]" style={{ color: 'var(--stone)' }}>Synced Assets Registry</p>
          <div className="flex items-center gap-2.5 mt-2">
            <span className="text-[26px] font-bold" style={{ color: 'var(--on-surface)' }}>
              {integrations.reduce((acc, curr) => acc + (curr.status === 'connected' ? curr.syncedItemsCount : 0), 0)}
            </span>
            <span className="chip" style={{ background: 'rgba(122,184,255,.12)', color: 'var(--blue)' }}>Items Online</span>
          </div>
        </div>

        <div className="card-glass border border-navy-lt/20" style={{ padding: '16px 20px', borderRadius: '12px' }}>
          <p className="label-sm text-[10px]" style={{ color: 'var(--stone)' }}>Sync Status</p>
          <div className="flex items-center gap-2.5 mt-2">
            <span className="text-[12px] font-bold truncate" style={{ color: 'var(--on-surface)' }}>
              Live Webhooks Connected
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse shrink-0" />
          </div>
        </div>
      </div>

      {/* ── Category Filters ── */}
      <div className="flex border-b border-navy-lt/40 pb-px gap-1">
        {[
          { id: 'all', label: 'All Integrations', icon: 'extension' },
          { id: 'workspace', label: 'Workspace Cloud', icon: 'cloud_queue' },
          { id: 'communication', label: 'Chats & Emails', icon: 'chat' },
          { id: 'engineering', label: 'CAD / BIM Systems', icon: 'architecture' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
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

      {/* ── Integrations Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(item => {
          const provider    = OAUTH_PROVIDERS[item.id]
          const isConnected = provider
            ? connectedProviders.includes(provider) &&
              // Google Drive + Gmail both show connected when google token exists
              (provider !== 'google' || connectedProviders.includes('google'))
            : false
          const hasOAuth    = !!provider
          const isBusy      = disconnecting === item.id

          return (
            <div
              key={item.id}
              className="card-5bloc flex flex-col justify-between transition relative overflow-hidden group hover:scale-[1.01] duration-200"
              style={{
                borderRadius: '16px',
                border: `1px solid ${isConnected ? `color-mix(in srgb, ${item.color} 20%, transparent)` : 'rgba(159,142,122,0.08)'}`,
                boxShadow: 'var(--shadow-2)',
              }}
            >
              {/* Highlight bar */}
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: isConnected ? item.color : 'rgba(255,255,255,0.06)' }} />

              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 flex items-center justify-center rounded-xl"
                      style={{
                        background: `color-mix(in srgb, ${item.color} ${isConnected ? 18 : 10}%, transparent)`,
                        color: item.color,
                      }}
                    >
                      <span className="material-icons-outlined text-[24px]">{item.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-white leading-tight">{item.name}</h3>
                      <p className="text-[10px] text-stone mt-0.5 font-semibold">Provider: {item.provider}</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className="px-3 py-1 rounded-full text-[10px] font-bold uppercase"
                    style={isConnected
                      ? { background: 'rgba(46,204,138,0.12)', color: 'var(--success)', border: '1px solid rgba(46,204,138,0.25)' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'var(--stone)', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    {isConnected ? '● Connected' : hasOAuth ? 'Not connected' : 'Coming soon'}
                  </span>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                  {item.description}
                </p>

                {/* Connected account info */}
                {isConnected && (
                  <p className="text-[11px]" style={{ color: 'var(--stone)' }}>
                    <span className="material-icons-outlined text-[12px] mr-1" style={{ verticalAlign: 'middle' }}>account_circle</span>
                    Connected via {item.provider} OAuth
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 flex items-center justify-between text-[11px]" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="space-y-0.5">
                  <span className="text-[10px] block" style={{ color: 'var(--stone)' }}>LAST SYNC</span>
                  <span className="font-mono font-semibold" style={{ color: 'var(--on-surface)' }}>
                    {isConnected ? 'Active' : 'Never'}
                  </span>
                </div>

                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => triggerSync(item.id)}
                      className="btn-ghost-amber py-1.5 px-3 text-[11px] font-bold rounded-lg flex items-center gap-1"
                    >
                      <span className="material-icons-outlined text-[13px]">sync</span>
                      Sync
                    </button>
                    <button
                      onClick={() => handleDisconnect(item.id, item.name)}
                      disabled={isBusy}
                      className="py-1.5 px-3 text-[11px] font-bold rounded-lg transition-colors"
                      style={{ color: 'var(--error)', background: 'rgba(255,138,128,0.08)' }}
                    >
                      {isBusy ? 'Disconnecting…' : 'Disconnect'}
                    </button>
                  </div>
                ) : hasOAuth ? (
                  <button
                    onClick={() => handleConnect(item.id)}
                    className="btn-primary py-1.5 px-4 text-[11px] font-bold rounded-lg"
                  >
                    Connect {item.provider}
                  </button>
                ) : (
                  <span className="text-[11px] px-3 py-1.5 rounded-lg" style={{ color: 'var(--stone)', background: 'rgba(255,255,255,0.04)' }}>
                    Coming soon
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Interactive Setup/Config Modal ── */}
      {showConfigModal && selectedIntegration && (
        <div className="fixed inset-0 bg-navy/95 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fade-in">
          <div
            className="w-full max-w-md bg-navy-mid border border-navy-lt/60 overflow-hidden flex flex-col justify-between relative shadow-none"
            style={{ borderRadius: '24px' }}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-navy border-b border-navy-lt/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-[18px]" style={{ color: selectedIntegration.color }}>
                  {selectedIntegration.icon}
                </span>
                <span className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                  Configure {selectedIntegration.name}
                </span>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-stone hover:text-white transition p-1 hover:bg-navy-lt rounded-full"
              >
                <span className="material-icons-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Content Form */}
            <div className="p-6 space-y-5">
              {selectedIntegration.id === 'google-drive' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-stone text-xs font-medium mb-1.5">Linked Target Folder Name *</label>
                    <input
                      type="text"
                      value={googleFolder}
                      onChange={(e) => setGoogleFolder(e.target.value)}
                      className="input-5bloc py-2 text-xs"
                      style={{ borderRadius: '8px' }}
                    />
                    <p className="text-[10px] text-stone mt-1">This folder in your Google Drive will sync to your Document Vault.</p>
                  </div>
                  <div>
                    <label className="block text-stone text-xs font-medium mb-1.5">Auto-Sync Intervals</label>
                    <select
                      className="input-5bloc py-2 text-xs bg-navy-lt border-none"
                      style={{ borderRadius: '8px' }}
                      defaultValue="realtime"
                    >
                      <option value="realtime">Real-time Webhook (Recommended)</option>
                      <option value="hourly">Every Hour</option>
                      <option value="daily">Daily digest</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedIntegration.id === 'whatsapp' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-stone text-xs font-medium mb-1.5">Contractor Group Phone Number (with Country Code) *</label>
                    <input
                      type="text"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      className="input-5bloc py-2 text-xs font-mono"
                      style={{ borderRadius: '8px' }}
                    />
                    <p className="text-[10px] text-stone mt-1">Foreman alert logs and RFI photo snags sync from this number.</p>
                  </div>
                  <div>
                    <label className="block text-stone text-xs font-medium mb-1.5">Media Auto-Import Settings</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2.5 text-xs text-stone-300">
                        <input type="checkbox" defaultChecked className="rounded bg-navy focus:ring-0 text-amber" />
                        <span>Auto-log photos as High-Priority snags</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-stone-300">
                        <input type="checkbox" defaultChecked className="rounded bg-navy focus:ring-0 text-amber" />
                        <span>Send automated SMS fallback if offline</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {selectedIntegration.id === 'gmail' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-stone text-xs font-medium mb-1.5">Synchronised Inboxes</label>
                    <div className="p-3 bg-navy rounded-lg space-y-2 text-xs text-white">
                      <div className="flex items-center justify-between">
                        <span>parth@5bloc.com</span>
                        <span className="text-[10px] text-success">PRIMARY</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>invoices@5bloc.com</span>
                        <span className="text-[10px] text-stone">BILLING ONLY</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-stone text-xs font-medium mb-1.5">Keywords trigger (auto RFI convert)</label>
                    <input
                      type="text"
                      defaultValue="setbacks, invoice, NOC, dispatch"
                      className="input-5bloc py-2 text-xs"
                      style={{ borderRadius: '8px' }}
                    />
                    <p className="text-[10px] text-stone mt-1">Emails containing these tags automatically spawn draft RFIs.</p>
                  </div>
                </div>
              )}

              {selectedIntegration.id === 'autodesk' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-stone text-xs font-medium mb-1.5">Autodesk Forge Project Hub Mapping</label>
                    <input
                      type="text"
                      defaultValue="Lotus-Plaza-BIM-v4"
                      className="input-5bloc py-2 text-xs font-mono"
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-stone text-xs font-medium mb-1.5">AI Spatial Clash Inspection Options</label>
                    <div className="space-y-2 text-xs text-stone-300">
                      <label className="flex items-center gap-2.5">
                        <input type="checkbox" defaultChecked className="rounded bg-navy focus:ring-0 text-amber" />
                        <span>Verify HVAC duct vs cantilever beam load limits</span>
                      </label>
                      <label className="flex items-center gap-2.5">
                        <input type="checkbox" defaultChecked className="rounded bg-navy focus:ring-0 text-amber" />
                        <span>Verify concrete structural rebar column clearances</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-navy border-t border-navy-lt/40 flex justify-end gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="btn-secondary py-1.5 px-4 text-xs rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfigModal(false)
                  toast('Integration settings saved', 'success')
                }}
                className="btn-primary py-1.5 px-4 text-xs rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
