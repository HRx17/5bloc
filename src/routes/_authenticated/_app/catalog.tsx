import { createFileRoute } from "@tanstack/react-router";
import CatalogPage from "@/components/app/CatalogPage";

export const Route = createFileRoute("/_authenticated/_app/catalog")({
  head: () => ({
    meta: [
      { title: "Materials catalog — 5Bloc" },
      { name: "description", content: "Browse materials and products for your projects." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CatalogPage,
});
