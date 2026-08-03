'use client'

import React, { useEffect, useId } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { Logo } from '@/components/brand/LogoMark'

export type PartnerCountry = 'india' | 'us'

export function usePartnerPageScroll() {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
    document.documentElement.classList.add('landing-page-active')
    return () => {
      document.body.style.overflow = prev
      document.documentElement.style.overflow = ''
      document.documentElement.classList.remove('landing-page-active')
    }
  }, [])
}

export function PartnerSignupHeader({
  secondaryHref,
  secondaryLabel,
}: {
  secondaryHref?: string
  secondaryLabel?: string
}) {
  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'var(--lp-nav-bg-scrolled)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--lp-border)',
      }}
    >
      <div className="mx-auto flex h-11 max-w-[720px] items-center justify-between px-5 sm:px-6">
        <Link href="/" className="opacity-90 hover:opacity-100 transition-opacity select-none">
          <Logo size={22} showTagline={false} color="var(--lp-text)" />
        </Link>
        <div className="flex items-center gap-4">
          {secondaryHref && secondaryLabel && (
            <Link href={secondaryHref} className="lp-nav-link hidden sm:inline">
              {secondaryLabel}
            </Link>
          )}
          <Link href="/" className="lp-link text-[14px]">
            Home ›
          </Link>
        </div>
      </div>
    </header>
  )
}

export function PartnerSignupFooter({
  extraLinks = [],
}: {
  extraLinks?: { href: string; label: string }[]
}) {
  return (
    <footer style={{ background: 'var(--lp-bg-alt)', borderTop: '1px solid var(--lp-border)' }}>
      <div className="mx-auto flex max-w-[720px] flex-col gap-3 px-5 py-10 text-[12px] sm:flex-row sm:items-center sm:justify-between sm:px-6" style={{ color: 'var(--lp-text-tertiary)' }}>
        <div>© {new Date().getFullYear()} 5Bloc Technologies</div>
        <div className="flex flex-wrap gap-4">
          <Link href="/" className="lp-link text-[12px]">
            Home
          </Link>
          {extraLinks.map((l) => (
            <Link key={l.href} href={l.href} className="lp-link text-[12px]">
              {l.label}
            </Link>
          ))}
          <Link href="/terms" className="lp-link text-[12px]">
            Terms
          </Link>
          <Link href="/privacy" className="lp-link text-[12px]">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}

export function PartnerHero({
  eyebrow,
  title,
  body,
  bullets,
}: {
  eyebrow: string
  title: string
  body: string
  bullets: string[]
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      className="mb-10 max-w-2xl"
    >
      <p className="lp-eyebrow mb-3">{eyebrow}</p>
      <h1 className="lp-section-title text-[clamp(1.75rem,4vw,2.5rem)]">{title}</h1>
      <p className="lp-subhead mt-4 text-[17px]">{body}</p>
      <ul className="mt-6 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-[14px]" style={{ color: 'var(--lp-text-secondary)' }}>
            <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--lp-brand)' }} />
            {b}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

export function PartnerSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      className="rounded-2xl p-5 sm:p-6"
      style={{ background: '#fff', border: '1px solid var(--lp-border)' }}
    >
      <h2 className="text-[13px] font-semibold mb-5" style={{ color: 'var(--lp-text)' }}>
        {title}
      </h2>
      <div className="grid gap-5">{children}</div>
    </section>
  )
}

export function PartnerField({
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
  const autoId = useId()
  const labelId = `${autoId}-label`
  const hintId = hint ? `${autoId}-hint` : undefined

  const enhanced = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child
    const props = child.props as Record<string, unknown>
    const type = child.type
    const isControl =
      type === 'input' || type === 'textarea' || type === 'select'

    if (isControl) {
      return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        id: (props.id as string) || autoId,
        'aria-required': required || undefined,
        'aria-describedby': hintId || props['aria-describedby'],
      })
    }

    return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
      'aria-labelledby': (props['aria-labelledby'] as string) || labelId,
    })
  })

  return (
    <div className="grid gap-1.5">
      <label
        id={labelId}
        htmlFor={autoId}
        className="text-[12px] font-medium"
        style={{ color: 'var(--lp-text-secondary)' }}
      >
        {label}
        {required && (
          <span style={{ color: 'var(--lp-brand)' }} aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {enhanced}
      {hint && (
        <span id={hintId} className="text-[12px]" style={{ color: 'var(--lp-text-tertiary)' }}>
          {hint}
        </span>
      )}
    </div>
  )
}

const inputCls = 'h-11 w-full rounded-xl px-3.5 text-[15px] outline-none transition-all'
const inputStyle = {
  background: '#fff',
  color: 'var(--lp-text)',
  boxShadow: 'inset 0 0 0 1px var(--lp-border)',
}

export function partnerInputProps() {
  return {
    className: inputCls,
    style: inputStyle,
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      e.currentTarget.style.boxShadow =
        'inset 0 0 0 1px rgba(245,166,35,0.55), 0 0 0 3px rgba(245,166,35,0.12)'
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      e.currentTarget.style.boxShadow = 'inset 0 0 0 1px var(--lp-border)'
    },
  }
}

