import { createFileRoute } from "@tanstack/react-router";
import IntegrationsPage from "@/components/app/IntegrationsPage";

export const Route = createFileRoute("/_authenticated/_app/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — 5Bloc" },
      { name: "description", content: "Connect 5Bloc to the tools your team already uses." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: IntegrationsPage,
});
