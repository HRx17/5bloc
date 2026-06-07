'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/brand/LogoMark'

export default function Onboarding() {
 const router = useRouter()
 const [step, setStep] = useState(1)
 const [formData, setFormData] = useState({
 name: 'Parth Patel',
 email: 'architect@5bloc.com',
 firmName: '',
 city: '',
 state: '',
 firmType: 'both', // residential / commercial / both
 gstNumber: '',
 logoUrl: null,
 })

 const [loading, setLoading] = useState(false)

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 const { name, value } = e.target
 setFormData((prev) => ({ ...prev, [name]: value }))
 }

 const nextStep = () => setStep((s) => s + 1)
 const prevStep = () => setStep((s) => s - 1)

 const handleFinish = async () => {
 setLoading(true)
 
 try {
 console.log('Submitting onboarding:', formData)
 
 // Simulate API call for organisation & milestone creation
 await new Promise((resolve) => setTimeout(resolve, 1500))
 
 // Initialize checklist state in localStorage
 localStorage.setItem('onboarding_checklist_v1', JSON.stringify({
 client: false,
 project: false,
 document: false,
 ai: false,
 invite: false
 }))
 
 router.push('/dashboard')
 } catch (err) {
 console.error(err)
 } finally {
 setLoading(false)
 }
 }

 return (
 <div className="min-h-screen bg-navy flex items-center justify-center px-4 relative overflow-hidden font-body text-white">
 {/* Visual Dot Grid Background Accent */}
 <div className="absolute inset-0 opacity-15 pointer-events-none">
 <div className="w-full h-full bg-[radial-gradient(#f5a623_1px,transparent_1px)] [background-size:24px_24px]" />
 </div>

 <div className="w-full max-w-xl bg-navy-mid shadow-none overflow-hidden relative z-10">
 
 {/* Step Indicator Header */}
 <div className="px-8 pt-8 flex items-center justify-between">
 <Logo size={32} showTagline={false} />
 <div className="flex items-center gap-1.5 font-mono text-[10px] text-stone">
 <span className={step >= 1 ? 'text-amber font-bold' : ''}>STEP 1</span>
 <span>•</span>
 <span className={step >= 2 ? 'text-amber font-bold' : ''}>STEP 2</span>
 <span>•</span>
 <span className={step >= 3 ? 'text-amber font-bold' : ''}>STEP 3</span>
 </div>
 </div>

 {/* Steps Content wrapping with Framer Motion AnimatePresence */}
 <div className="p-8 min-h-[360px] flex flex-col justify-between">
 <AnimatePresence mode="wait">
 {step === 1 && (
 <motion.div
 key="step1"
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 transition={{ duration: 0.2 }}
 className="space-y-5"
 >
 <div>
 <h1 className="text-xl font-bold mb-1.5">Welcome to 5Bloc</h1>
 <p className="text-xs text-stone">Let's verify your basic profile information to start.</p>
 </div>
 <div className="space-y-4 pt-2">
 <div>
 <label className="block text-stone text-xs font-bold uppercase tracking-wider mb-1.5 font-mono">Your Name</label>
 <input
 type="text"
 name="name"
 value={formData.name}
 onChange={handleInputChange}
 className="input-5bloc"
 placeholder="Enter your full name"
 />
 </div>
 <div>
 <label className="block text-stone text-xs font-bold uppercase tracking-wider mb-1.5 font-mono">Email Address</label>
 <input
 type="email"
 name="email"
 value={formData.email}
 onChange={handleInputChange}
 className="input-5bloc opacity-60 cursor-not-allowed"
 disabled
 />
 </div>
 </div>
 
 <div className="pt-6 flex justify-end">
 <button onClick={nextStep} className="btn-primary px-8">
 CONTINUE <span className="material-icons-outlined text-[14px]">arrow_forward</span>
 </button>
 </div>
 </motion.div>
 )}

 {step === 2 && (
 <motion.div
 key="step2"
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 transition={{ duration: 0.2 }}
 className="space-y-5"
 >
 <div>
 <h1 className="text-xl font-bold mb-1.5">Set up your architecture firm</h1>
 <p className="text-xs text-stone">Enter details to brand your invoices and client portal.</p>
 </div>
 <div className="space-y-4 pt-1 max-h-[300px] overflow-y-auto pr-1">
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <label className="block text-stone text-xs font-bold uppercase tracking-wider mb-1.5 font-mono">Firm Name *</label>
 <input
 type="text"
 name="firmName"
 required
 value={formData.firmName}
 onChange={handleInputChange}
 className="input-5bloc"
 placeholder="e.g. Apex Design Architects"
 />
 </div>
 <div>
 <label className="block text-stone text-xs font-bold uppercase tracking-wider mb-1.5 font-mono">City *</label>
 <input
 type="text"
 name="city"
 required
 value={formData.city}
 onChange={handleInputChange}
 className="input-5bloc"
 placeholder="e.g. Mumbai"
 />
 </div>
 <div>
 <label className="block text-stone text-xs font-bold uppercase tracking-wider mb-1.5 font-mono">State</label>
 <input
 type="text"
 name="state"
 value={formData.state}
 onChange={handleInputChange}
 className="input-5bloc"
 placeholder="e.g. Maharashtra"
 />
 </div>
 </div>

 <div>
 <label className="block text-stone text-xs font-bold uppercase tracking-wider mb-1.5 font-mono">Firm Specialisation</label>
 <select
 name="firmType"
 value={formData.firmType}
 onChange={handleInputChange}
 className="input-5bloc"
 >
 <option value="residential">Residential Projects Only</option>
 <option value="commercial">Commercial Projects Only</option>
 <option value="both">Both Residential & Commercial</option>
 </select>
 </div>

 <div>
 <label className="block text-stone text-xs font-bold uppercase tracking-wider mb-1.5 font-mono">GSTIN Number (Optional)</label>
 <input
 type="text"
 name="gstNumber"
 value={formData.gstNumber}
 onChange={handleInputChange}
 className="input-5bloc font-mono"
 placeholder="e.g. 27AAAAA1111A1Z1"
 />
 </div>
 </div>

 <div className="pt-6 flex items-center justify-between ">
 <button onClick={prevStep} className="btn-secondary px-6">
 <span className="material-icons-outlined text-[14px]">arrow_back</span> BACK
 </button>
 <button 
 onClick={nextStep} 
 disabled={!formData.firmName || !formData.city}
 className="btn-primary px-8"
 >
 CONTINUE <span className="material-icons-outlined text-[14px]">arrow_forward</span>
 </button>
 </div>
 </motion.div>
 )}

 {step === 3 && (
 <motion.div
 key="step3"
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 transition={{ duration: 0.2 }}
 className="space-y-6"
 >
 <div>
 <h1 className="text-xl font-bold mb-1.5">You're all set!</h1>
 <p className="text-xs text-stone">5Bloc is customized to match your professional role.</p>
 </div>

 {/* Role Confirmation Card */}
 <div className="p-6 bg-navy flex items-start gap-4">
 <div className="w-12 h-12 bg-amber/10 border text-amber flex items-center justify-center shrink-0">
 <span className="material-icons-outlined text-[28px]">architecture</span>
 </div>
 <div>
 <h3 className="text-sm font-bold text-white mb-1">Configured as: Architect (Firm Owner)</h3>
 <p className="text-xs text-stone leading-relaxed">
 You will have owner access to the workspace. You can invite contractors, consultants, and clients to coordinate files and milestones.
 </p>
 </div>
 </div>

 <div className="pt-6 flex items-center justify-between ">
 <button onClick={prevStep} className="btn-secondary px-6" disabled={loading}>
 <span className="material-icons-outlined text-[14px]">arrow_back</span> BACK
 </button>
 <button 
 onClick={handleFinish} 
 disabled={loading}
 className="btn-primary px-8 py-3"
 >
 {loading ? 'SETTING UP WORKSPACE...' : 'SET UP MY WORKSPACE →'}
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 </div>
 </div>
 )
}

