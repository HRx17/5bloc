import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Read the locally stored session first: it avoids a network round-trip on
    // every navigation (which can trip auth rate limits) and keeps tab
    // switching instant. Only fall back to the network when nothing is stored.
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (session?.user) return { user: session.user };

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
