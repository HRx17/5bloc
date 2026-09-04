import { createFileRoute } from "@tanstack/react-router";
import NewInvoicePage from "@/components/app/NewInvoicePage";

export const Route = createFileRoute("/_authenticated/_app/invoices/new")({
  head: () => ({
    meta: [
      { title: "New invoice — 5Bloc" },
      { name: "description", content: "Create an invoice with line items, taxes and payment terms." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: NewInvoicePage,
});
