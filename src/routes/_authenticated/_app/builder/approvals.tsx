import { createFileRoute } from "@tanstack/react-router";
import BuilderApprovalsPage from "@/components/app/BuilderApprovalsPage";

export const Route = createFileRoute("/_authenticated/_app/builder/approvals")({
  head: () => ({
    meta: [
      { title: "Approvals — 5Bloc" },
      { name: "description", content: "Review and sign off pending approvals." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BuilderApprovalsPage,
});
