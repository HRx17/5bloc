import { createFileRoute } from "@tanstack/react-router";
import ProjectOverviewPage from "@/components/app/ProjectOverviewPage";

export const Route = createFileRoute("/_authenticated/_app/projects/$id/")({
  head: () => ({
    meta: [
      { title: "Project overview — 5Bloc" },
      { name: "description", content: "Timeline, milestones and everything happening on this project." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProjectOverviewPage,
});
