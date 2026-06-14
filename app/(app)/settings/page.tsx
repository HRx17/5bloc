'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Toggle } from '@/components/ui/Toggle'

interface OrgMember {
 id: string
 name: string
 email: string
 role: string
 joined_at: string
}

type TabId = 'profile' | 'organisation' | 'team' | 'billing' | 'notifications' | 'integrations' | 'download'
const VALID_TABS: TabId[] = ['profile', 'organisation', 'team', 'billing', 'notifications', 'integrations', 'download']

function SettingsInner() {
 const searchParams = useSearchParams()
 const tabParam = searchParams.get('tab') as TabId | null
 const [activeTab, setActiveTab] = useState<TabId>(
   tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'profile'
 )

 useEffect(() => {
   if (tabParam && VALID_TABS.includes(tabParam)) {
     setActiveTab(tabParam)
   }
 }, [tabParam])
 
 // Profile settings
 const [profile, setProfile] = useState({
 name: 'Parth Patel',
 email: 'parth@5bloc.com',
 phone: '9876543210',
 avatar: '',
 })

 // Org settings
 const [org, setOrg] = useState({
 name: 'Apex Architects',
 logo: '',
 gst: '27AAAAA1111A1Z1',
 city: 'Mumbai',
 address: 'Bandra West, Linking Road',
 })

 // Team settings
 const [team, setTeam] = useState<OrgMember[]>([
 { id: 'tm-1', name: 'Parth Patel', email: 'parth@5bloc.com', role: 'Owner', joined_at: '2026-01-15' },
 { id: 'tm-2', name: 'Aritro Roy', email: 'aritro@5bloc.com', role: 'Admin', joined_at: '2026-02-10' }
 ])
 const [newTeamEmail, setNewTeamEmail] = useState('')

 // Notifications settings
 const [notifications, setNotifications] = useState({
 new_projects: true,
 comments: true,
 approvals: true,
 rfis: true,
 weekly_digest: false,
 })

 const handleProfileSave = (e: React.FormEvent) => {
 e.preventDefault()
 alert('Profile saved successfully (simulated)')
 }

 const handleOrgSave = (e: React.FormEvent) => {
 e.preventDefault()
 alert('Organisation settings saved successfully (simulated)')
 }

 const handleInviteTeam = (e: React.FormEvent) => {
 e.preventDefault()
 if (!newTeamEmail) return
 setTeam(prev => [...prev, {
 id: `tm-${Date.now()}`,
 name: newTeamEmail.split('@')[0],
 email: newTeamEmail,
 role: 'Member',
 joined_at: new Date().toISOString().split('T')[0]
 }])
 setNewTeamEmail('')
 alert(`Invite sent via Resend email to ${newTeamEmail}`)
 }

 const handleRemoveTeam = (id: string) => {
 if (confirm('Are you sure you want to remove this team member?')) {
 setTeam(prev => prev.filter(m => m.id !== id))
 }
 }

 const handleToggleNotification = (key: keyof typeof notifications) => {
 setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
 }

 return (
 <div className="p-6 font-body select-none max-w-5xl mx-auto space-y-6">
 
 {/* Header */}
 <div>
 <h1 className="text-2xl font-bold tracking-wide">Workspace Settings</h1>
 <p className="text-xs text-stone mt-1">Configure profile details, user roles, notifications, and invoicing subscriptions.</p>
 </div>

 <div className="flex flex-col md:flex-row gap-6 items-start">
 
 {/* Left tabs selector panel */}
 <div className="card-5bloc w-full md:w-56 shrink-0 py-4 px-3 space-y-1">
{[
  { id: 'profile',       label: 'User Profile',    icon: 'person_outline' },
  { id: 'organisation',  label: 'Organisation',    icon: 'domain' },
  { id: 'team',          label: 'Org Team',        icon: 'contacts' },
  { id: 'billing',       label: 'Billing & Plans', icon: 'receipt_long' },
  { id: 'notifications', label: 'Notifications',   icon: 'notifications' },
  { id: 'integrations',  label: 'Integrations',    icon: 'sync_alt' },
  { id: 'download',      label: 'Download App',    icon: 'download' },
].map(tab => (
  <button
    key={tab.id}
    onClick={() => setActiveTab(tab.id as any)}
    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px] font-medium transition-all"
    style={activeTab === tab.id ? {
      background: 'rgba(245,166,35,0.12)',
      color: 'var(--amber)',
    } : {
      color: 'var(--stone)',
    }}
    onMouseEnter={(e) => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
    onMouseLeave={(e) => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
  >
    <span className="material-icons-outlined text-[15px] shrink-0">{tab.icon}</span>
    <span>{tab.label}</span>
  </button>
))}
 </div>

 {/* Right Tab Content panels */}
 <div className="grow w-full">
 {activeTab === 'profile' && (
 <div className="card-5bloc space-y-6">
 <h3 className="text-sm font-semibold text-amber pb-2.5">User Profile</h3>
 <form onSubmit={handleProfileSave} className="space-y-4">
 <div className="flex items-center gap-4 pb-2">
 <div
    className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
    style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--amber)' }}
   >
    PP
   </div>
 <div>
 <button type="button" className="btn-secondary py-1 px-3 text-xs">Upload avatar</button>
 <p className="text-[11px] text-stone mt-1">Accepts PNG, JPG up to 2MB</p>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-stone text-xs font-medium mb-1.5">Full Name *</label>
 <input
 type="text"
 required
 value={profile.name}
 onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>
 <div>
 <label className="block text-stone text-xs font-medium mb-1.5">Phone Number</label>
 <input
 type="text"
 value={profile.phone}
 onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>
 </div>

 <div>
 <label className="block text-stone text-xs font-medium mb-1.5">Email Address *</label>
 <input
 type="email"
 disabled
 value={profile.email}
 className="input-5bloc py-1.5 text-xs opacity-60 cursor-not-allowed"
 />
 </div>

 <div className="pt-2 flex justify-end">
 <button type="submit" className="btn-primary py-1.5 px-6 text-xs">
 Save profile
 </button>
 </div>
 </form>
 </div>
 )}

 {activeTab === 'organisation' && (
 <div className="card-5bloc space-y-6">
 <h3 className="text-sm font-semibold text-amber pb-2.5">Firm Information</h3>
 <form onSubmit={handleOrgSave} className="space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-stone text-xs font-medium mb-1.5">Firm Name *</label>
 <input
 type="text"
 required
 value={org.name}
 onChange={(e) => setOrg(prev => ({ ...prev, name: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>
 <div>
 <label className="block text-stone text-xs font-medium mb-1.5">Firm GSTIN (Optional)</label>
 <input
 type="text"
 value={org.gst}
 onChange={(e) => setOrg(prev => ({ ...prev, gst: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>
 </div>

 <div className="grid grid-cols-3 gap-4">
 <div className="col-span-2">
 <label className="block text-stone text-xs font-medium mb-1.5">Street Address</label>
 <input
 type="text"
 value={org.address}
 onChange={(e) => setOrg(prev => ({ ...prev, address: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>
 <div>
 <label className="block text-stone text-xs font-medium mb-1.5">Firm City</label>
 <input
 type="text"
 value={org.city}
 onChange={(e) => setOrg(prev => ({ ...prev, city: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>
 </div>

 <div className="pt-2 flex justify-end">
 <button type="submit" className="btn-primary py-1.5 px-6 text-xs">
 Save organisation
 </button>
 </div>
 </form>
 </div>
 )}

 {activeTab === 'team' && (
 <div className="space-y-6">
 {/* Invite member */}
 <div className="card-5bloc space-y-4">
 <h3 className="text-sm font-semibold text-amber pb-2.5">Invite Firm Co-Worker</h3>
 <form onSubmit={handleInviteTeam} className="flex gap-4 items-end">
              <div className="grow">
 <label className="block text-stone text-xs font-medium mb-1.5">Co-worker Email *</label>
 <input
 type="email"
 required
 placeholder="e.g. colleague@firm.com"
 value={newTeamEmail}
 onChange={(e) => setNewTeamEmail(e.target.value)}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>
 <button type="submit" className="btn-primary py-2 px-6 text-xs h-[34px]">
 Send invite
 </button>
 </form>
 </div>

 {/* Members lists */}
 <div className="card-5bloc space-y-4">
 <h3 className="text-xs font-semibold text-stone pb-2.5">Firm Workspace Members</h3>
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs ">
 <thead>
 <tr className="text-stone text-[10px] pb-2 font-medium">
 <th className="pb-2 pl-2">Name</th>
 <th className="pb-2">Email</th>
 <th className="pb-2">Joined Date</th>
 <th className="pb-2">Workspace Role</th>
 <th className="pb-2 pr-2 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-navy-lt/40 text-stone">
 {team.map((member) => (
 <tr key={member.id}>
 <td className="py-3 pl-2 font-semibold text-white">{member.name}</td>
 <td className="py-3 text-xs">{member.email}</td>
 <td className="py-3 text-xs">{member.joined_at}</td>
 <td className="py-3">
 <span
   className="chip"
   style={{
     background: member.role === 'Owner' ? 'rgba(245,166,35,.12)' : 'rgba(159,142,122,.10)',
     color: member.role === 'Owner' ? 'var(--amber)' : 'var(--stone)'
   }}
 >
 {member.role}
 </span>
 </td>
 <td className="py-3 pr-2 text-right">
 {member.role !== 'Owner' && (
 <button 
 onClick={() => handleRemoveTeam(member.id)}
 className="text-stone hover:text-error transition font-semibold"
 >
 Remove
 </button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'billing' && (
 <div className="space-y-6">
 {/* Plans pricing details cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 {[
 { name: 'Free', price: '₹0', term: '3 projects, 5 users', current: true },
 { name: 'Solo Architect', price: '₹2,999', term: '/ month. Unlimited projects, AI, invoicing', current: false, action: 'Upgrade to Solo' },
 { name: 'Team Architect', price: '₹7,999', term: '/ month. Solo details + 5 users + analytics', current: false, action: 'Upgrade to Team' },
 ].map((plan, idx) => (
 <div 
 key={idx} 
 className="card-5bloc flex flex-col justify-between"
 style={plan.current ? { boxShadow: 'var(--shadow-amber)', background: 'rgba(245,166,35,.06)', color: 'var(--amber)' } : { color: 'var(--on-surface)' }}
 >
 <div>
 <h4 className="text-xs font-semibold text-stone">{plan.name}</h4>
 <h2 className="text-2xl font-bold text-white mt-2">{plan.price}</h2>
 <p className="text-[11px] text-stone mt-2 leading-relaxed">{plan.term}</p>
 </div>

 <div className="pt-4">
 {plan.current ? (
 <span className="w-full text-center block text-[11px] py-1.5 font-medium rounded-full" style={{ background: 'rgba(245,166,35,.10)', color: 'var(--amber)' }}>
  Current subscription
 </span>
 ) : (
 <button 
 onClick={() => alert(`Opening Razorpay checkout modal (subscription ID loading)`)}
 className="w-full btn-primary text-xs py-1.5 font-medium"
 >
 {plan.action}
 </button>
 )}
 </div>
 </div>
 ))}
 </div>

 {/* AI add on billing card */}
 <div className="card-5bloc flex flex-col sm:flex-row sm:items-center justify-between gap-4 ">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,166,35,0.10)', color: 'var(--amber)' }}>
  <span className="material-icons-outlined text-[20px]">auto_awesome</span>
 </div>
 <div>
 <h4 className="text-xs font-bold text-white">AI Assistant Add-On</h4>
 <p className="text-[11px] text-stone mt-0.5">₹1,499/mo. Unlocks unlimited quantity estimator & RERA helper tools.</p>
 </div>
 </div>
 <button 
 onClick={() => alert('Razorpay subscription checkout triggered')}
 className="btn-secondary btn-sm"
            style={{ color: 'var(--amber)' }}
 >
 Add to billing
 </button>
 </div>
 </div>
 )}

 {activeTab === 'notifications' && (
 <div className="card-5bloc space-y-6">
 <h3 className="text-sm font-semibold text-amber pb-2.5">Email Notifications</h3>
 
 <div className="space-y-4 text-xs">
 {[
 { key: 'new_projects', label: 'New Project invites', desc: 'Notify me when invited to coordinate on new project workspaces.' },
 { key: 'comments', label: 'Document Comments', desc: 'Notify me when a contractor or client comments on design sheets.' },
 { key: 'approvals', label: 'Document Approvals', desc: 'Notify me when clients approve drawings or request revisions.' },
 { key: 'rfis', label: 'RFI activity', desc: 'Notify me when new RFIs are raised or resolved.' },
 { key: 'weekly_digest', label: 'Weekly Summary Digest', desc: 'Send Monday morning digest summarizing active projects progress.' },
 ].map((item) => (
 <div key={item.key} className="flex items-start justify-between gap-4">
 <div className="max-w-md">
 <span className="text-white font-medium">{item.label}</span>
 <p className="text-[11px] text-stone mt-0.5 leading-relaxed">{item.desc}</p>
 </div>
 <Toggle
    on={!!(notifications as any)[item.key]}
    onChange={() => handleToggleNotification(item.key as any)}
    label={item.label}
   />
 </div>
 ))}
 </div>
 </div>
 )}

 {activeTab === 'integrations' && (
 <div className="card-5bloc space-y-6">
 <h3 className="text-sm font-semibold text-amber pb-2.5">Platform Integrations</h3>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
  {[
    { icon: 'mail',          iconColor: 'var(--amber)',  title: 'Gmail / Email Sync',        desc: 'Automatically routes coordination digests, RFI queries, and invoice links through your official email address.', status: 'Connected',   action: 'Refresh',  onClick: () => alert('Simulated Gmail connection refreshed') },
    { icon: 'table_chart',   iconColor: 'var(--blue)',   title: 'Excel / Sheets Automation', desc: 'Enable importing/exporting of BOQs, milestone schedules, and RFI databases. Connect to spreadsheet pipelines.', status: 'Enabled',    action: 'Sync Now', onClick: () => alert('Microsoft Office 365 / Google Sheets sync triggered') },
    { icon: 'calendar_today',iconColor: 'var(--blue)',   title: 'Google Calendar',           desc: 'Synchronizes project milestone dates to your workspace calendar to prevent delayed handovers.', status: 'Active',     action: 'Resync',   onClick: () => alert('Simulating Google Calendar webhook sync...') },
    { icon: 'chat',          iconColor: '#25D366',       title: 'WhatsApp Communication',    desc: 'Send RFI updates and drawings directly to contractors using prefilled mobile links.', status: 'Active Link',action: 'Verify',   onClick: () => alert('WhatsApp quick-link integration verified') },
  ].map((card) => (
   <div key={card.title} className="rounded-2xl p-4 flex flex-col justify-between gap-3" style={{ background: 'var(--surface-container)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
    <div className="flex items-start gap-3">
     <span className="material-icons-outlined text-[18px] mt-0.5 shrink-0" style={{ color: card.iconColor }}>{card.icon}</span>
     <div>
      <h4 className="text-[12px] font-semibold" style={{ color: 'var(--on-surface)' }}>{card.title}</h4>
      <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--stone)' }}>{card.desc}</p>
     </div>
    </div>
    <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
     <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--success)' }}>
      <span className="material-icons-outlined text-[12px]">check_circle</span>
      {card.status}
     </span>
     <button onClick={card.onClick} className="btn-secondary btn-sm">{card.action}</button>
    </div>
   </div>
  ))}
 </div>
        </div>
        )}

        {activeTab === 'download' && (
        <div className="card-5bloc space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-amber pb-1">Download Desktop App</h3>
            <p className="text-xs text-stone">Run 5Bloc natively on your machine — faster, works offline, opens CAD files directly.</p>
          </div>

          {/* Platform cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { platform: 'macOS', icon: 'laptop_mac',   sub: 'Apple Silicon + Intel',   ext: '.dmg',    size: '~120 MB' },
              { platform: 'Windows', icon: 'computer',   sub: 'Windows 10 / 11',         ext: '.exe',    size: '~110 MB' },
              { platform: 'Linux', icon: 'terminal',     sub: 'AppImage / .deb',         ext: '.AppImage',size: '~130 MB' },
            ].map(({ platform, icon, sub, ext, size }) => (
              <div key={platform} className="app-card flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl" style={{ background: 'rgba(245,166,35,0.08)', color: 'var(--amber)' }}>
                    <span className="material-icons-outlined text-[20px]">{icon}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--on-surface)' }}>{platform}</p>
                    <p className="text-[11px]" style={{ color: 'var(--stone)' }}>{sub}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--stone)' }}>
                  <span>{ext}</span>
                  <span>{size}</span>
                </div>
                <button
                  onClick={() => alert(`Download for ${platform} will be available at launch. Sign up for beta to get early access.`)}
                  className="btn-primary text-[12px] py-2 w-full justify-center"
                >
                  <span className="material-icons-outlined text-[14px]">download</span>
                  Download for {platform}
                </button>
              </div>
            ))}
          </div>

          {/* Electron info */}
          <div className="app-card space-y-3">
            <h4 className="text-[13px] font-semibold" style={{ color: 'var(--on-surface)' }}>
              What you get with the desktop app
            </h4>
            <ul className="grid gap-2">
              {[
                ['folder_open', 'Open & view DWG/DXF files without AutoCAD'],
                ['wifi_off',    'Offline mode — read & annotate docs without internet'],
                ['notifications', 'Native desktop notifications for RFIs and approvals'],
                ['sync',        'Auto-sync files from your local drive to cloud'],
                ['speed',       'Faster performance, no browser overhead'],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-start gap-2.5 text-[12.5px]" style={{ color: 'var(--on-surface-variant)' }}>
                  <span className="material-icons-outlined text-[15px] shrink-0 mt-0.5" style={{ color: 'var(--amber)' }}>{icon}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Dev instructions */}
          <div className="app-card">
            <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--on-surface)' }}>For developers / early testers</p>
            <p className="text-[11.5px] mb-3" style={{ color: 'var(--stone)' }}>
              Clone the repo and run locally as an Electron app:
            </p>
            <div
              className="rounded-xl p-3 font-mono text-[11px] space-y-1"
              style={{ background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)' }}
            >
              <p style={{ color: 'var(--stone)' }}># Install dependencies</p>
              <p>npm install</p>
              <p style={{ color: 'var(--stone)', marginTop: 8 }}># Start dev server + Electron together</p>
              <p>npm run electron:dev</p>
              <p style={{ color: 'var(--stone)', marginTop: 8 }}># Build distributable</p>
              <p>npm run electron:build</p>
            </div>
          </div>
        </div>
        )}
        </div>

  </div>
 </div>
 )
}

export default function Settings() {
 return (
   <Suspense fallback={null}>
     <SettingsInner />
   </Suspense>
 )
}
