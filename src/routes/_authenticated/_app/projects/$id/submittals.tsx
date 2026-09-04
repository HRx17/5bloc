import { createFileRoute } from "@tanstack/react-router";
import ProjectSubmittalsPage from "@/components/app/ProjectSubmittalsPage";

export const Route = createFileRoute("/_authenticated/_app/projects/$id/submittals")({
  head: () => ({
    meta: [
      { title: "Project submittals — 5Bloc" },
      { name: "description", content: "Submittals and their review status." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProjectSubmittalsPage,
});
