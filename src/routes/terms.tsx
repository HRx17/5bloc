import { createFileRoute } from '@tanstack/react-router'
import Link from '@/compat/next-link'
import { LegalDocShell } from '@/components/site/LegalDocShell'


function PageComponent() {
  return (
    <LegalDocShell title="Terms of Service" updated="June 14, 2026">
      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using 5BLOC (&quot;the Platform&quot;), you agree to be bound by these Terms of
          Service. If you do not agree to these terms, please do not use the Platform.
        </p>
      </section>

      <section>
        <h2>2. Description of Service</h2>
        <p>
          5BLOC is a construction project management platform designed for architects, engineers, and
          construction professionals. The Platform provides tools for project coordination, document
          management, RFI tracking, invoicing, and integration with third-party services including Google
          Workspace and Autodesk products.
        </p>
      </section>

      <section>
        <h2>3. User Accounts</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>You must provide accurate and complete information when creating an account.</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You are responsible for all activity that occurs under your account.</li>
          <li>You must notify us immediately of any unauthorised use of your account.</li>
        </ul>
      </section>

      <section>
        <h2>4. Acceptable Use</h2>
        <p className="mb-3">You agree not to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Use the Platform for any unlawful purpose</li>
          <li>Upload malicious code, viruses, or harmful content</li>
          <li>Attempt to gain unauthorised access to other users&apos; data</li>
          <li>Reverse engineer, decompile, or disassemble any part of the Platform</li>
          <li>Use the Platform to spam, harass, or harm others</li>
        </ul>
      </section>

      <section>
        <h2>5. Third-Party Integrations</h2>
        <p>
          The Platform allows you to connect third-party services (Google Drive, Gmail, Google Calendar,
          Autodesk). By connecting these services, you authorise 5BLOC to access your data from these services
          on your behalf as described in our Privacy Policy. 5BLOC is not responsible for the availability,
          accuracy, or content of third-party services.
        </p>
      </section>

      <section>
        <h2>6. Intellectual Property</h2>
        <p>
          The Platform and its original content, features, and functionality are owned by 5BLOC Technologies
          and are protected by applicable intellectual property laws. Your project data and documents remain
          your property at all times.
        </p>
      </section>

      <section>
        <h2>7. Data and Privacy</h2>
        <p>
          Your use of the Platform is also governed by our <Link href="/privacy">Privacy Policy</Link>, which
          is incorporated into these Terms by reference.
        </p>
      </section>

      <section>
        <h2>8. Payments and Billing</h2>
        <p>
          Certain features of the Platform may require a paid subscription. Billing is processed securely
          through Razorpay. All fees are non-refundable unless otherwise stated. We reserve the right to
          modify pricing with 30 days&apos; notice.
        </p>
      </section>

      <section>
        <h2>9. Disclaimers</h2>
        <p>
          The Platform is provided &quot;as is&quot; without warranties of any kind, either express or
          implied. We do not warrant that the Platform will be uninterrupted, error-free, or free of harmful
          components. Construction decisions made using data from the Platform remain the sole responsibility
          of the professional making them.
        </p>
      </section>

      <section>
        <h2>10. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, 5BLOC Technologies shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages resulting from your use of the Platform.
        </p>
      </section>

      <section>
        <h2>11. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your account at any time for violation of these Terms.
          You may terminate your account at any time by contacting us at{' '}
          <a href="mailto:contact@5bloc.com">contact@5bloc.com</a>.
        </p>
      </section>

      <section>
        <h2>12. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of India. Any disputes
          shall be subject to the exclusive jurisdiction of the courts of Mumbai, Maharashtra.
        </p>
      </section>

      <section>
        <h2>13. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. Continued use of the Platform after changes
          constitutes acceptance of the new Terms.
        </p>
      </section>

      <section>
        <h2>14. Contact</h2>
        <p>For questions about these Terms, contact us at:</p>
        <p className="mt-2">
          <a href="mailto:contact@5bloc.com">contact@5bloc.com</a>
        </p>
        <p>5BLOC Technologies</p>
      </section>
    </LegalDocShell>
  )
}

export const Route = createFileRoute('/terms')({
  head: () => ({
    meta: [
      { title: 'Terms of Service — 5Bloc' },
      { name: 'description', content: 'The terms that govern your use of the 5Bloc project coordination platform.' },
      { property: 'og:title', content: 'Terms of Service — 5Bloc' },
      { property: 'og:description', content: 'The terms that govern your use of the 5Bloc project coordination platform.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: PageComponent,
})
