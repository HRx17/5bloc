import { createFileRoute } from "@tanstack/react-router";
import ContractorDashboardPage from "@/components/app/ContractorDashboardPage";

export const Route = createFileRoute("/_authenticated/_app/contractor")({
  head: () => ({
    meta: [
      { title: "Contractor dashboard — 5Bloc" },
      { name: "description", content: "Your jobs, bids and site activity." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ContractorDashboardPage,
});
