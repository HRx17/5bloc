import { createFileRoute } from "@tanstack/react-router";
import ProjectMessagesPage from "@/components/app/ProjectMessagesPage";

export const Route = createFileRoute("/_authenticated/_app/projects/$id/messages")({
  head: () => ({
    meta: [
      { title: "Project chat — 5Bloc" },
      { name: "description", content: "Channel conversations for this project's team." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProjectMessagesPage,
});
