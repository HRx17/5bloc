import { createFileRoute } from "@tanstack/react-router";
import ProjectMeetingsPage from "@/components/app/ProjectMeetingsPage";

export const Route = createFileRoute("/_authenticated/_app/projects/$id/meetings")({
  head: () => ({
    meta: [
      { title: "Project meetings — 5Bloc" },
      { name: "description", content: "Meetings, agendas and minutes." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProjectMeetingsPage,
});
