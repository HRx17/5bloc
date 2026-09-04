import { createFileRoute } from "@tanstack/react-router";
import DashboardPage from "@/components/app/DashboardPage";

export const Route = createFileRoute("/_authenticated/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — 5Bloc" },
      {
        name: "description",
        content:
          "Your practice at a glance: active projects, what needs attention, and recent activity.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardPage,
});
