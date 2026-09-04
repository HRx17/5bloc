import { createFileRoute } from "@tanstack/react-router";
import CoordinationPage from "@/components/app/CoordinationPage";

export const Route = createFileRoute("/_authenticated/_app/coordination")({
  head: () => ({
    meta: [
      { title: "Coordination — 5Bloc" },
      { name: "description", content: "Coordinate teams, trades and schedules across projects." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CoordinationPage,
});
