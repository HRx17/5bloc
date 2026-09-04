export const SITE_URL = (
  import.meta.env['VITE_SITE_URL'] ||
  import.meta.env['VITE_APP_URL'] ||
  'https://5bloc.com'
).replace(/\/$/, '')

export const SITE_TITLE = '5Bloc - AEC Project Coordination for Architect-Led Teams'
export const SITE_DESCRIPTION =
  '5Bloc is the project coordination platform for architect-led construction. Drawings, RFIs, client approvals - one workspace, no app to install.'

export const COMPANY_LINKEDIN = 'https://www.linkedin.com/company/5bloc'

export const FOUNDERS = [
  {
    name: 'Haet Ranpariya',
    role: 'Co-founder',
    photo: '/images/haet-ranpariya.png',
    linkedin: 'https://www.linkedin.com/in/haet-ranpariya-382324188',
  },
  {
    name: 'Parth Mehta',
    role: 'Co-founder',
    photo: '/images/parth-mehta.png',
    linkedin: 'https://www.linkedin.com/in/parth-mehta-4473a517b',
  },
] as const

export const FOUNDER_STORY =
  'Parth trained as an architect at SPA Delhi. On every job, the work itself was never the hard part — finding the latest drawing, chasing an RFI, and explaining progress to a client across fifteen WhatsApp groups was. Haet builds the product. Together we built 5Bloc so architect-led teams can run the project in one workspace, without asking contractors or clients to install another app.'

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is 5Bloc?',
    a: 'One workspace for everyone on a build project. Drawings, RFIs, and updates — instead of WhatsApp and email.',
  },
  {
    q: 'Is it free to join?',
    a: 'Yes. The waitlist is free for architects, contractors, and vendors. Early architects get their first three projects free at launch.',
  },
  {
    q: 'Who pays later?',
    a: "After launch, the architect's practice carries the subscription. Everyone invited to a project stays free.",
  },
  {
    q: "I'm a contractor or vendor — how do I join?",
    a: 'Use the contractor or vendor buttons at the top of the page. Listing is free — we will email you when onboarding opens in your city.',
  },
  {
    q: 'How is this different from Procore?',
    a: '5Bloc is built for architect-led projects, not GC-led enterprise programmes. Invited contractors and clients stay free, India compliance is in the product, and there is no per-seat tax for the people you already work with. Read the full comparison on 5Bloc vs Procore.',
  },
  {
    q: 'How long does setup take?',
    a: 'Under 10 minutes per project. Create the workspace, upload drawings, invite the team. No admin, no IT ticket, no implementation consultant.',
  },
  {
    q: 'Will my team actually use this instead of WhatsApp?',
    a: 'Clients open a link in the browser — no app to install. Contractors get the latest drawings automatically when you publish a version, instead of hunting through chat. The architect runs the project; everyone else just sees what they need.',
  },
  {
    q: 'Is my project data safe?',
    a: 'Projects are private to your organisation. Access is role-based. Files sit in encrypted object storage. We do not sell project data. You can export drawings, RFIs, and records in standard formats at any time.',
  },
  {
    q: 'What happens to my data if 5Bloc shuts down?',
    a: 'You can export anytime — PDFs, drawings, and project records in standard formats you already use. Your files stay yours. We would rather you leave with a full archive than feel locked in.',
  },
]

export const TESTIMONIALS = [
  {
    quote:
      "I've managed 14 projects. Every single one ran on WhatsApp groups I couldn't search and Excel sheets nobody trusted. 5Bloc is what I wished existed when I started my practice.",
    name: 'Karan S.',
    role: 'Principal Architect, Mumbai',
    photo: '/images/testimonial-karan.png',
  },
  {
    quote:
      'The client portal is the first thing I show a homeowner. They see progress in plain English instead of forwarding them a 40MB DWG on WhatsApp.',
    name: 'Priya N.',
    role: 'Principal Architect, Delhi',
    photo: '/images/testimonial-priya.png',
  },
  {
    quote:
      'RFIs used to die in email. Now they sit on the drawing they refer to, and the contractor actually answers them.',
    name: 'Arjun V.',
    role: 'Studio Lead, Bangalore',
    photo: '/images/testimonial-arjun.png',
  },
]

export const WAITLIST_AVATARS = [
  { initials: 'AM', city: 'Mumbai' },
  { initials: 'RS', city: 'Delhi' },
  { initials: 'KN', city: 'Bangalore' },
  { initials: 'PV', city: 'Pune' },
  { initials: 'DS', city: 'Hyderabad' },
  { initials: 'AR', city: 'Chennai' },
  { initials: 'MT', city: 'Ahmedabad' },
  { initials: 'SJ', city: 'Austin' },
  { initials: 'VK', city: 'Surat' },
  { initials: 'NP', city: 'Jaipur' },
  { initials: 'HL', city: 'New York' },
  { initials: 'RG', city: 'Kolkata' },
]

export function homepageJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: '5Bloc Technologies',
      url: SITE_URL,
      logo: `${SITE_URL}/images/og.png`,
      description: SITE_DESCRIPTION,
      sameAs: [...FOUNDERS.map((f) => f.linkedin), COMPANY_LINKEDIN],
      founder: FOUNDERS.map((f) => ({
        '@type': 'Person',
        name: f.name,
        jobTitle: f.role,
        url: f.linkedin,
        image: `${SITE_URL}${f.photo}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: '5Bloc',
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      image: `${SITE_URL}/images/og.png`,
      brand: { '@type': 'Brand', name: '5Bloc' },
      category: 'AEC project coordination',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ]
}

export const CHANGELOG = [
  {
    date: '2026-08-25',
    title: 'Public site depth',
    body: 'Founder page, changelog, US pricing preview, vendor discovery, and comparison pages for Procore and Fieldwire. Search files (robots, sitemap, llms.txt) no longer redirect to login.',
  },
  {
    date: '2026-08-22',
    title: 'CAD viewer + vault handoff',
    body: 'Project drawings open in the Autodesk viewer. Transmittal attachments, confirmation email via Resend, and 5Bloc Studio as an internal Gantt.',
  },
  {
    date: '2026-08-21',
    title: 'Coordination and calendar',
    body: 'RFI attachments, typology-aware permits, AI building-code checker, fee as % or lump sum, WhatsApp-style project notifications, and a project timeline view.',
  },
  {
    date: '2026-08-14',
    title: 'Meeting scheduling',
    body: 'Calendar invites, reminder windows, and attendee emails on project meetings.',
  },
  {
    date: '2026-06-14',
    title: 'Private beta waitlist open',
    body: 'Architects, contractors, and vendors can join from 5bloc.com. First practices onboarded in Mumbai, Delhi, and Bangalore.',
  },
]
