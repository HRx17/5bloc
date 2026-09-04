import createFileRoute, { createFileRoute } from "@tanstack/react-router";
import DocumentsPage from "@/components/app/DocumentsPage";

export const Route = createFileRoute("/_authenticated/_app/documents")({
  head: () => ({
    meta: [
      { title: "Documents — 5Bloc" },
      { name: "description", content: "All drawings, specifications and files across your projects." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DocumentsPage,
});
