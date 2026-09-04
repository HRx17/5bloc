import { createFileRoute } from "@tanstack/react-router";
import ProjectPermitsPage from "@/components/app/ProjectPermitsPage";

export const Route = createFileRoute("/_authenticated/_app/projects/$id/permits")({
  head: () => ({
    meta: [
      { title: "Permits & approvals — 5Bloc" },
      { name: "description", content: "Statutory permits and approval tracking." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProjectPermitsPage,
});
