import { createFileRoute } from "@tanstack/react-router";
import ClientDashboardPage from "@/components/app/ClientDashboardPage";

export const Route = createFileRoute("/_authenticated/_app/client")({
  head: () => ({
    meta: [
      { title: "Client dashboard — 5Bloc" },
      { name: "description", content: "Track your project's progress, documents and payments." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ClientDashboardPage,
});
