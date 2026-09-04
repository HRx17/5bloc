import { createFileRoute } from '@tanstack/react-router'
import Link from '@/compat/next-link'
import { LegalDocShell } from '@/components/site/LegalDocShell'
import {
  COMPANY_LINKEDIN,
  FOUNDERS,
  FOUNDER_STORY,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
} from '@/lib/site/marketing'


function PageComponent() {
  const peopleLd = FOUNDERS.map((f) => ({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: f.name,
    jobTitle: f.role,
    url: `${SITE_URL}/about`,
    sameAs: [f.linkedin],
    image: `${SITE_URL}${f.photo}`,
    worksFor: { '@type': 'Organization', name: '5Bloc Technologies', url: SITE_URL },
  }))

  return (
    <>
      {peopleLd.map((person) => (
        <script
          key={person.name}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
        />
      ))}
      <LegalDocShell
        title="About 5Bloc"
        updated="August 25, 2026"
        description="Named founders, a real practice problem, and a product built for architect-led teams."
      >
        <section className="grid sm:grid-cols-2 gap-8">
          {FOUNDERS.map((f) => (
            <div key={f.name} className="flex flex-col sm:flex-row gap-5 items-start">
              <img
                src={f.photo}
                alt={f.name}
                className="h-28 w-28 rounded-2xl object-cover shrink-0"
              />
              <div>
                <p
                  className="text-[13px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--lp-brand)' }}
                >
                  Co-founder
                </p>
                <h2 className="mt-1">{f.name}</h2>
                <p>{f.role}, 5Bloc</p>
                <p className="mt-3">
                  <a href={f.linkedin} target="_blank" rel="noreferrer" className="lp-link text-[15px]">
                    LinkedIn
                  </a>
                </p>
              </div>
            </div>
          ))}
        </section>

        <p>
          <a href={COMPANY_LINKEDIN} target="_blank" rel="noreferrer" className="lp-link text-[15px]">
            5Bloc on LinkedIn
          </a>
        </p>

        <section>
          <h2>Why we built this</h2>
          <p>{FOUNDER_STORY}</p>
        </section>

        <section>
          <h2>What 5Bloc is</h2>
          <p>
            5Bloc is the AEC project coordination platform for architect-led teams. Architects run the job.
            Contractors bid and deliver. Vendors get discovered in their city. Clients see progress in the
            browser — no app to install.
          </p>
        </section>

        <section>
          <h2>Building in public</h2>
          <p>
            Demo milestones and product updates live on the{' '}
            <Link href="/changelog" className="lp-link text-[15px]">
              changelog
            </Link>
            . If you want early access, join the waitlist from the{' '}
            <Link href="/#waitlist" className="lp-link text-[15px]">
              homepage
            </Link>
            .
          </p>
        </section>
      </LegalDocShell>
    </>
  )
}

export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: 'About — 5Bloc' },
      { name: 'description', content: 'Haet Ranpariya and Parth Mehta founded 5Bloc so architect-led teams can run drawings, RFIs, and client approvals in one workspace.' },
      { property: 'og:title', content: 'About — 5Bloc' },
      { property: 'og:description', content: 'Haet Ranpariya and Parth Mehta founded 5Bloc so architect-led teams can run drawings, RFIs, and client approvals in one workspace.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: PageComponent,
})
