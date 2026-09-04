import { createFileRoute } from "@tanstack/react-router";
import HomePage from "@/components/site/HomePage";
import { SITE_DESCRIPTION, SITE_TITLE, homepageJsonLd } from "@/lib/site/marketing";

function IndexPage() {
  const jsonLd = homepageJsonLd();

  return (
    <>
      {jsonLd.map((block, i) => (
        <script
          key={(block as { "@type"?: string })["@type"] ?? i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <HomePage />
    </>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndexPage,
});
