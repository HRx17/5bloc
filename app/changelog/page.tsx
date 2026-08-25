import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalDocShell } from '@/components/site/LegalDocShell'
import { CHANGELOG, SITE_URL } from '@/lib/site/marketing'

export const metadata: Metadata = {
  title: 'Changelog — 5Bloc',
  description: 'Dated product updates for 5Bloc: demo milestones, beta onboarding, and feature releases.',
  openGraph: {
    title: 'Changelog — 5Bloc',
    url: `${SITE_URL}/changelog`,
    images: [{ url: '/images/og.png', width: 1200, height: 630, alt: '5Bloc changelog' }],
  },
}

export default function ChangelogPage() {
  return (
    <LegalDocShell
      title="Changelog"
      updated="August 25, 2026"
      description="What shipped. Dates, not slogans."
    >
      {CHANGELOG.map((entry) => (
        <section key={entry.date}>
          <p className="text-[13px] font-medium" style={{ color: 'var(--lp-brand)' }}>
            {entry.date}
          </p>
          <h2>{entry.title}</h2>
          <p>{entry.body}</p>
        </section>
      ))}
      <p>
        Questions about a release?{' '}
        <a href="mailto:contact@5bloc.com" className="lp-link text-[15px]">
          contact@5bloc.com
        </a>
        {' · '}
        <Link href="/" className="lp-link text-[15px]">
          Back to 5Bloc
        </Link>
      </p>
    </LegalDocShell>
  )
}
