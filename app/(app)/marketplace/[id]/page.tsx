'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface ContractorDetail {
 id: string
 company_name: string
 bio: string
 specializations: string[]
 service_cities: string[]
 years_experience: number
 verified: boolean
 rating: number
 reviews_count: number
 jobs_completed: number
 team_size: number
 website: string
 portfolio: { title: string; image: string }[]
 reviews: { clientName: string; rating: number; text: string; date: string }[]
}

export default function ContractorProfile() {
 const params = useParams()
 const router = useRouter()
 const contractorId = params.id as string

 const [contractor, setContractor] = useState<ContractorDetail | null>(null)
 const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about')

 useEffect(() => {
 // Mock load contractor profile
 setContractor({
 id: contractorId,
 company_name: 'Amit Sharma Civil Construction Ltd.',
 bio: 'Specialists in foundation layouts, reinforced cement concrete (RCC) frames, structural layout alignments, and block masonry in Mumbai. Serving premium residential developments for over a decade.',
 specializations: ['Civil', 'Foundation', 'Masonry', 'RCC Structs'],
 service_cities: ['Mumbai', 'Thane', 'Pune'],
 years_experience: 12,
 verified: true,
 rating: 4.8,
 reviews_count: 14,
 jobs_completed: 38,
 team_size: 45,
 website: 'www.amitsharmaconstruction.in',
 portfolio: [
 { title: 'Bandra Luxury Villa Substructure', image: 'https://dummyimage.com/600x400/0c1220/f5a623.png&text=Substructure_Bandra' },
 { title: 'Juhu Residential RCC Framing', image: 'https://dummyimage.com/600x400/0c1220/f5a623.png&text=Framing_Juhu' },
 { title: 'Thane Warehousing Foundations', image: 'https://dummyimage.com/600x400/0c1220/f5a623.png&text=Foundation_Thane' },
 ],
 reviews: [
 { clientName: 'Karan Shah (Builder)', rating: 5, text: 'Amit Sharma delivered the concrete frame structure exactly on timeline specifications. Excellent coordination on concrete slip tests.', date: '2026-04-12' },
 { clientName: 'Parth Patel (Architect)', rating: 4, text: 'Strong structural brickwork layouts. RFIs were resolved efficiently. Highly recommended for Bandra area developments.', date: '2026-03-20' },
 ]
 })
 }, [contractorId])

 if (!contractor) {
 return (
 <div className="p-8 text-center text-stone animate-pulse">
 Loading contractor profile...
 </div>
 )
 }

 return (
 <div className="p-6 font-body select-none max-w-6xl mx-auto space-y-6">
 {/* Header breadcrumb back link */}
 <div>
 <Link href="/marketplace" className="text-xs text-stone hover:text-amber transition-colors flex items-center gap-1">
 <span className="material-icons-outlined text-[14px]">arrow_back</span> BACK TO MARKETPLACE
 </Link>
 </div>

 {/* Profile Header section */}
 <div className="card-5bloc flex flex-col md:flex-row justify-between gap-6">
 <div className="space-y-3">
 <div className="flex flex-wrap items-center gap-2.5">
 <span className="text-[10px] font-mono text-stone uppercase bg-navy px-2.5 py-0.5 rounded border ">
 Contractor
 </span>
 {contractor.verified && (
 <span className="text-[10px] font-mono text-success bg-success/15 border px-2 py-0.5 rounded flex items-center gap-0.5 font-semibold">
 <span className="material-icons-outlined text-[12px]">verified</span> VERIFIED PARTNER
 </span>
 )}
 </div>
 
 <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide">{contractor.company_name}</h1>
 
 <div className="flex flex-wrap items-center gap-1.5 pt-1">
 {contractor.specializations.map(s => (
 <span key={s} className="bg-navy border text-amber text-[9px] font-mono px-2.5 py-0.5 rounded uppercase">
 {s}
 </span>
 ))}
 </div>
 </div>

 {/* Overview quick ratings right */}
 <div className="flex flex-col md:items-end justify-center shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
 <div className="flex items-center gap-1 text-amber">
 <span className="material-icons-outlined text-[20px]">star</span>
 <span className="text-xl font-bold text-white">{contractor.rating}</span>
 <span className="text-stone text-xs">/ 5.0</span>
 </div>
 <p className="text-xs text-stone font-mono mt-1">{contractor.reviews_count} reviews • {contractor.jobs_completed} jobs completed</p>
 </div>
 </div>

 {/* Main content grid splitter */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
 
 {/* Main Tab displays (Left Col Span 2) */}
 <div className="md:col-span-2 space-y-6">
 {/* Tab Navigation header */}
 <div className="flex gap-6 border-b pb-2.5">
 {[
 { id: 'about', label: 'About' },
 { id: 'portfolio', label: 'Portfolio Projects' },
 { id: 'reviews', label: 'Client Reviews' },
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={`text-xs font-semibold pb-1.5 border-b-2 transition-all uppercase tracking-wider ${
 activeTab === tab.id 
 ? ' text-amber font-bold' 
 : ' text-stone hover:text-white'
 }`}
 >
 {tab.label}
 </button>
 ))}
 </div>

 {/* Tab contents */}
 <div className="min-h-[220px]">
 {activeTab === 'about' && (
 <div className="card-5bloc space-y-4">
 <div>
 <h4 className="text-xs font-bold text-stone font-mono uppercase mb-2">Company Biography</h4>
 <p className="text-xs text-white leading-relaxed">{contractor.bio}</p>
 </div>
 <div className="grid grid-cols-2 gap-4 pt-3 border-t text-xs">
 <div>
 <span className="text-stone font-mono text-[10px] uppercase block">Experience</span>
 <span className="font-semibold text-white mt-1.5 block">{contractor.years_experience} Years</span>
 </div>
 <div>
 <span className="text-stone font-mono text-[10px] uppercase block">Office Location</span>
 <span className="font-semibold text-white mt-1.5 block">{contractor.service_cities.join(', ')}</span>
 </div>
 <div>
 <span className="text-stone font-mono text-[10px] uppercase block">Est. Team Size</span>
 <span className="font-semibold text-white mt-1.5 block">{contractor.team_size} Skilled Craftsmen</span>
 </div>
 <div>
 <span className="text-stone font-mono text-[10px] uppercase block">Web URL</span>
 <span className="font-semibold text-blue hover:underline mt-1.5 block cursor-pointer">{contractor.website}</span>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'portfolio' && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
 {contractor.portfolio.map((port, idx) => (
 <div key={idx} className="card-5bloc p-0.5 overflow-hidden border rounded">
 <img 
 src={port.image} 
 alt={port.title}
 className="w-full h-36 object-cover border-b rounded-t"
 />
 <div className="p-3">
 <h4 className="text-xs font-bold text-white truncate">{port.title}</h4>
 <p className="text-[10px] text-stone font-mono mt-1">Verified Project Work</p>
 </div>
 </div>
 ))}
 </div>
 )}

 {activeTab === 'reviews' && (
 <div className="space-y-4">
 {contractor.reviews.map((rev, idx) => (
 <div key={idx} className="card-5bloc space-y-2">
 <div className="flex justify-between items-start">
 <div>
 <h4 className="text-xs font-bold text-white">{rev.clientName}</h4>
 <span className="text-[10px] text-stone font-mono mt-0.5 block">Review Date: {rev.date}</span>
 </div>
 <div className="flex items-center text-amber text-xs font-mono font-bold">
 {'★'.repeat(rev.rating)}
 </div>
 </div>
 <p className="text-xs text-stone leading-relaxed italic">"{rev.text}"</p>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Sidebar invitation (Right Col Span 1) */}
 <div className="card-5bloc space-y-4">
 <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber border-b pb-2">Invite Contractor</h3>
 <p className="text-xs text-stone leading-relaxed">
 Invite this contractor to bid on your active projects. They will be notified via email and receive draft access to files.
 </p>
 <div className="space-y-3.5 pt-2">
 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Select Project *</label>
 <select className="input-5bloc py-1.5 text-xs font-medium">
 <option value="proj-1">Wadhwa Prime Plaza</option>
 <option value="proj-2">Lodha Signature Residences</option>
 <option value="proj-3">Gundecha Industrial Park</option>
 </select>
 </div>
 
 <button
 onClick={() => {
 alert(`Invitation sent successfully to Amit Sharma Civil Construction Ltd.`)
 router.push('/marketplace')
 }}
 className="w-full btn-primary py-2.5 text-xs font-bold"
 >
 SEND DIRECT INVITATION
 </button>
 </div>
 </div>

 </div>
 </div>
 )
}
