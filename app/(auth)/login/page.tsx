'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/brand/LogoMark'

export default function Login() {
 const router = useRouter()
 const [formData, setFormData] = useState({ email: '', password: '' })
 const [showPassword, setShowPassword] = useState(false)
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState('')

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const { name, value } = e.target
 setFormData((prev) => ({ ...prev, [name]: value }))
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setLoading(true)
 setError('')

 try {
 // Offline fallback / mock check
 console.log('User logging in:', formData)
 
 // Simulate API call
 await new Promise((resolve) => setTimeout(resolve, 1000))
 
 // Navigate to dashboard
 router.push('/dashboard')
 } catch (err) {
 setError('Invalid email or password.')
 } finally {
 setLoading(false)
 }
 }

 return (
 <div className="min-h-screen bg-navy flex items-center justify-center px-4 relative overflow-hidden font-body">
 {/* Visual Dot Grid Background Accent */}
 <div className="absolute inset-0 opacity-15 pointer-events-none">
 <div className="w-full h-full bg-[radial-gradient(#f5a623_1px,transparent_1px)] [background-size:24px_24px]" />
 </div>

 <div className="w-full max-w-md bg-navy-mid p-8 shadow-none relative z-10">
 {/* Logo Header */}
 <div className="flex flex-col items-center mb-8">
 <Logo size={48} showTagline={true} />
 <h2 className="text-stone text-xs mt-3 uppercase tracking-wider font-mono">Sign in to your account</h2>
 </div>

 {error && (
 <div className="mb-4 p-3 bg-error/10 border text-error text-xs font-semibold flex items-center gap-2">
 <span className="material-icons-outlined text-[16px]">error</span>
 <span>{error}</span>
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-stone text-xs font-bold uppercase tracking-wider mb-1.5 font-mono">Email Address</label>
 <input
 type="email"
 name="email"
 required
 placeholder="architect@firm.com"
 value={formData.email}
 onChange={handleInputChange}
 className="input-5bloc"
 />
 </div>

 <div>
 <div className="flex justify-between items-center mb-1.5">
 <label className="block text-stone text-xs font-bold uppercase tracking-wider font-mono">Password</label>
 <Link href="/forgot-password" className="text-[11px] text-blue hover:text-blue-lt transition">
 Forgot password?
 </Link>
 </div>
 <div className="relative">
 <input
 type={showPassword ? 'text' : 'password'}
 name="password"
 required
 placeholder="••••••••"
 value={formData.password}
 onChange={handleInputChange}
 className="input-5bloc pr-10"
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-white transition"
 >
 <span className="material-icons-outlined text-[18px]">
 {showPassword ? 'visibility_off' : 'visibility'}
 </span>
 </button>
 </div>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full btn-primary font-bold tracking-wider mt-2 py-3"
 >
 {loading ? 'SIGNING IN...' : 'SIGN IN'}
 </button>
 </form>

 <div className="relative flex py-5 items-center">
 <div className="flex-grow "></div>
 <span className="flex-shrink mx-4 text-[10px] text-stone font-mono uppercase">or continue with</span>
 <div className="flex-grow "></div>
 </div>

 {/* Google OAuth Button */}
 <button
 onClick={() => {
 console.log('Google Auth clicked')
 router.push('/dashboard')
 }}
 className="w-full btn-secondary text-xs flex items-center justify-center gap-2 py-2.5"
 >
 <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
 <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.487 0-6.321-2.833-6.321-6.32 0-3.488 2.834-6.322 6.32-6.322 1.567 0 2.993.57 4.11 1.51l3.076-3.078C19.336 2.54 16.036 1.2 12.24 1.2 6.208 1.2 1.2 6.208 1.2 12.24s5.008 11.04 11.04 11.04c5.787 0 10.51-4.11 10.51-10.51 0-.64-.078-1.285-.21-1.92L12.24 10.285z" />
 </svg>
 GOOGLE SINGLE SIGN-ON
 </button>

 <div className="mt-8 text-center text-xs text-stone">
 New to 5Bloc?{' '}
 <Link href="/signup" className="text-blue hover:text-blue-lt font-semibold transition-colors">
 Create account →
 </Link>
 </div>
 </div>
 </div>
 )
}

