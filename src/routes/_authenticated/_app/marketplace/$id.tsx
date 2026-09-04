import { createFileRoute } from "@tanstack/react-router";
import MarketplaceContractorPage from "@/components/app/MarketplaceContractorPage";

export const Route = createFileRoute("/_authenticated/_app/marketplace/$id")({
  head: () => ({
    meta: [
      { title: "Contractor profile — 5Bloc" },
      { name: "description", content: "Trades, coverage, reviews and past work for this contractor." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MarketplaceContractorPage,
});
