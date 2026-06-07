'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Member {
 id: string
 name: string
 email: string
 role: 'architect' | 'contractor' | 'builder' | 'consultant' | 'client'
 lastActive: string
 can_upload: boolean
 can_comment: boolean
 can_approve: boolean
 status: 'active' | 'pending'
}

export default function ProjectTeam() {
 const params = useParams()
 const projectId = params.id as string

 const [members, setMembers] = useState<Member[]>([])
 const [loading, setLoading] = useState(true)
 const [inviteEmail, setInviteEmail] = useState('')
 const [inviteRole, setInviteRole] = useState<'architect' | 'contractor' | 'builder' | 'consultant' | 'client'>('contractor')
 const [sendingInvite, setSendingInvite] = useState(false)

 useEffect(() => {
 // Mock load team members
 const timer = setTimeout(() => {
 setMembers([
 {
 id: 'mem-1',
 name: 'Parth Patel',
 email: 'parth@5bloc.com',
 role: 'architect',
 lastActive: 'Active now',
 can_upload: true,
 can_comment: true,
 can_approve: true,
 status: 'active',
 },
 {
 id: 'mem-2',
 name: 'Aritro Roy',
 email: 'aritro@5bloc.com',
 role: 'consultant',
 lastActive: '2 hrs ago',
 can_upload: true,
 can_comment: true,
 can_approve: false,
 status: 'active',
 },
 {
 id: 'mem-3',
 name: 'Amit Sharma',
 email: 'amit.civil@gmail.com',
 role: 'contractor',
 lastActive: '1 day ago',
 can_upload: true,
 can_comment: true,
 can_approve: false,
 status: 'active',
 },
 {
 id: 'mem-4',
 name: 'Karan Shah (Builder)',
 email: 'karan@karanbuilders.com',
 role: 'builder',
 lastActive: 'Pending invite',
 can_upload: false,
 can_comment: true,
 can_approve: true,
 status: 'pending',
 }
 ])
 setLoading(false)
 }, 300)
 return () => clearTimeout(timer)
 }, [projectId])

 const handleInviteSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!inviteEmail) return
 setSendingInvite(true)

 try {
 // Simulate API call for invitation with Resend email notification
 await new Promise(resolve => setTimeout(resolve, 1000))

 const newMember: Member = {
 id: `mem-${Date.now()}`,
 name: inviteEmail.split('@')[0],
 email: inviteEmail,
 role: inviteRole,
 lastActive: 'Pending invite',
 can_upload: inviteRole !== 'client',
 can_comment: true,
 can_approve: inviteRole === 'builder' || inviteRole === 'client',
 status: 'pending'
 }

 setMembers(prev => [...prev, newMember])
 setInviteEmail('')

 // Auto check checklist widget task in localStorage
 const savedChecklist = localStorage.getItem('onboarding_checklist_v1')
 if (savedChecklist) {
 const parsed = JSON.parse(savedChecklist)
 parsed.invite = true
 localStorage.setItem('onboarding_checklist_v1', JSON.stringify(parsed))
 }

 alert(`Invitation sent successfully to ${inviteEmail} via Resend.`)
 } catch (err) {
 console.error(err)
 } finally {
 setSendingInvite(false)
 }
 }

 const handleToggleAccess = (memberId: string, field: 'can_upload' | 'can_comment' | 'can_approve') => {
 setMembers(prev => 
 prev.map(m => m.id === memberId ? { ...m, [field]: !m[field] } : m)
 )
 }

 const handleRemoveMember = (memberId: string) => {
 if (confirm('Are you sure you want to remove this member?')) {
 setMembers(prev => prev.filter(m => m.id !== memberId))
 }
 }

 const getRoleBadge = (role: Member['role']) => {
 switch (role) {
 case 'architect': return 'bg-amber/15 text-amber '
 case 'contractor': return 'bg-blue/10 text-blue '
 case 'builder': return 'bg-success/10 text-success '
 case 'consultant': return 'bg-stone/10 text-stone '
 case 'client': return 'bg-slate/15 text-white '
 }
 }

 const activeMembers = members.filter(m => m.status === 'active')
 const pendingInvites = members.filter(m => m.status === 'pending')

 return (
 <div className="space-y-8 font-body select-none">
 
 {/* 2-Column Split: Members List (Left) + Invite Form (Right) */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
 
 {/* Members registry list table */}
 <div className="card-5bloc lg:col-span-2 space-y-4">
 <div>
 <h3 className="text-sm font-bold uppercase text-white font-mono">Project Members</h3>
 <p className="text-[11px] text-stone mt-0.5">Configure access roles and permissions per project collaborator.</p>
 </div>

 {loading ? (
 <div className="p-8 text-center text-stone animate-pulse">Loading members directory...</div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs ">
 <thead>
 <tr className="text-stone border-b font-mono uppercase text-[10px] tracking-wider">
 <th className="pb-3 pl-2">Name / Email</th>
 <th className="pb-3">Role</th>
 <th className="pb-3">Upload</th>
 <th className="pb-3">Comment</th>
 <th className="pb-3">Approve</th>
 <th className="pb-3 pr-2 text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-navy-lt/40">
 {activeMembers.map((member) => (
 <tr key={member.id} className="hover:bg-navy-lt/20 transition-colors">
 <td className="py-4 pl-2 pr-4">
 <div className="flex items-center gap-2.5">
 <div className="w-7 h-7 rounded-full bg-navy border flex items-center justify-center font-bold text-[10px] text-amber uppercase shrink-0">
 {member.name.slice(0, 2)}
 </div>
 <div>
 <h4 className="text-white font-semibold">{member.name}</h4>
 <p className="text-[10px] text-stone font-mono mt-0.5">{member.email}</p>
 </div>
 </div>
 </td>

 <td className="py-4">
 <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border capitalize ${getRoleBadge(member.role)}`}>
 {member.role}
 </span>
 </td>

 {/* Permission toggles */}
 <td className="py-4">
 <input
 type="checkbox"
 checked={member.can_upload}
 disabled={member.role === 'architect'}
 onChange={() => handleToggleAccess(member.id, 'can_upload')}
 className="rounded bg-navy accent-amber w-4 h-4 cursor-pointer disabled:opacity-40"
 />
 </td>
 <td className="py-4">
 <input
 type="checkbox"
 checked={member.can_comment}
 disabled={member.role === 'architect'}
 onChange={() => handleToggleAccess(member.id, 'can_comment')}
 className="rounded bg-navy accent-amber w-4 h-4 cursor-pointer disabled:opacity-40"
 />
 </td>
 <td className="py-4">
 <input
 type="checkbox"
 checked={member.can_approve}
 disabled={member.role === 'architect'}
 onChange={() => handleToggleAccess(member.id, 'can_approve')}
 className="rounded bg-navy accent-amber w-4 h-4 cursor-pointer disabled:opacity-40"
 />
 </td>

 <td className="py-4 pr-2 text-right">
 {member.role !== 'architect' && (
 <button 
 onClick={() => handleRemoveMember(member.id)}
 className="p-1 rounded text-stone hover:text-error hover:bg-navy-lt transition"
 title="Remove Member"
 >
 <span className="material-icons-outlined text-[16px]">person_remove</span>
 </button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* Invite Member form block */}
 <div className="card-5bloc space-y-4">
 <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber border-b pb-2 mb-2">Invite Collaborator</h3>
 
 <form onSubmit={handleInviteSubmit} className="space-y-4">
 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Email Address *</label>
 <input
 type="email"
 required
 placeholder="e.g. contractor@firm.com"
 value={inviteEmail}
 onChange={(e) => setInviteEmail(e.target.value)}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>

 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Select Access Role</label>
 <select
 value={inviteRole}
 onChange={(e) => setInviteRole(e.target.value as any)}
 className="input-5bloc py-1.5 text-xs font-medium"
 >
 <option value="contractor">Contractor (Invites, Bidding, RFIs)</option>
 <option value="consultant">Consultant (Engineering review, RFIs)</option>
 <option value="builder">Builder (Portfolio view & approvals)</option>
 <option value="client">Client Portal Link (Read-only reviews)</option>
 </select>
 </div>

 <button
 type="submit"
 disabled={sendingInvite}
 className="w-full btn-primary py-2 text-xs font-bold mt-2"
 >
 {sendingInvite ? 'SENDING INVITE...' : 'SEND INVITE LINK'}
 </button>
 </form>
 </div>

 </div>

 {/* Pending invitations table card */}
 {pendingInvites.length > 0 && (
 <div className="card-5bloc space-y-4">
 <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-stone border-b pb-2">Pending Invitation Requests</h3>
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs ">
 <thead>
 <tr className="text-stone border-b font-mono uppercase text-[10px]">
 <th className="pb-3 pl-2">Email</th>
 <th className="pb-3">Invited Role</th>
 <th className="pb-3">Sent Status</th>
 <th className="pb-3 pr-2 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-navy-lt/40">
 {pendingInvites.map((invite) => (
 <tr key={invite.id} className="hover:bg-navy-lt/20 transition-colors">
 <td className="py-3 pl-2 font-medium text-white">{invite.email}</td>
 <td className="py-3">
 <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border capitalize ${getRoleBadge(invite.role)}`}>
 {invite.role}
 </span>
 </td>
 <td className="py-3">
 <span className="text-stone italic text-[11px] font-mono">Awaiting signup acceptance</span>
 </td>
 <td className="py-3 pr-2 text-right space-x-2">
 <button 
 onClick={() => alert(`Re-sent invitation email via Resend to ${invite.email}`)}
 className="btn-secondary py-1 px-3 text-[10px] font-semibold"
 >
 RESEND
 </button>
 <button 
 onClick={() => setMembers(prev => prev.filter(m => m.id !== invite.id))}
 className="text-stone hover:text-error transition font-semibold text-xs p-1"
 >
 REVOKE
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 </div>
 )
}
