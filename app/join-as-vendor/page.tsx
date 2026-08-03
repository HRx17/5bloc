'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Loader2, Upload, X } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import {
  EMPTY_CATALOG_STATE,
  submitVendorCatalog,
  VendorCatalogImport,
  type CatalogImportState,
} from '@/components/catalog/VendorCatalogImport'
import {
  PartnerChipGrid,
  PartnerCountryToggle,
  PartnerField,
  PartnerHero,
  PartnerSection,
  PartnerSignupFooter,
  PartnerSignupHeader,
  PartnerSubmitRow,
  PartnerSuccess,
  partnerInputProps,
  usePartnerPageScroll,
  type PartnerCountry,
} from '@/components/site/PartnerSignupChrome'
import '../landing.css'

const CATEGORIES = [
  'Building Materials',
  'Steel & Metal',
  'Timber & Wood',
  'Glass & Aluminium',
  'Tiles & Flooring',
  'Electrical Supplies',
  'Lighting & Fixtures',
  'Plumbing & HVAC',
  'Sanitary Ware',
  'Paint & Finishes',
  'Hardware & Fasteners',
  'Safety Equipment',
  'Construction Machinery',
  'Insulation & Waterproofing',
  'Landscaping Supplies',
  'Solar & Renewables',
]

const TEAM_SIZES = ['Just me', '2–10', '11–50', '51–200', '200+']

interface PhotoItem {
  id: string
  preview: string
  url?: string
  uploading: boolean
  failed?: boolean
}

