import { createFileRoute } from "@tanstack/react-router";
import ProjectIssuesPage from "@/components/app/ProjectIssuesPage";

export const Route = createFileRoute("/_authenticated/_app/projects/$id/issues")({
  head: () => ({
    meta: [
      { title: "Project issues — 5Bloc" },
      { name: "description", content: "Snags and open issues on site." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProjectIssuesPage,
});
