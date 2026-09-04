import { createFileRoute } from "@tanstack/react-router";
import ProjectPortalPage from "@/components/app/ProjectPortalPage";

export const Route = createFileRoute("/_authenticated/_app/projects/$id/portal")({
  head: () => ({
    meta: [
      { title: "Client portal — 5Bloc" },
      { name: "description", content: "Share progress, documents and updates with your client." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProjectPortalPage,
});
