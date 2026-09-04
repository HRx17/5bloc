import { createFileRoute } from "@tanstack/react-router";
import CadPage from "@/components/app/CadPage";

export const Route = createFileRoute("/_authenticated/_app/cad")({
  head: () => ({
    meta: [
      { title: "CAD viewer — 5Bloc" },
      { name: "description", content: "View and mark up drawings and models." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CadPage,
});
