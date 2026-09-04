import { createFileRoute } from "@tanstack/react-router";
import ProjectSitePage from "@/components/app/ProjectSitePage";

export const Route = createFileRoute("/_authenticated/_app/projects/$id/site")({
  head: () => ({
    meta: [
      { title: "Site reports — 5Bloc" },
      { name: "description", content: "Daily site reports and progress photos." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProjectSitePage,
});