export default function JoinAsVendor() {
  usePartnerPageScroll()

  const input = partnerInputProps()
  const [step, setStep] = useState<1 | 2>(1)
  const [country, setCountry] = useState<PartnerCountry>('india')
  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [stateRegion, setStateRegion] = useState('')
  const [cats, setCats] = useState<string[]>([])
  const [teamSize, setTeamSize] = useState('')
  const [years, setYears] = useState('')
  const [website, setWebsite] = useState('')
  const [bio, setBio] = useState('')
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [catalog, setCatalog] = useState<CatalogImportState>(EMPTY_CATALOG_STATE)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const toggleCat = (c: string) =>
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  async function handleFiles(files: FileList | null) {
    if (!files) return
    const incoming = Array.from(files).slice(0, 6 - photos.length)
    for (const file of incoming) {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const preview = URL.createObjectURL(file)
      setPhotos((prev) => [...prev, { id, preview, uploading: true }])
      try {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/public/contractor-photo', { method: 'POST', body: form })
        const json = await res.json()
        if (res.ok && json.url) {
          setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, uploading: false, url: json.url } : p)))
        } else {
          setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, uploading: false, failed: !json.skippable } : p)))
        }
      } catch {
        setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, uploading: false, failed: true } : p)))
      }
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  function validateProfile(): string | null {
    if (!businessName.trim() || !contactName.trim() || !email.trim() || !city.trim()) {
      return 'Please fill in the required fields.'
    }
    if (cats.length === 0) return 'Pick at least one product / supply category.'
    if (photos.some((p) => p.uploading)) return 'Please wait for photos to finish uploading.'
    return null
  }

  function goToCatalog(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const err = validateProfile()
    if (err) {
      setError(err)
      return
    }
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const profileErr = validateProfile()
    if (profileErr) {
      setError(profileErr)
      setStep(1)
      return
    }
    if (catalog.method === 'csv' && catalog.itemCount === 0) {
      setError('Upload a CSV, or choose “Link your live catalogue” / “Skip for now”.')
      return
    }
    if (catalog.method === 'url' && !catalog.sourceUrl.trim()) {
      setError('Paste a catalogue URL, or choose another import option.')
      return
    }

    setBusy(true)
    try {
      const supabase = createSupabaseClient()
      const basePayload = {
        business_name: businessName.trim(),
        contact_name: contactName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        country,
        city: city.trim(),
        state: stateRegion.trim() || null,
        categories: cats,
        team_size: teamSize || null,
        years_experience: years ? parseInt(years, 10) : null,
        website: (catalog.method === 'url' ? catalog.sourceUrl.trim() : website.trim()) || null,
        bio: bio.trim() || null,
        photos: photos.filter((p) => p.url).map((p) => p.url as string),
        source: 'join-as-vendor',
      }

      // Prefer enriched insert (migration applied); fall back if columns missing
      let signupId: string | null = null
      const enriched = {
        ...basePayload,
        catalog_method: catalog.method,
        catalog_item_count: catalog.method === 'csv' ? catalog.itemCount : null,
        catalog_file_url: null as string | null,
        catalog_notes:
          catalog.method === 'csv'
            ? `CSV upload queued · ${catalog.itemCount.toLocaleString()} rows · ${catalog.fileName}`
            : catalog.method === 'url'
              ? `External catalogue · ${catalog.sourceUrl.trim()}`
              : 'Import deferred until invite',
      }

      const { data: enrichedRow, error: enrichedError } = await supabase
        .from('vendor_signups')
        .insert(enriched as never)
        .select('id')
        .maybeSingle()

      if (enrichedError) {
        const { data: fallbackRow, error: dbError } = await supabase
          .from('vendor_signups')
          .insert(basePayload)
          .select('id')
          .maybeSingle()
        if (dbError) {
          setError(dbError.message || 'Something went wrong. Please try again.')
          return
        }
        signupId = fallbackRow?.id ?? null
      } else {
        signupId = enrichedRow?.id ?? null
      }

      const catalogResult = await submitVendorCatalog(
        email.trim().toLowerCase(),
        catalog,
        signupId,
      )
      if (!catalogResult.ok && catalog.method !== 'later') {
        // Profile saved — surface catalog warning but still succeed waitlist
        console.warn('Catalog import warning:', catalogResult.error)
      }

      setImportedCount(catalog.method === 'csv' ? catalog.itemCount : 0)
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const cityHint = country === 'india' ? 'e.g. Mumbai, Bengaluru, Pune' : 'e.g. Austin, Denver, Chicago'
  const phoneHint = country === 'india' ? '+91 98765 43210' : '+1 (555) 123-4567'

  const successSteps = [
    'We review your business profile and prepare your supplier page.',
    catalog.method === 'csv' && importedCount > 0
      ? `Your catalogue file (${importedCount.toLocaleString()} items) is queued for processing — even 10,000+ SKUs are fine.`
      : catalog.method === 'url'
        ? 'We ingest your linked catalogue before listing goes live.'
        : 'After your invite, open Catalog in the app to upload CSV (supports 10,000+ SKUs).',
    'You get an early-access invite — architects and contractors start sourcing from you.',
  ]

  return (
    <div className="landing-apple min-h-screen" style={{ background: 'var(--lp-bg)' }}>
      <PartnerSignupHeader secondaryHref="/list-your-business" secondaryLabel="Contractor signup" />

      <main id="main-content" className="mx-auto max-w-[720px] px-5 pb-20 pt-10 sm:px-6">
        {done ? (
          <PartnerSuccess
            firstName={contactName.split(' ')[0]}
            businessName={businessName}
            country={country}
            steps={successSteps}
          />
        ) : (
          <>
            <PartnerHero
              eyebrow="Vendors & suppliers · Free listing · India & US"
              title={step === 1 ? 'Join the vendor waitlist.' : 'Bring your full catalogue.'}
              body={
                step === 1
                  ? 'Get discovered when architects and contractors source materials. Profile first — even if you stock 10,000+ SKUs.'
                  : 'Don’t enter products one-by-one. Upload a CSV, link a sheet/site, or skip and import after invite.'
              }
              bullets={
                step === 1
                  ? [
                      'Free listing — no card required',
                      'Works for small shops and 10k+ SKU distributors',
                      'Early access when marketplace opens',
                    ]
                  : [
                      'CSV supports 100,000+ rows (chunked upload)',
                      'Google Sheet / website links accepted',
                      'You can finish catalogue import later in-app',
                    ]
              }
            />

            {/* Step indicator */}
            <nav aria-label="Signup progress" className="mb-6 flex items-center gap-3 text-[13px]">
              <span style={{ color: step === 1 ? 'var(--lp-text)' : 'var(--lp-text-secondary)', fontWeight: step === 1 ? 600 : 400 }}>
                1. Business
              </span>
              <span aria-hidden style={{ color: 'var(--lp-text-tertiary)' }}>→</span>
              <span style={{ color: step === 2 ? 'var(--lp-text)' : 'var(--lp-text-secondary)', fontWeight: step === 2 ? 600 : 400 }}>
                2. Catalogue
              </span>
            </nav>

            {step === 1 ? (
              <form onSubmit={goToCatalog} className="grid gap-5">
                <PartnerSection title="Where do you operate?">
                  <PartnerField label="Country" required>
                    <PartnerCountryToggle country={country} onChange={setCountry} />
                  </PartnerField>
                </PartnerSection>

                <PartnerSection title="Business details">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <PartnerField label="Business name" required>
                      <input {...input} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="SteelCraft Supplies" required />
                    </PartnerField>
                    <PartnerField label="Your name" required>
                      <input {...input} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Vishal Patil" required />
                    </PartnerField>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <PartnerField label="Work email" required>
                      <input {...input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" required />
                    </PartnerField>
                    <PartnerField label="Phone" hint={phoneHint}>
                      <input {...input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={phoneHint} />
                    </PartnerField>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <PartnerField label="City" required hint={cityHint}>
                      <input {...input} value={city} onChange={(e) => setCity(e.target.value)} placeholder={country === 'india' ? 'Mumbai' : 'Austin'} required />
                    </PartnerField>
                    <PartnerField label="State / region">
                      <input {...input} value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} placeholder={country === 'india' ? 'Maharashtra' : 'Texas'} />
                    </PartnerField>
                  </div>
                </PartnerSection>

                <PartnerSection title="What do you supply?">
                  <PartnerField label="Categories" required hint="Pick all that apply">
                    <PartnerChipGrid options={CATEGORIES} selected={cats} onToggle={toggleCat} />
                  </PartnerField>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <PartnerField label="Company size">
                      <select {...input} style={{ ...input.style, appearance: 'none' as const }} value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
                        <option value="">Select…</option>
                        {TEAM_SIZES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </PartnerField>
                    <PartnerField label="Years in business">
                      <input {...input} type="number" min="0" value={years} onChange={(e) => setYears(e.target.value)} placeholder="14" />
                    </PartnerField>
                  </div>
                  <PartnerField label="Website" hint="Optional — you can attach a full catalogue on the next step">
                    <input {...input} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
                  </PartnerField>
                  <PartnerField label="About your products" hint="Brands, delivery coverage, specialties.">
                    <textarea
                      {...input}
                      className="w-full rounded-xl px-3.5 py-3 text-[15px] outline-none transition-all resize-none"
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="We stock 12,000+ SKUs of structural steel and deliver same-day across Maharashtra…"
                    />
                  </PartnerField>
                </PartnerSection>

                <PartnerSection title="Catalogue photos">
                  <PartnerField label="Product photos" hint="Optional · up to 6 highlight shots (not your full SKU list)">
                    <div className="flex flex-wrap gap-3">
                      {photos.map((p, idx) => (
                        <div key={p.id} className="relative h-24 w-24 overflow-hidden rounded-xl" style={{ border: '1px solid var(--lp-border)' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.preview} alt={`Catalogue photo ${idx + 1}`} className="h-full w-full object-cover" />
                          {p.uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--lp-brand)' }} />
                            </div>
                          )}
                          <button type="button" onClick={() => removePhoto(p.id)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white" aria-label={`Remove photo ${idx + 1}`}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {photos.length < 6 && (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-xl"
                          style={{ background: 'var(--lp-bg-alt)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-secondary)' }}
                        >
                          <Upload className="h-5 w-5" aria-hidden />
                          <span className="text-[11px]">Add photo</span>
                        </button>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => handleFiles(e.target.files)} />
                  </PartnerField>
                </PartnerSection>

                <PartnerSubmitRow
                  busy={false}
                  error={error}
                  submitLabel="Continue to catalogue →"
                  footer={
                    <p className="text-[13px]" style={{ color: 'var(--lp-text-tertiary)' }}>
                      Are you a contractor?{' '}
                      <Link href="/list-your-business" className="lp-link text-[13px]">
                        Sign up here ›
                      </Link>
                    </p>
                  }
                />
              </form>
            ) : (
              <form onSubmit={submit} className="grid gap-5">
                <PartnerSection title="How do you want to share your catalogue?">
                  <VendorCatalogImport email={email} value={catalog} onChange={setCatalog} />
                </PartnerSection>

                <button
                  type="button"
                  onClick={() => { setStep(1); setError('') }}
                  className="justify-self-start text-[14px] font-medium"
                  style={{ color: 'var(--lp-text-secondary)' }}
                >
                  ← Back to business details
                </button>

                <PartnerSubmitRow
                  busy={busy}
                  error={error}
                  submitLabel="Join waitlist — free"
                />
              </form>
            )}
          </>
        )}
      </main>

      <PartnerSignupFooter extraLinks={[{ href: '/list-your-business', label: 'Contractor signup' }]} />
    </div>
  )
}
