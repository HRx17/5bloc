import createFileRoute, { createFileRoute } from "@tanstack/react-router";
import ProjectsPage from "@/components/app/ProjectsPage";

export const Route = createFileRoute("/_authenticated/_app/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — 5Bloc" },
      { name: "description", content: "Every project in your practice, with status, phase and what needs attention." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProjectsPage,
});
