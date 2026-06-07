'use client'

import React, { useState } from 'react'

interface EmailComposerProps {
 to: string
 subject: string
 defaultBody?: string
 onClose: () => void
 onSent?: (messageId: string) => void
}

export default function EmailComposer({
 to: initialTo,
 subject: initialSubject,
 defaultBody = '',
 onClose,
 onSent
}: EmailComposerProps) {
 const [to, setTo] = useState(initialTo)
 const [subject, setSubject] = useState(initialSubject)
 const [body, setBody] = useState(defaultBody)
 const [sending, setSending] = useState(false)
 const [error, setError] = useState<string | null>(null)

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setSending(true)
 setError(null)

 try {
 // Build a simple responsive HTML body template matching 5Bloc style
 const htmlContent = `
 <div style="background-color: #0C1220; color: #F7F5F0; font-family: sans-serif; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; box-sizing: border-box; border: 1px solid #1C2A3E;">
 <h2 style="font-size: 20px; font-weight: bold; color: #F5A623; margin-top: 0; margin-bottom: 16px;">5Bloc Workspace Message</h2>
 <p style="font-size: 14px; line-height: 1.6; color: #EDE9E2; white-space: pre-wrap; margin-bottom: 24px;">${body}</p>
 <div style="border-top: 1px solid #1C2A3E; padding-top: 16px; font-size: 11px; color: #9E9687;">
 <p style="margin: 0;">Sent directly from the 5Bloc workspace registry.</p>
 </div>
 </div>
 `

 const res = await fetch('/api/send-email', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ to, subject, htmlContent })
 })

 const data = await res.json()

 if (!res.ok) {
 throw new Error(data.error || 'Failed to dispatch email')
 }

 alert('Email notification sent successfully!')
 if (onSent && data.messageId) {
 onSent(data.messageId)
 }
 onClose()
 } catch (err: any) {
 console.error(err)
 setError(err.message || 'An error occurred while sending the email.')
 } finally {
 setSending(false)
 }
 }

 return (
 <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 select-none" style={{ background: 'rgba(12,14,14,0.80)', backdropFilter: 'blur(6px)' }}>
 <div className="w-full max-w-lg p-6 relative animate-fade-in" style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-4)' }}>
 
 {/* Header */}
 <div className="flex items-center justify-between pb-3.5 mb-4" style={{ boxShadow: '0 1px 0 rgba(159,142,122,0.10)' }}>
 <div className="flex items-center gap-2">
 <span className="material-icons-outlined text-amber text-[20px]">mail</span>
 <h3 className="text-sm font-semibold text-white">Send In-App Email</h3>
 </div>
 <button type="button" onClick={onClose} style={{ color: 'var(--stone)' }}>
 <span className="material-icons-outlined text-[20px]">close</span>
 </button>
 </div>

 {/* Error message */}
 {error && (
 <div className="mb-4 p-3 text-xs" style={{ background: 'rgba(255,180,171,.10)', color: 'var(--error)', boxShadow: 'var(--shadow-1)' }}>
 {error}
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-[10px] font-semibold text-stone mb-1 font-body">Recipient Email *</label>
 <input
 type="email"
 required
 placeholder="recipient@example.com"
 value={to}
 onChange={(e) => setTo(e.target.value)}
 className="input-5bloc py-2 text-xs font-mono"
 />
 </div>

 <div>
 <label className="block text-[10px] font-semibold text-stone mb-1 font-body">Subject *</label>
 <input
 type="text"
 required
 placeholder="e.g. Update regarding Drawing sheet v3"
 value={subject}
 onChange={(e) => setSubject(e.target.value)}
 className="input-5bloc py-2 text-xs"
 />
 </div>

 <div>
 <label className="block text-[10px] font-semibold text-stone mb-1 font-body">Message Body *</label>
 <textarea
 required
 rows={6}
 placeholder="Type your email content here..."
 value={body}
 onChange={(e) => setBody(e.target.value)}
 className="input-5bloc text-xs resize-none"
 />
 </div>

 {/* Action buttons */}
 <div className="pt-4 flex justify-end gap-3" style={{ boxShadow: '0 -1px 0 rgba(159,142,122,0.10)' }}>
 <button 
 type="button" 
 onClick={onClose}
 disabled={sending}
 className="btn-secondary py-1.5 px-4 text-xs"
 >
 Cancel
 </button>
 <button 
 type="submit"
 disabled={sending}
 className="btn-primary py-1.5 px-6 text-xs font-bold min-w-[120px]"
 >
 {sending ? 'Sending...' : 'Send Notification'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )
}
