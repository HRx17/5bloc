import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/projects/$id/settings")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/projects/$id", params: { id: params.id } });
  },
  component: () => null,
});
