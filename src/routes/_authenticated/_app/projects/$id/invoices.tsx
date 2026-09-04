import { createFileRoute } from "@tanstack/react-router";
import ProjectInvoicesPage from "@/components/app/ProjectInvoicesPage";

export const Route = createFileRoute("/_authenticated/_app/projects/$id/invoices")({
  head: () => ({
    meta: [
      { title: "Project invoices — 5Bloc" },
      { name: "description", content: "Billing and payments for this project." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProjectInvoicesPage,
});
