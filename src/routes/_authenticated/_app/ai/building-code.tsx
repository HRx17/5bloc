import { createFileRoute } from "@tanstack/react-router";
import AiBuildingCodePage from "@/components/app/AiBuildingCodePage";

export const Route = createFileRoute("/_authenticated/_app/ai/building-code")({
  head: () => ({
    meta: [
      { title: "AI building code check — 5Bloc" },
      { name: "description", content: "Check local building code and clearance requirements." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AiBuildingCodePage,
});
