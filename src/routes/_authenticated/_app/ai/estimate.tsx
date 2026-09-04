import { createFileRoute } from "@tanstack/react-router";
import AiEstimatePage from "@/components/app/AiEstimatePage";

export const Route = createFileRoute("/_authenticated/_app/ai/estimate")({
  head: () => ({
    meta: [
      { title: "AI cost estimate — 5Bloc" },
      { name: "description", content: "Generate a detailed construction cost estimate." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AiEstimatePage,
});
