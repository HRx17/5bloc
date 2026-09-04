import { createFileRoute } from "@tanstack/react-router";
import CalendarPage from "@/components/app/CalendarPage";

export const Route = createFileRoute("/_authenticated/_app/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — 5Bloc" },
      { name: "description", content: "Site visits, meetings and project milestones in one calendar." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CalendarPage,
});
