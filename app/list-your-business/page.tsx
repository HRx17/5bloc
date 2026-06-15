'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Loader2,
  Upload,
  X,
  ShieldCheck,
  Globe2,
  Rocket,
  BadgeCheck,
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'

/* Dark palette matching the landing site */
const C = {
  page:    '#080810',
  base:    '#0b0c10',
  mid:     '#13151a',
  raised:  '#1a1d24',
  border:  'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  txt:     '#f0efef',
  txtMid:  '#b0a898',
  txtDim:  '#6e6660',
  amber:   '#F5A623',
}

type Country = 'india' | 'us'

const SPECIALIZATIONS = [
  'General Contracting',
  'Civil & Structural',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Carpentry & Joinery',
  'Painting & Finishes',
  'Flooring & Tiling',
  'Roofing & Waterproofing',
  'Glazing & Facade',
  'Masonry & Concrete',
  'Steel & Fabrication',
  'Interior Fit-out',
  'Landscaping',
  'Solar & Renewables',
  'Fire & Safety Systems',
]

const TEAM_SIZES = ['Just me', '2–10', '11–50', '51–200', '200+']

/* ── Logo ── */
function LogoMark({ size = 26 }: { size?: number }) {
  const a = 'var(--amber)'
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="6" y="6" width="28" height="5.5" rx="1.5" fill={a} />
      <rect x="6" y="15" width="22" height="5.5" rx="1.5" fill={a} opacity="0.72" />
      <rect x="6" y="24" width="16" height="5.5" rx="1.5" fill={a} opacity="0.44" />
      <rect x="6" y="33" width="10" height="4.5" rx="1.5" fill={a} opacity="0.22" />
    </svg>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <label className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: C.txtDim }}>
        {label}
        {required && <span style={{ color: C.amber }}> *</span>}
      </label>
      {children}
      {hint && <span className="text-[11px]" style={{ color: C.txtDim }}>{hint}</span>}
    </div>
  )
}

const inputCls = 'h-11 w-full rounded-lg px-3.5 text-sm outline-none transition-all'
const inputStyle = {
  background: C.base,
  color: C.txt,
  boxShadow: `inset 0 0 0 1px ${C.border}`,
}
function onFocus(e: React.FocusEvent<HTMLElement>) {
  e.target.style.boxShadow = 'inset 0 0 0 1px rgba(245,166,35,0.5), 0 0 0 3px rgba(245,166,35,0.08)'
}
function onBlur(e: React.FocusEvent<HTMLElement>) {
  e.target.style.boxShadow = `inset 0 0 0 1px ${C.border}`
}

interface PhotoItem {
  id: string
  preview: string
  url?: string
  uploading: boolean
  failed?: boolean
}