export function PartnerCountryToggle({
  country,
  onChange,
}: {
  country: PartnerCountry
  onChange: (c: PartnerCountry) => void
}) {
  const opts: { id: PartnerCountry; label: string }[] = [
    { id: 'india', label: 'India' },
    { id: 'us', label: 'United States' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Country">
      {opts.map((opt) => {
        const active = country === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className="rounded-xl px-4 py-3 text-[15px] transition-all"
            style={{
              background: active ? 'rgba(245,166,35,0.1)' : 'var(--lp-bg-alt)',
              color: active ? 'var(--lp-text)' : 'var(--lp-text-secondary)',
              boxShadow: active
                ? 'inset 0 0 0 1.5px rgba(245,166,35,0.45)'
                : 'inset 0 0 0 1px var(--lp-border)',
              fontWeight: active ? 600 : 400,
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function PartnerChipGrid({
  options,
  selected,
  onToggle,
}: {
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Options">
      {options.map((option) => {
        const active = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option)}
            className="rounded-full px-3.5 py-2 text-[13px] transition-all"
            style={{
              background: active ? 'rgba(245,166,35,0.12)' : 'var(--lp-bg-alt)',
              color: active ? 'var(--lp-text)' : 'var(--lp-text-secondary)',
              boxShadow: active
                ? 'inset 0 0 0 1.5px rgba(245,166,35,0.4)'
                : 'inset 0 0 0 1px var(--lp-border)',
            }}
          >
            {active && <Check className="mr-1 inline h-3.5 w-3.5" style={{ color: 'var(--lp-brand)' }} aria-hidden />}
            {option}
          </button>
        )
      })}
    </div>
  )
}

export function PartnerSubmitRow({
  busy,
  error,
  submitLabel,
  footer,
}: {
  busy: boolean
  error: string
  submitLabel: string
  footer?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
      <button type="submit" disabled={busy} className="lp-btn disabled:opacity-50">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : submitLabel}
      </button>
      {error ? (
        <p role="alert" className="text-[13px]" style={{ color: '#c62828' }}>
          {error}
        </p>
      ) : (
        footer ?? (
          <p className="text-[13px]" style={{ color: 'var(--lp-text-tertiary)' }}>
            By submitting you agree to our{' '}
            <Link href="/terms" className="lp-link text-[13px]">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="lp-link text-[13px]">
              Privacy Policy
            </Link>
            .
          </p>
        )
      )}
    </div>
  )
}

export function PartnerSuccess({
  firstName,
  businessName,
  country,
  steps,
  accentWord = 'about 2 months',
}: {
  firstName: string
  businessName: string
  country: PartnerCountry
  steps: string[]
  accentWord?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      className="mx-auto max-w-xl py-12 text-center"
    >
      <div
        className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: 'rgba(46,204,138,0.12)' }}
      >
        <Check className="h-7 w-7" style={{ color: '#2ECC8A' }} />
      </div>
      <p className="lp-eyebrow mb-3" style={{ color: '#2ECC8A' }}>
        You&apos;re on the list
      </p>
      <h1 className="lp-section-title text-[clamp(1.5rem,3vw,2rem)]">
        Thank you, {firstName || 'there'}.
      </h1>
      <p className="lp-subhead mt-4 text-[17px]">
        <span style={{ color: 'var(--lp-text)' }}>{businessName || 'Your business'}</span> is registered for the
        5Bloc marketplace. We&apos;re launching in{' '}
        <span style={{ color: 'var(--lp-brand)' }}>{accentWord}</span>
        {country === 'us' ? ' across the US' : ' across India'} — early invites go to listed businesses first.
      </p>
      <div
        className="mx-auto mt-8 grid gap-3 rounded-2xl p-5 text-left"
        style={{ background: '#fff', border: '1px solid var(--lp-border)' }}
      >
        {steps.map((step, i) => (
          <div key={step} className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{ background: 'rgba(245,166,35,0.14)', color: 'var(--lp-brand-dk)' }}
            >
              {i + 1}
            </span>
            <span className="text-[14px]" style={{ color: 'var(--lp-text-secondary)' }}>
              {step}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="lp-btn">
          Back to home <ArrowRight className="h-4 w-4" />
        </Link>
        <a href="mailto:contact@5bloc.com" className="lp-btn lp-btn-outline">
          Email us
        </a>
      </div>
    </motion.div>
  )
}
