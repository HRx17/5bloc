import { createFileRoute } from "@tanstack/react-router";
import MessagesPage from "@/components/app/MessagesPage";

export const Route = createFileRoute("/_authenticated/_app/messages")({
  head: () => ({
    meta: [
      { title: "Messages — 5Bloc" },
      { name: "description", content: "Direct messages and group conversations with your team." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MessagesPage,
});
