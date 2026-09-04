import { createFileRoute } from "@tanstack/react-router";
import ProjectSettingsPage from "@/components/app/ProjectSettingsPage";

export const Route = createFileRoute("/_authenticated/_app/projects/$id/settings")({
  head: () => ({
    meta: [
      { title: "Project settings — 5Bloc" },
      { name: "description", content: "Rename, configure and archive this project." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProjectSettingsPage,
});
