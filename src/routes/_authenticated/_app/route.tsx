import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";

type Profile = {
  id?: string;
  auth_id?: string | null;
  email?: string | null;
  full_name?: string | null;
  role?: string;
  avatar_url?: string | null;
  plan?: string;
  organisations?: { name?: string } | null;
};

function AppLayout() {
  const [profile, setProfile] = useState<Profile | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.profile) setProfile(data.profile as Profile);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell userProfile={profile}>
      <Outlet />
    </AppShell>
  );
}

export const Route = createFileRoute("/_authenticated/_app")({
  component: AppLayout,
});
