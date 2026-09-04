import { createFileRoute } from '@tanstack/react-router'
import Link from '@/compat/next-link'
import { ComparePage } from '@/components/site/ComparePage'
import { SITE_URL } from '@/lib/site/marketing'


const rows = [
  { label: 'RFIs', us: 'Included at every tier', them: 'Locked to Business Plus (~$89/user/mo)' },
  { label: 'Client portal', us: 'Share a link. No app to install.', them: 'Field teams install the app' },
  { label: 'Who it serves', us: 'Architect-led coordination + discovery', them: 'Field tasking and punch lists' },
  { label: 'Invited users', us: 'Free for contractors and clients', them: 'Priced per seat' },
  { label: 'Vendor discovery', us: 'Search by trade and city, then invite', them: 'Not a marketplace' },
  { label: 'Setup', us: 'Under 10 minutes per project', them: 'App rollout across crews' },
]

function PageComponent() {
  return (
    <ComparePage
      title="5Bloc vs Fieldwire"
      description="A Fieldwire alternative when you need RFIs, a client-facing portal, and vendor discovery — not only field tasking."
      updated="August 25, 2026"
      intro="Fieldwire is strong on site tasking. Architects who also run RFIs, client approvals, and finding the next trade often hit a wall: RFIs sit on the expensive plan, clients are asked to install an app, and there is no marketplace. 5Bloc covers that coordination layer."
      rows={rows}
    >
      <section>
        <h2>RFIs are not a premium add-on</h2>
        <p>
          Fieldwire holds RFIs on Business Plus, commonly cited around $89 per user per month. On 5Bloc, RFIs
          sit on the drawing they refer to at every tier. If the architect is already paying for the workspace,
          the contractor answering the RFI does not buy a seat.
        </p>
      </section>
      <section>
        <h2>Clients should not install another app</h2>
        <p>
          Homeowners and developer clients open a browser link and see progress in plain English. That is the
          difference between a forwarded 40MB DWG on WhatsApp and a portal they will actually check.
        </p>
      </section>
      <section>
        <h2>Marketplace, not only coordination</h2>
        <p>
          Fieldwire, Procore, Autodesk ACC, and Dalux stop at the drawing. 5Bloc also lists contractors and
          vendors by trade and city, so an architect can find a listed façade fabricator and invite them onto
          the job.
        </p>
      </section>
      <section>
        <h2>Also compare</h2>
        <p>
          <Link href="/vs/5bloc-vs-procore" className="lp-link text-[15px]">
            5Bloc vs Procore
          </Link>
          {' · '}
          <Link href="/#faq" className="lp-link text-[15px]">
            FAQ
          </Link>
        </p>
      </section>
    </ComparePage>
  )
}

export const Route = createFileRoute('/vs/5bloc-vs-fieldwire')({
  head: () => ({
    meta: [
      { title: '5Bloc vs Fieldwire — AEC coordination for architect-led teams' },
      { name: 'description', content: 'Fieldwire focuses on field task management. 5Bloc runs the whole architect-led project in one workspace.' },
      { property: 'og:title', content: '5Bloc vs Fieldwire — AEC coordination for architect-led teams' },
      { property: 'og:description', content: 'Fieldwire focuses on field task management. 5Bloc runs the whole architect-led project in one workspace.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: PageComponent,
})
