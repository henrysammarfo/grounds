import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { enforceSessionPersistence } from "@/lib/auth-session";

/** Local/product-demo only — never enable in production deploys. */
const demoAuth =
  import.meta.env.DEV && import.meta.env.VITE_GROUNDS_DEMO === "1"
    ? {
        id: "demo-user",
        email: "demo@grounds.local",
        app_metadata: {},
        user_metadata: { full_name: "GROUNDS demo" },
        aud: "authenticated",
        created_at: new Date(0).toISOString(),
      }
    : null;

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (demoAuth) return { user: demoAuth };
    await enforceSessionPersistence();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
