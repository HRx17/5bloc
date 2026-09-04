import createFileRoute from "@tanstack/react-router";
import ClientsPage from "@/components/app/ClientsPage";

export const Route = createFileRoute("/_authenticated/_app/clients/")({
  head: () => ({
    meta: [
      { title: "Clients — 5Bloc" },
      { name: "description", content: "Your client pipeline, contact details and project value at a glance." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ClientsPage,
});
