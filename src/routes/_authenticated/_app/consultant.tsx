import { createFileRoute } from "@tanstack/react-router";
import ConsultantDashboardPage from "@/components/app/ConsultantDashboardPage";

export const Route = createFileRoute("/_authenticated/_app/consultant")({
  head: () => ({
    meta: [
      { title: "Consultant dashboard — 5Bloc" },
      { name: "description", content: "Your assignments, submittals and payments." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ConsultantDashboardPage,
});
