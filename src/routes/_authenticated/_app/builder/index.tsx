import { createFileRoute } from "@tanstack/react-router";
import BuilderDashboardPage from "@/components/app/BuilderDashboardPage";

export const Route = createFileRoute("/_authenticated/_app/builder/")({
  head: () => ({
    meta: [
      { title: "Builder dashboard — 5Bloc" },
      { name: "description", content: "Approvals, budgets and progress across your builds." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BuilderDashboardPage,
});
