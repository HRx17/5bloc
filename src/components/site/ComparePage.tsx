import type { ReactNode } from 'react'
import Link from '@/compat/next-link'
import { LegalDocShell } from '@/components/site/LegalDocShell'

export function ComparePage({
  title,
  description,
  updated,
  intro,
  rows,
  children,
}: {
  title: string
  description: string
  updated: string
  intro: string
  rows: { label: string; us: string; them: string }[]
  children: ReactNode
}) {
  return (
    <LegalDocShell title={title} updated={updated} description={description}>
      <section>
        <p>{intro}</p>
      </section>

      <section>
        <h2>At a glance</h2>
        <div className="overflow-x-auto rounded-xl" style={{ boxShadow: 'inset 0 0 0 1px var(--lp-border)' }}>
          <table>
            <thead>
              <tr>
                <th> </th>
                <th>5Bloc</th>
                <th>{title.replace(/^5Bloc vs /, '')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="font-medium" style={{ color: 'var(--lp-text)' }}>
                    {row.label}
                  </td>
                  <td>{row.us}</td>
                  <td>{row.them}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {children}

      <section>
        <h2>See it on a real project</h2>
        <p>
          Join the waitlist or open the live demo. Invited contractors and clients stay free.
        </p>
        <p className="mt-4 flex flex-wrap gap-4">
          <Link href="/#waitlist" className="lp-btn text-[15px]">
            Join the waitlist
          </Link>
          <Link href="/#prototype" className="lp-link text-[15px] py-2">
            Try the demo ›
          </Link>
        </p>
      </section>
    </LegalDocShell>
  )
}
