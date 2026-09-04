import { createFileRoute } from "@tanstack/react-router";
import InvoicesPage from "@/components/app/InvoicesPage";

export const Route = createFileRoute("/_authenticated/_app/invoices/")({
  head: () => ({
    meta: [
      { title: "Invoices — 5Bloc" },
      { name: "description", content: "Raise, send and track invoices across every project and client." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InvoicesPage,
});
