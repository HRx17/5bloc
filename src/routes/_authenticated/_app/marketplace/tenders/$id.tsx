import { createFileRoute } from "@tanstack/react-router";
import MarketplaceTenderPage from "@/components/app/MarketplaceTenderPage";

export const Route = createFileRoute("/_authenticated/_app/marketplace/tenders/$id")({
  head: () => ({
    meta: [
      { title: "Tender — 5Bloc" },
      { name: "description", content: "Scope, documents, deadline and bids for this tender." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MarketplaceTenderPage,
});
