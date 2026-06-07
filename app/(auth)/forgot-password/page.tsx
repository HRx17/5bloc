'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/brand/LogoMark'

export default function ForgotPassword() {
 const [email, setEmail] = useState('')
 const [submitted, setSubmitted] = useState(false)
 const [loading, setLoading] = useState(false)

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setLoading(true)

 // Simulate API call
 await new Promise((resolve) => setTimeout(resolve, 1000))
 setSubmitted(true)
 setLoading(false)
 }

 return (
 <div className="min-h-screen bg-navy flex items-center justify-center px-4 relative overflow-hidden font-body">
 <div className="absolute inset-0 opacity-15 pointer-events-none">
 <div className="w-full h-full bg-[radial-gradient(#f5a623_1px,transparent_1px)] [background-size:24px_24px]" />
 </div>

 <div className="w-full max-w-md bg-navy-mid p-8 shadow-none relative z-10">
 <div className="flex flex-col items-center mb-8">
 <Logo size={48} showTagline={true} />
 <h2 className="text-stone text-xs mt-3 uppercase tracking-wider font-mono">Reset Password</h2>
 </div>

 {submitted ? (
 <div className="space-y-4 text-center">
 <div className="w-12 h-12 bg-success/10 border text-success flex items-center justify-center mx-auto mb-2">
 <span className="material-icons-outlined text-[24px]">mark_email_read</span>
 </div>
 <h3 className="text-base font-semibold text-white">Check your email</h3>
 <p className="text-xs text-stone leading-relaxed">
 We've sent a password reset link to <span className="text-white font-medium">{email}</span>. 
 Please check your inbox and follow the instructions.
 </p>
 <div className="pt-4">
 <Link href="/login" className="btn-primary w-full py-2.5">
 RETURN TO LOGIN
 </Link>
 </div>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="space-y-4">
 <p className="text-xs text-stone text-center leading-relaxed">
 Enter your email address and we will send you a secure link to reset your password.
 </p>

 <div>
 <label className="block text-stone text-xs font-bold uppercase tracking-wider mb-1.5 font-mono">Email Address</label>
 <input
 type="email"
 required
 placeholder="architect@firm.com"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="input-5bloc"
 />
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full btn-primary font-bold tracking-wider mt-2 py-3"
 >
 {loading ? 'SENDING RESET LINK...' : 'SEND RESET LINK'}
 </button>

 <div className="text-center pt-2">
 <Link href="/login" className="text-xs text-stone hover:text-white transition-colors">
 ← Back to Login
 </Link>
 </div>
 </form>
 )}
 </div>
 </div>
 )
}

