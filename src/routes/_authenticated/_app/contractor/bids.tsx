import { createFileRoute } from "@tanstack/react-router";
import ContractorBidsPage from "@/components/app/ContractorBidsPage";

export const Route = createFileRoute("/_authenticated/_app/contractor/bids")({
  head: () => ({
    meta: [
      { title: "My bids — 5Bloc" },
      { name: "description", content: "Track the tenders you have bid on." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ContractorBidsPage,
});
