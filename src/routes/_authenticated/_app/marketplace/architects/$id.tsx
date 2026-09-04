import { createFileRoute } from "@tanstack/react-router";
import MarketplaceArchitectPage from "@/components/app/MarketplaceArchitectPage";

export const Route = createFileRoute("/_authenticated/_app/marketplace/architects/$id")({
  head: () => ({
    meta: [
      { title: "Practice profile — 5Bloc" },
      { name: "description", content: "Studio profile, live projects and open tenders from this practice." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MarketplaceArchitectPage,
});
