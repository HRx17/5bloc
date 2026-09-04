import { createFileRoute } from "@tanstack/react-router";
import ContractorProfilePage from "@/components/app/ContractorProfilePage";

export const Route = createFileRoute("/_authenticated/_app/contractor/profile")({
  head: () => ({
    meta: [
      { title: "Contractor profile — 5Bloc" },
      { name: "description", content: "Manage your public marketplace profile." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ContractorProfilePage,
});
