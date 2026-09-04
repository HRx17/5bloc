import { createFileRoute } from "@tanstack/react-router";
import ProjectDocumentsPage from "@/components/app/ProjectDocumentsPage";

export const Route = createFileRoute("/_authenticated/_app/projects/$id/documents")({
  head: () => ({
    meta: [
      { title: "Project documents — 5Bloc" },
      { name: "description", content: "Drawings, specs and files for this project." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProjectDocumentsPage,
});
