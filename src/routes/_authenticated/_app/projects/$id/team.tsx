import { createFileRoute } from "@tanstack/react-router";
import ProjectTeamPage from "@/components/app/ProjectTeamPage";

export const Route = createFileRoute("/_authenticated/_app/projects/$id/team")({
  head: () => ({
    meta: [
      { title: "Project team — 5Bloc" },
      { name: "description", content: "People and consultants working on this project." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProjectTeamPage,
});
