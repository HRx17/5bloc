import { createFileRoute } from "@tanstack/react-router";
import ProjectRfisPage from "@/components/app/ProjectRfisPage";

export const Route = createFileRoute("/_authenticated/_app/projects/$id/rfis")({
  head: () => ({
    meta: [
      { title: "Project RFIs — 5Bloc" },
      { name: "description", content: "Requests for information raised on this project." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProjectRfisPage,
});
