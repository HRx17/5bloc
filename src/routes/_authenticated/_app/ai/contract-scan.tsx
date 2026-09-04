import { createFileRoute } from "@tanstack/react-router";
import AiContractScanPage from "@/components/app/AiContractScanPage";

export const Route = createFileRoute("/_authenticated/_app/ai/contract-scan")({
  head: () => ({
    meta: [
      { title: "AI contract scan — 5Bloc" },
      { name: "description", content: "Spot risky and missing clauses in a contract." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AiContractScanPage,
});
