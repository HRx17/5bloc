'use client'

import React, { useState, useEffect } from 'react'
import { startRazorpayCheckout } from '@/lib/payments/checkout'

interface OrgMember {
 id: string
 name: string
 email: string
 role: string
 joined_at: string
}

export default function Settings() {
 const [activeTab, setActiveTab] = useState<'profile' | 'organisation' | 'team' | 'billing' | 'notifications' | 'integrations'>('profile')
 const [hydrated, setHydrated] = useState(false)
 
 // Profile settings
 const [profile, setProfile] = useState({
 name: '',
 email: '',
 phone: '',
 avatar: '',
 })

 // Org settings
 const [org, setOrg] = useState({
 name: '',
 logo: '',
 gst: '',
 city: '',
 address: '',
 })

 // Team settings
 const [team, setTeam] = useState<OrgMember[]>([])
 const [pendingInvites, setPendingInvites] = useState<{ id: string; email: string; role: string }[]>([])
 const [newTeamEmail, setNewTeamEmail] = useState('')
 const [teamBusy, setTeamBusy] = useState(false)
 const [billingBusy, setBillingBusy] = useState(false)

 // Notifications settings
 const [notifications, setNotifications] = useState({
 new_projects: true,
 comments: true,
 approvals: true,
 rfis: true,
 weekly_digest: false,
 })

 const loadTeam = async () => {
 const res = await fetch('/api/org/team')
 if (!res.ok) return
 const d = await res.json()
 setTeam(
 (d.members || []).map((m: any) => ({
 id: m.id,
 name: m.name,
 email: m.email,
 role: m.role,
 joined_at: m.joined_at || '—',
 }))
 )
 setPendingInvites(d.invites || [])
 }

 useEffect(() => {
 fetch('/api/me')
 .then((r) => r.json())
 .then((d) => {
 const p = d.profile
 if (!p) return
 setProfile({
 name: p.full_name || '',
 email: p.email || '',
 phone: p.phone || '',
 avatar: p.avatar_url || '',
 })
 setOrg({
 name: p.organisations?.name || '',
 logo: p.organisations?.logo_url || '',
 gst: p.organisations?.gst_number || '',
 city: p.organisations?.city || '',
 address: p.organisations?.address || '',
 })
 setNotifications({
 new_projects: p.notify_email !== false,
 comments: p.notify_bids !== false,
 approvals: p.notify_approvals !== false,
 rfis: p.notify_rfi !== false,
 weekly_digest: false,
 })
 })
 .finally(() => setHydrated(true))
 loadTeam().catch(() => {})
 }, [])

 const handleProfileSave = async (e: React.FormEvent) => {
 e.preventDefault()
 const res = await fetch('/api/me', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 full_name: profile.name,
 phone: profile.phone,
 avatar_url: profile.avatar || null,
 }),
 })
 const data = await res.json()
 alert(res.ok ? 'Profile saved' : data.error || 'Save failed')
 }

 const handleOrgSave = async (e: React.FormEvent) => {
 e.preventDefault()
 const res = await fetch('/api/me', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 org: { name: org.name, gst: org.gst, city: org.city, address: org.address },
 }),
 })
 const data = await res.json()
 alert(res.ok ? 'Organisation settings saved' : data.error || 'Save failed')
 }

 const handleInviteTeam = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!newTeamEmail || teamBusy) return
 setTeamBusy(true)
 try {
 const res = await fetch('/api/org/team', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email: newTeamEmail, member_role: 'member' }),
 })
 const data = await res.json()
 if (!res.ok) throw new Error(data.error || 'Invite failed')
 setNewTeamEmail('')
 await loadTeam()
 alert(
   data.email_warning
     ? `${data.email_warning}\n\nLink: ${data.accept_url || ''}`
     : `Invite sent to ${data.invite?.email || newTeamEmail}`
 )
 } catch (err: any) {
 alert(err?.message || 'Invite failed')
 } finally {
 setTeamBusy(false)
 }
 }

 const handleRemoveTeam = async (id: string) => {
 if (!confirm('Are you sure you want to remove this team member?')) return
 const res = await fetch(`/api/org/team?member_id=${encodeURIComponent(id)}`, { method: 'DELETE' })
 const data = await res.json()
 if (!res.ok) {
 alert(data.error || 'Remove failed')
 return
 }
 await loadTeam()
 }

 const handleBilling = async (plan: 'solo' | 'team' | 'ai') => {
 if (billingBusy) return
 setBillingBusy(true)
 try {
 const result = await startRazorpayCheckout({ plan, redirect: '/settings?subscribed=true' })
 if (result.message) alert(result.message)
 } finally {
 setBillingBusy(false)
 }
 }

 const handleToggleNotification = async (key: keyof typeof notifications) => {
 const next = { ...notifications, [key]: !notifications[key] }
 setNotifications(next)
 await fetch('/api/me', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 notify_email: next.new_projects,
 notify_rfi: next.rfis,
 notify_approvals: next.approvals,
 notify_bids: next.comments,
 }),
 })
 }

 return (
 <div className="p-6 font-body select-none max-w-5xl mx-auto space-y-6">
 
 {/* Header */}
 <div>
 <h1 className="text-2xl font-bold tracking-wide">Workspace Settings</h1>
 <p className="text-xs text-stone mt-1">
 {hydrated ? 'Configure profile, firm, notifications, and billing.' : 'Loading your account…'}
 </p>
 </div>

 <div className="flex flex-col md:flex-row gap-6 items-start">
 
 {/* Left tabs selector panel */}
 <div className="card-5bloc w-full md:w-56 shrink-0 py-4 px-3 space-y-1">
 {[
 { id: 'profile', label: 'User Profile', icon: 'person_outline' },
 { id: 'organisation', label: 'Organisation', icon: 'domain' },
 { id: 'team', label: 'Org Team', icon: 'contacts' },
 { id: 'billing', label: 'Billing & Plans', icon: 'receipt_long' },
 { id: 'notifications', label: 'Notifications', icon: 'notifications' },
 { id: 'integrations', label: 'Integrations', icon: 'sync_alt' },
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition ${
 activeTab === tab.id ? 'bg-amber text-navy font-semibold' : 'text-stone hover:text-white hover:bg-navy-lt'
 }`}
 >
 <span className="material-icons-outlined text-[16px]">{tab.icon}</span>
 <span>{tab.label}</span>
 </button>
 ))}
 </div>

 {/* Right Tab Content panels */}
 <div className="flex-grow w-full">
 {activeTab === 'profile' && (
 <div className="card-5bloc space-y-6">
 <h3 className="text-sm font-semibold text-amber pb-2.5">User Profile</h3>
 <form onSubmit={handleProfileSave} className="space-y-4">
 <div className="flex items-center gap-4 pb-2">
 <div className="w-14 h-14 bg-navy-lt border flex items-center justify-center font-bold text-lg text-amber">
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
 <div className="flex-grow">
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
 <button type="submit" disabled={teamBusy} className="btn-primary py-2 px-6 text-xs h-[34px]">
 {teamBusy ? 'Sending…' : 'Send invite'}
 </button>
 </form>
 {pendingInvites.length > 0 && (
 <div className="pt-2 space-y-1">
 <p className="text-[10px] text-stone uppercase tracking-wider">Pending invites</p>
 {pendingInvites.map((inv) => (
 <div key={inv.id} className="flex items-center justify-between text-xs text-stone">
 <span>{inv.email}</span>
 <button
 type="button"
 className="text-error text-[11px]"
 onClick={async () => {
 await fetch(`/api/org/team?invite_id=${encodeURIComponent(inv.id)}`, { method: 'DELETE' })
 await loadTeam()
 }}
 >
 Revoke
 </button>
 </div>
 ))}
 </div>
 )}
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
 <span className="w-full text-center block text-[11px] py-1.5 font-medium" style={{ background: 'rgba(245,166,35,.10)', color: 'var(--amber)' }}>
 Current subscription
 </span>
 ) : (
 <button 
 onClick={() => handleBilling(plan.name.includes('Team') ? 'team' : 'solo')}
 disabled={billingBusy || plan.current}
 className="w-full btn-primary text-xs py-1.5 font-medium"
 >
 {billingBusy ? 'Opening…' : plan.action}
 </button>
 )}
 </div>
 </div>
 ))}
 </div>

 {/* AI add on billing card */}
 <div className="card-5bloc flex flex-col sm:flex-row sm:items-center justify-between gap-4 ">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-amber/10 border text-amber flex items-center justify-center shrink-0">
 <span className="material-icons-outlined text-[20px]">auto_awesome</span>
 </div>
 <div>
 <h4 className="text-xs font-bold text-white">AI Assistant Add-On</h4>
 <p className="text-[11px] text-stone mt-0.5">₹1,499/mo. Unlocks unlimited quantity estimator & RERA helper tools.</p>
 </div>
 </div>
 <button 
 onClick={() => handleBilling('ai')}
 disabled={billingBusy}
 className="btn-secondary py-1.5 text-xs font-medium text-amber hover:"
 >
 {billingBusy ? 'Opening…' : 'Add to billing'}
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
 <button
 type="button"
 onClick={() => handleToggleNotification(item.key as any)}
 className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
 (notifications as any)[item.key] ? 'bg-success' : 'bg-navy-lt'
 }`}
 >
 <span
 className={`pointer-events-none inline-block h-4 w-4 transform bg-white shadow ring-0 transition duration-200 ease-in-out ${
 (notifications as any)[item.key] ? 'translate-x-5' : 'translate-x-0'
 }`}
 />
 </button>
 </div>
 ))}
 </div>
 </div>
 )}

 {activeTab === 'integrations' && (
 <div className="card-5bloc space-y-6">
 <h3 className="text-sm font-semibold text-amber pb-2.5">Platform Integrations</h3>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
 {/* Gmail Sync Card */}
 <div className=" p-4 bg-navy/20 flex flex-col justify-between h-48">
 <div>
 <div className="flex items-center gap-2">
 <span className="material-icons-outlined text-amber text-[20px]">mail</span>
 <h4 className="text-xs font-semibold text-white">Gmail / Email Sync</h4>
 </div>
 <p className="text-[10px] text-stone mt-2 leading-relaxed">
 Automatically routes coordination digests, RFI queries, and invoice links directly through your official email address.
 </p>
 </div>
 <div className="flex items-center justify-between mt-4 pt-3">
 <span className="text-[10px] text-stone font-medium">Status: Not connected</span>
 <button 
 onClick={() => alert('Gmail OAuth is not configured yet. Coming soon.')} 
 className="btn-secondary py-1 px-3 text-[10px] font-semibold"
 >
 Connect
 </button>
 </div>
 </div>

 {/* Excel & Sheets Sync Card */}
 <div className=" p-4 bg-navy/20 flex flex-col justify-between h-48">
 <div>
 <div className="flex items-center gap-2">
 <span className="material-icons-outlined text-amber text-[20px]">table_chart</span>
 <h4 className="text-xs font-semibold text-white">Excel / Sheets Automation</h4>
 </div>
 <p className="text-[10px] text-stone mt-2 leading-relaxed">
 Enable client-side importing/exporting of BOQs, milestone schedules, and RFI databases. Connect directly to online spreadsheet pipelines.
 </p>
 </div>
 <div className="flex items-center justify-between mt-4 pt-3">
 <span className="text-[10px] text-stone font-medium">Status: Not connected</span>
 <button 
 onClick={() => alert('Sheets sync is not configured yet. Coming soon.')} 
 className="btn-secondary py-1 px-3 text-[10px] font-semibold"
 >
 Connect
 </button>
 </div>
 </div>

 {/* Google Calendar Sync Card */}
 <div className=" p-4 bg-navy/20 flex flex-col justify-between h-48">
 <div>
 <div className="flex items-center gap-2">
 <span className="material-icons-outlined text-amber text-[20px]">calendar_today</span>
 <h4 className="text-xs font-semibold text-white">Google Calendar Integration</h4>
 </div>
 <p className="text-[10px] text-stone mt-2 leading-relaxed">
 Synchronizes project milestone dates directly to your workspace calendar to prevent delayed handovers.
 </p>
 </div>
 <div className="flex items-center justify-between mt-4 pt-3">
 <span className="text-[10px] text-stone font-medium">Status: Not connected</span>
 <button 
 onClick={() => alert('Calendar sync is not configured yet. Coming soon.')} 
 className="btn-secondary py-1 px-3 text-[10px] font-semibold"
 >
 Connect
 </button>
 </div>
 </div>

 {/* WhatsApp Notifications Card */}
 <div className=" p-4 bg-navy/20 flex flex-col justify-between h-48">
 <div>
 <div className="flex items-center gap-2">
 <span className="material-icons-outlined text-[#25D366] text-[20px]">chat</span>
 <h4 className="text-xs font-semibold text-white">WhatsApp Communication</h4>
 </div>
 <p className="text-[10px] text-stone mt-2 leading-relaxed">
 Send RFI updates and drawings directly to contractors using prefilled mobile links.
 </p>
 </div>
 <div className="flex items-center justify-between mt-4 pt-3">
 <span className="text-[10px] text-stone font-medium">Status: Not connected</span>
 <button 
 onClick={() => alert('WhatsApp Business API is not configured yet. Coming soon.')} 
 className="btn-secondary py-1 px-3 text-[10px] font-semibold"
 >
 Verify Link
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>

 </div>
 </div>
 )
}

