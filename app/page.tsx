import HomePage from '@/components/site/HomePage'
import { homepageJsonLd } from '@/lib/site/marketing'

export default function Page() {
  const jsonLd = homepageJsonLd()

  return (
    <>
      {jsonLd.map((block, i) => (
        <script
          key={(block as { '@type'?: string })['@type'] ?? i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <HomePage />
    </>
  )
}
