import { createFileRoute } from "@tanstack/react-router";
import NewProjectPage from "@/components/app/NewProjectPage";

export const Route = createFileRoute("/_authenticated/_app/projects/new")({
  head: () => ({
    meta: [
      { title: "New project — 5Bloc" },
      { name: "description", content: "Set up a new project: client, site, scope, phases and team." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: NewProjectPage,
});
