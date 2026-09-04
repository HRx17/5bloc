import { createFileRoute } from "@tanstack/react-router";
import ProjectTransmittalsPage from "@/components/app/ProjectTransmittalsPage";

export const Route = createFileRoute("/_authenticated/_app/projects/$id/transmittals")({
  head: () => ({
    meta: [
      { title: "Transmittals — 5Bloc" },
      { name: "description", content: "Documents issued and received on this project." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProjectTransmittalsPage,
});