export default function ListYourBusiness() {
  // Release the app-shell body overflow lock so the page scrolls
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
    return () => {
      document.body.style.overflow = prev
      document.documentElement.style.overflow = ''
    }
  }, [])

  const [country, setCountry] = useState<Country>('india')
  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [stateRegion, setStateRegion] = useState('')
  const [specs, setSpecs] = useState<string[]>([])
  const [teamSize, setTeamSize] = useState('')
  const [years, setYears] = useState('')
  const [website, setWebsite] = useState('')
  const [bio, setBio] = useState('')
  const [photos, setPhotos] = useState<PhotoItem[]>([])

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const toggleSpec = (s: string) =>
    setSpecs((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

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
          // Storage not configured or failed — keep preview but mark optional/failed
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
    if (specs.length === 0) {
      setError('Pick at least one specialization.')
      return
    }
    if (photos.some((p) => p.uploading)) {
      setError('Please wait for photos to finish uploading.')
      return
    }

    setBusy(true)
    try {
      const supabase = createSupabaseClient()
      const { error: dbError } = await supabase.from('contractor_signups').insert({
        business_name: businessName.trim(),
        contact_name: contactName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        country,
        city: city.trim(),
        state: stateRegion.trim() || null,
        specializations: specs,
        team_size: teamSize || null,
        years_experience: years ? parseInt(years, 10) : null,
        website: website.trim() || null,
        bio: bio.trim() || null,
        photos: photos.filter((p) => p.url).map((p) => p.url as string),
        source: 'list-your-business',
      })
      if (dbError) {
        setError('Something went wrong. Please try again.')
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

  const regionLabel = country === 'india' ? 'State' : 'State'
  const cityHint = country === 'india' ? 'e.g. Mumbai, Bengaluru, Pune' : 'e.g. Austin, Denver, Chicago'
  const phoneHint = country === 'india' ? '+91 98765 43210' : '+1 (555) 123-4567'

  return (
    <div className="font-body min-h-screen" style={{ background: C.page, color: C.txt }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(8,8,16,0.82)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <div className="mx-auto flex h-[60px] max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 select-none">
            <LogoMark size={26} />
            <span className="font-mono text-[17px] font-bold tracking-widest" style={{ color: C.txt }}>
              5BLOC
            </span>
          </Link>
          <Link
            href="/"
            className="text-[13px] font-medium transition-colors"
            style={{ color: C.txtMid }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.txt)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.txtMid)}
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8">
        {done ? (
          <SuccessState
            firstName={contactName.split(' ')[0]}
            businessName={businessName}
            country={country}
          />
        ) : (
          <>
            {/* ── Hero ── */}
            <motion.div
              initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mb-10 max-w-2xl"
            >
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] mb-5"
                style={{ background: 'rgba(245,166,35,0.10)', color: C.amber, boxShadow: 'inset 0 0 0 1px rgba(245,166,35,0.18)' }}
              >
                <Globe2 className="h-3.5 w-3.5" /> India &amp; United States · 100% free
              </div>
              <h1 className="font-display text-[34px] leading-[1.08] sm:text-[44px]" style={{ color: C.txt }}>
                List your business free on 5Bloc
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed" style={{ color: C.txtMid }}>
                Get discovered by architects, builders and developers actively hiring for projects.
                Add your trade, service area and a few photos of your work — it takes two minutes,
                and there&apos;s nothing to pay. We&apos;ll feature your profile when the marketplace
                opens.
              </p>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px]" style={{ color: C.txtMid }}>
                {[
                  { icon: BadgeCheck, label: 'Free listing, no card required' },
                  { icon: ShieldCheck, label: 'No spam — review-only access' },
                  { icon: Rocket, label: 'Early access at launch' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: C.amber }} /> {label}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* ── Form ── */}
            <form onSubmit={submit} className="grid gap-6">
              {/* Country */}
              <div
                className="rounded-2xl p-5 sm:p-6"
                style={{ background: C.mid, boxShadow: `inset 0 0 0 1px ${C.border}` }}
              >
                <Field label="Where do you operate?" required>
                  <div className="flex gap-2.5">
                    {([
                      { id: 'india', label: '🇮🇳  India' },
                      { id: 'us', label: '🇺🇸  United States' },
                    ] as { id: Country; label: string }[]).map((opt) => {
                      const active = country === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setCountry(opt.id)}
                          className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all"
                          style={{
                            background: active ? 'rgba(245,166,35,0.10)' : C.base,
                            color: active ? C.amber : C.txtMid,
                            boxShadow: active
                              ? 'inset 0 0 0 1.5px rgba(245,166,35,0.5)'
                              : `inset 0 0 0 1px ${C.border}`,
                          }}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </Field>
              </div>

              {/* Business details */}
              <div
                className="grid gap-5 rounded-2xl p-5 sm:p-6"
                style={{ background: C.mid, boxShadow: `inset 0 0 0 1px ${C.border}` }}
              >
                <SectionTitle>Business details</SectionTitle>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Business name" required>
                    <input className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                      value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. BuildRight Contractors" required />
                  </Field>
                  <Field label="Your name" required>
                    <input className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                      value={contactName} onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Amit Sharma" required />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Work email" required>
                    <input type="email" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@business.com" required />
                  </Field>
                  <Field label="Phone / WhatsApp" hint={phoneHint}>
                    <input className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder={phoneHint} />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="City" required hint={cityHint}>
                    <input className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                      value={city} onChange={(e) => setCity(e.target.value)}
                      placeholder={country === 'india' ? 'Mumbai' : 'Austin'} required />
                  </Field>
                  <Field label={regionLabel}>
                    <input className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                      value={stateRegion} onChange={(e) => setStateRegion(e.target.value)}
                      placeholder={country === 'india' ? 'Maharashtra' : 'Texas'} />
                  </Field>
                </div>
              </div>

              {/* Specializations */}
              <div
                className="grid gap-4 rounded-2xl p-5 sm:p-6"
                style={{ background: C.mid, boxShadow: `inset 0 0 0 1px ${C.border}` }}
              >
                <SectionTitle>
                  What do you do?{' '}
                  <span style={{ color: C.txtDim }}>· pick all that apply</span>
                </SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map((s) => {
                    const active = specs.includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSpec(s)}
                        className="rounded-full px-3.5 py-2 text-[12.5px] font-medium transition-all"
                        style={{
                          background: active ? 'rgba(245,166,35,0.12)' : C.base,
                          color: active ? C.amber : C.txtMid,
                          boxShadow: active
                            ? 'inset 0 0 0 1.5px rgba(245,166,35,0.45)'
                            : `inset 0 0 0 1px ${C.border}`,
                        }}
                      >
                        {active && <Check className="mr-1 inline h-3.5 w-3.5" />}
                        {s}
                      </button>
                    )
                  })}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Team size">
                    <select className={inputCls} style={{ ...inputStyle, appearance: 'none' }} onFocus={onFocus} onBlur={onBlur}
                      value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
                      <option value="" style={{ background: C.mid }}>Select…</option>
                      {TEAM_SIZES.map((t) => (
                        <option key={t} value={t} style={{ background: C.mid }}>{t}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Years in business">
                    <input type="number" min="0" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                      value={years} onChange={(e) => setYears(e.target.value)} placeholder="e.g. 8" />
                  </Field>
                </div>

                <Field label="Website / portfolio">
                  <input className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                    value={website} onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://" />
                </Field>

                <Field label="Tell architects about your work" hint="A short pitch — your strengths, signature projects, certifications.">
                  <textarea
                    className="w-full rounded-lg px-3.5 py-3 text-sm outline-none transition-all resize-none"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                    rows={4} value={bio} onChange={(e) => setBio(e.target.value)}
                    placeholder="We specialise in fast-track commercial fit-outs across the metro area…" />
                </Field>
              </div>

              {/* Photos */}
              <div
                className="grid gap-4 rounded-2xl p-5 sm:p-6"
                style={{ background: C.mid, boxShadow: `inset 0 0 0 1px ${C.border}` }}
              >
                <SectionTitle>
                  Photos of your work{' '}
                  <span style={{ color: C.txtDim }}>· optional, up to 6</span>
                </SectionTitle>

                <div className="flex flex-wrap gap-3">
                  {photos.map((p) => (
                    <div
                      key={p.id}
                      className="relative h-24 w-24 overflow-hidden rounded-xl"
                      style={{ boxShadow: `inset 0 0 0 1px ${C.border}` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.preview} alt="" className="h-full w-full object-cover" />
                      {p.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
                          <Loader2 className="h-5 w-5 animate-spin" style={{ color: C.amber }} />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(p.id)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full"
                        style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
                        aria-label="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {photos.length < 6 && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-xl transition-all"
                      style={{ background: C.base, color: C.txtDim, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${C.borderStrong}`)}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${C.border}`)}
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-[11px] font-medium">Add photo</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={(e) => handleFiles(e.target.files)}
                />
                {photos.some((p) => p.failed) && (
                  <p className="text-[12px]" style={{ color: '#ff9b8a' }}>
                    Some photos couldn&apos;t upload — you can submit without them and email us images later.
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-8 text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ background: C.amber, color: '#0d0a00' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#ffb94a')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = C.amber)}
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>List my business free <ArrowRight className="h-5 w-5" /></>}
                </button>
                {error
                  ? <p className="text-[13px]" style={{ color: '#ff6b6b' }}>{error}</p>
                  : <p className="text-[12.5px]" style={{ color: C.txtDim }}>By submitting you agree to our <Link href="/terms" className="underline">Terms</Link> &amp; <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>}
              </div>
            </form>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: 'rgba(255,255,255,0.025)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 px-5 py-10 text-[12px] sm:flex-row sm:items-center sm:px-8" style={{ color: C.txtDim }}>
          <div>© {new Date().getFullYear()} 5Bloc Technologies. All rights reserved.</div>
          <div className="flex gap-5">
            <Link href="/" style={{ color: C.txtDim }}>Home</Link>
            <Link href="/terms" style={{ color: C.txtDim }}>Terms</Link>
            <Link href="/privacy" style={{ color: C.txtDim }}>Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[10.5px] uppercase tracking-[0.18em]" style={{ color: C.amber, opacity: 0.85 }}>
      {children}
    </h2>
  )
}

function SuccessState({
  firstName,
  businessName,
  country,
}: {
  firstName: string
  businessName: string
  country: Country
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-2xl py-10 text-center"
    >
      <div
        className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(46,204,138,0.12)', boxShadow: 'inset 0 0 0 1px rgba(46,204,138,0.3)' }}
      >
        <Check className="h-8 w-8" style={{ color: '#2ECC8A' }} />
      </div>

      <div
        className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] mb-5"
        style={{ background: 'rgba(46,204,138,0.12)', color: '#2ECC8A' }}
      >
        <Check className="h-3.5 w-3.5" /> You&apos;re on the list
      </div>

      <h1 className="font-display text-[30px] leading-tight sm:text-[38px]" style={{ color: C.txt }}>
        Thank you for joining, {firstName || 'there'}.
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed" style={{ color: C.txtMid }}>
        <span style={{ color: C.txt, fontWeight: 600 }}>{businessName || 'Your business'}</span> is
        now registered for the 5Bloc marketplace. We&apos;re launching in{' '}
        <span style={{ color: C.amber, fontWeight: 600 }}>about 2 months</span>
        {country === 'us' ? ' across the US' : ' across India'} — early-access invites go out to
        listed businesses first.
      </p>

      <div
        className="mx-auto mt-8 grid max-w-md gap-3 rounded-2xl p-5 text-left"
        style={{ background: C.mid, boxShadow: `inset 0 0 0 1px ${C.border}` }}
      >
        {[
          'We review your listing and prepare your public profile.',
          'You get an early-access invite before public launch.',
          'Architects start finding you for live projects.',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold"
              style={{ background: 'rgba(245,166,35,0.14)', color: C.amber }}
            >
              {i + 1}
            </span>
            <span className="text-[13.5px]" style={{ color: C.txtMid }}>{step}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold transition-all"
          style={{ background: C.amber, color: '#0d0a00' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#ffb94a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.amber)}
        >
          Back to home <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href="mailto:contact@5bloc.com"
          className="inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold transition-all"
          style={{ color: C.txtMid, boxShadow: `inset 0 0 0 1px ${C.border}` }}
        >
          Questions? Email us
        </a>
      </div>
    </motion.div>
  )
}
