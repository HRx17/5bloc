import { createFileRoute } from "@tanstack/react-router";
import SettingsPage from "@/components/app/SettingsPage";

export const Route = createFileRoute("/_authenticated/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — 5Bloc" },
      { name: "description", content: "Manage your profile, organisation and preferences." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SettingsPage,
});
