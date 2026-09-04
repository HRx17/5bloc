import { createFileRoute } from '@tanstack/react-router'
import Link from '@/compat/next-link'
import { ComparePage } from '@/components/site/ComparePage'
import { SITE_URL } from '@/lib/site/marketing'


const rows = [
  { label: 'Built for', us: 'Architect-led teams', them: 'GC-led enterprise programmes' },
  { label: 'Who pays', us: 'The practice. Invited users stay free.', them: 'Per-seat licences across the job' },
  { label: 'Setup', us: 'Under 10 minutes per project', them: 'Implementation and admin time' },
  { label: 'Client access', us: 'Browser portal, no app to install', them: 'Typically another login / app' },
  { label: 'India', us: 'RERA and permit tracking in-product', them: 'US-first, localised later' },
  { label: 'Vendor discovery', us: 'Marketplace by trade and city', them: 'Coordination only' },
  { label: 'Price', us: 'Transparent — from $15 Solo / $49.99 Team at US launch', them: 'Quoted, opaque for small firms' },
]

function PageComponent() {
  return (
    <ComparePage
      title="5Bloc vs Procore"
      description="A Procore alternative for architect-led firms that do not need an enterprise implementation."
      updated="August 25, 2026"
      intro="Architects searching for Procore alternatives for small firms usually bounce on three things: per-seat cost, setup that needs an admin, and a product designed around the general contractor. 5Bloc starts from the architect's desk instead."
      rows={rows}
    >
      <section>
        <h2>Architect-led, not GC-led</h2>
        <p>
          Procore is excellent when a general contractor owns the programme and every trade is already on the
          licence. Most architect-led jobs in India — and many US studios — are not that. The architect
          coordinates drawings, RFIs, and the client. Contractors come and go. 5Bloc puts the workspace in
          the architect's hands and lets everyone else in without buying a seat.
        </p>
      </section>
      <section>
        <h2>Price you can put on a proposal</h2>
        <p>
          Small practices cannot absorb an opaque enterprise quote. 5Bloc publishes projected US launch pricing
          — $15/month Solo, $49.99+/month Team — and keeps invited contractors, vendors, and clients free. India
          billing stays in rupees in-app.
        </p>
      </section>
      <section>
        <h2>India compliance without a bolt-on</h2>
        <p>
          Permits and RERA tracking sit inside the project, next to drawings and RFIs. You do not export a
          US-shaped workflow and then rebuild it in Excel for local filings.
        </p>
      </section>
      <section>
        <h2>Also compare</h2>
        <p>
          <Link href="/vs/5bloc-vs-fieldwire" className="lp-link text-[15px]">
            5Bloc vs Fieldwire
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

export const Route = createFileRoute('/vs/5bloc-vs-procore')({
  head: () => ({
    meta: [
      { title: '5Bloc vs Procore — AEC coordination for architect-led teams' },
      { name: 'description', content: 'Procore is built for GC-led enterprise programmes. 5Bloc is built for architect-led practices.' },
      { property: 'og:title', content: '5Bloc vs Procore — AEC coordination for architect-led teams' },
      { property: 'og:description', content: 'Procore is built for GC-led enterprise programmes. 5Bloc is built for architect-led practices.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: PageComponent,
})
