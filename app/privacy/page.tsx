import Link from 'next/link'
import { LegalDocShell } from '@/components/site/LegalDocShell'

export const metadata = {
  title: 'Privacy Policy — 5BLOC',
  description: 'Privacy Policy for 5BLOC construction project management platform.',
}

export default function PrivacyPolicy() {
  return (
    <LegalDocShell title="Privacy Policy" updated="June 14, 2026">
      <section>
        <h2>1. Introduction</h2>
        <p>
          5BLOC (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the 5BLOC construction project management
          platform accessible at <strong>5bloc.com</strong>. This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you use our platform.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <p className="mb-3">We collect information you provide directly to us, including:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Account information (name, email address, organisation name)</li>
          <li>Project data (documents, RFIs, invoices, meeting notes)</li>
          <li>Communications and messages within the platform</li>
          <li>Usage data and analytics to improve the service</li>
        </ul>
        <p className="mt-3">
          When you connect third-party services (Google Drive, Gmail, Google Calendar, Autodesk), we receive
          OAuth access tokens that allow us to access only the data you explicitly authorise. We do not store
          the full contents of your emails or files — we only display them within the platform on your request.
        </p>
      </section>

      <section>
        <h2>3. Google User Data</h2>
        <p className="mb-3">
          If you connect your Google account, 5BLOC accesses the following data solely to provide in-app
          functionality:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Google Drive</strong> (<code>drive.file</code>): Access only files and folders you
            explicitly select via the Google Picker in the Documents section.
          </li>
          <li>
            <strong>Gmail</strong> (read-only): Display your email threads within the Coordination section of
            the platform.
          </li>
          <li>
            <strong>Google Calendar</strong> (read-only): Display your upcoming calendar events on the
            Dashboard.
          </li>
        </ul>
        <p className="mt-3">
          We store only your OAuth access token and refresh token in our secure database to maintain your
          connection. We do not share, sell, or use your Google data for any purpose other than displaying it
          to you within the platform.
        </p>
        <p className="mt-3">
          5BLOC&apos;s use and transfer of information received from Google APIs adheres to the{' '}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noreferrer"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
      </section>

      <section>
        <h2>4. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>To provide, operate, and maintain the 5BLOC platform</li>
          <li>To send transactional emails (project updates, RFI notifications)</li>
          <li>To improve and personalise your experience</li>
          <li>To comply with legal obligations</li>
        </ul>
      </section>

      <section>
        <h2>5. Data Storage and Security</h2>
        <p>
          Your data is stored securely using Supabase (PostgreSQL). OAuth tokens are stored in encrypted form.
          We implement industry-standard security measures including row-level security policies to ensure you
          can only access your own data.
        </p>
      </section>

      <section>
        <h2>6. Data Sharing</h2>
        <p>
          We do not sell, trade, or rent your personal information to third parties. We may share data only
          with trusted service providers who assist in operating our platform (Supabase, Vercel, Resend,
          Cloudflare) and only to the extent necessary to provide the service.
        </p>
      </section>

      <section>
        <h2>7. Data Retention</h2>
        <p>
          We retain your data for as long as your account is active. You may request deletion of your account
          and all associated data at any time by contacting us at{' '}
          <a href="mailto:contact@5bloc.com">contact@5bloc.com</a>. Disconnecting a third-party integration
          (Google, Autodesk) immediately deletes the associated OAuth tokens from our database.
        </p>
      </section>

      <section>
        <h2>8. Your Rights</h2>
        <p>
          You have the right to access, correct, or delete your personal data. You may also revoke third-party
          integrations at any time from the Integrations page within the platform, or directly from your Google
          account settings at{' '}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
            myaccount.google.com/permissions
          </a>
          .
        </p>
      </section>

      <section>
        <h2>9. Cookies</h2>
        <p>
          We use session cookies solely for authentication purposes. We do not use tracking or advertising
          cookies.
        </p>
      </section>

      <section>
        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of significant changes via
          email or a notice within the platform.
        </p>
      </section>

      <section>
        <h2>11. Contact Us</h2>
        <p>For any privacy-related questions or requests, please contact us at:</p>
        <p className="mt-2">
          <a href="mailto:contact@5bloc.com">contact@5bloc.com</a>
        </p>
        <p>5BLOC Technologies</p>
      </section>

      <p className="pt-4">
        See also our <Link href="/terms">Terms of Service</Link>.
      </p>
    </LegalDocShell>
  )
}
