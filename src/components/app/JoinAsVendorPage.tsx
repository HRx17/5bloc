import { useState, useRef } from 'react'
import Link from '@/compat/next-link'
import { Loader2, Upload, X } from 'lucide-react'
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

export default function JoinAsVendorPage() {
  usePartnerPageScroll()

  const input = partnerInputProps()
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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
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

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!businessName.trim() || !contactName.trim() || !email.trim() || !city.trim()) {
      setError('Please fill in the required fields.')
      return
    }
    if (cats.length === 0) {
      setError('Pick at least one product / supply category.')
      return
    }
    if (photos.some((p) => p.uploading)) {
      setError('Please wait for photos to finish uploading.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/public/partner/vendor-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          website: website.trim() || null,
          bio: bio.trim() || null,
          photos: photos.filter((p) => p.url).map((p) => p.url as string),
          source: 'join-as-vendor',
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error || 'Something went wrong. Please try again.')
      } else {
        setDone(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const cityHint = country === 'india' ? 'e.g. Mumbai, Bengaluru, Pune' : 'e.g. Austin, Denver, Chicago'
  const phoneHint = country === 'india' ? '+91 98765 43210' : '+1 (555) 123-4567'

  return (
    <div className="landing-apple min-h-screen" style={{ background: 'var(--lp-bg)' }}>
      <PartnerSignupHeader secondaryHref="/list-your-business" secondaryLabel="Contractor signup" />

      <main className="mx-auto max-w-[720px] px-5 pb-20 pt-10 sm:px-6">
        {done ? (
          <PartnerSuccess
            firstName={contactName.split(' ')[0]}
            businessName={businessName}
            country={country}
            signupHref="/signup?role=vendor"
            signupLabel="Create vendor account"
            steps={[
              'We review your profile and prepare your supplier page.',
              'You get an early-access invite before public launch.',
              'Architects and contractors start sourcing from you.',
            ]}
          />
        ) : (
          <>
            <PartnerHero
              eyebrow="Vendors & suppliers · Free listing · India & US"
              title="Join the vendor waitlist."
              body="Get discovered when architects and contractors source materials for active projects. Add your categories, service area, and catalogue photos — completely free."
              bullets={[
                'Free listing — no card required',
                'Review-only access for architects',
                'Early access when marketplace opens',
              ]}
            />

            <form onSubmit={submit} className="grid gap-5">
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
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </PartnerField>
                  <PartnerField label="Years in business">
                    <input {...input} type="number" min="0" value={years} onChange={(e) => setYears(e.target.value)} placeholder="14" />
                  </PartnerField>
                </div>
                <PartnerField label="Website / catalogue">
                  <input {...input} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
                </PartnerField>
                <PartnerField label="About your products" hint="What you supply, key brands, delivery coverage.">
                  <textarea
                    {...input}
                    className="w-full rounded-xl px-3.5 py-3 text-[15px] outline-none transition-all resize-none"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="We stock 500+ SKUs of structural steel and deliver same-day across Maharashtra…"
                  />
                </PartnerField>
              </PartnerSection>

              <PartnerSection title="Catalogue photos">
                <PartnerField label="Product photos" hint="Optional · up to 6">
                  <div className="flex flex-wrap gap-3">
                    {photos.map((p) => (
                      <div key={p.id} className="relative h-24 w-24 overflow-hidden rounded-xl" style={{ border: '1px solid var(--lp-border)' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.preview} alt="" className="h-full w-full object-cover" />
                        {p.uploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--lp-brand)' }} />
                          </div>
                        )}
                        <button type="button" onClick={() => removePhoto(p.id)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white" aria-label="Remove photo">
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
                        <Upload className="h-5 w-5" />
                        <span className="text-[11px]">Add photo</span>
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
                </PartnerField>
              </PartnerSection>

              <PartnerSubmitRow
                busy={busy}
                error={error}
                submitLabel="Join waitlist — free"
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
          </>
        )}
      </main>

      <PartnerSignupFooter extraLinks={[{ href: '/list-your-business', label: 'Contractor signup' }]} />
    </div>
  )
}
