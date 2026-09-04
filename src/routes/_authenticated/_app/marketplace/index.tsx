import { createFileRoute } from "@tanstack/react-router";
import MarketplacePage from "@/components/app/MarketplacePage";

export const Route = createFileRoute("/_authenticated/_app/marketplace/")({
  head: () => ({
    meta: [
      { title: "Marketplace — 5Bloc" },
      { name: "description", content: "Find contractors, vendors and open tenders, and invite them to bid." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MarketplacePage,
});
