import { createFileRoute } from "@tanstack/react-router";
import ClientDetailPage from "@/components/app/ClientDetailPage";

export const Route = createFileRoute("/_authenticated/_app/clients/$id")({
  head: () => ({
    meta: [
      { title: "Client — 5Bloc" },
      { name: "description", content: "Client profile, projects, invoices and activity history." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ClientDetailPage,
});
