import { createFileRoute } from '@tanstack/react-router'
import Link from '@/compat/next-link'
import { LegalDocShell } from '@/components/site/LegalDocShell'
import { CHANGELOG, SITE_URL } from '@/lib/site/marketing'


function PageComponent() {
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

export const Route = createFileRoute('/changelog')({
  head: () => ({
    meta: [
      { title: 'Changelog — 5Bloc' },
      { name: 'description', content: 'Dated product updates for 5Bloc: demo milestones, beta onboarding, and feature releases.' },
      { property: 'og:title', content: 'Changelog — 5Bloc' },
      { property: 'og:description', content: 'Dated product updates for 5Bloc: demo milestones, beta onboarding, and feature releases.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: PageComponent,
})
