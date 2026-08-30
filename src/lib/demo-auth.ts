import type { User } from "@supabase/supabase-js";

/** Local demo bypass for product film / contest walkthrough (no real Supabase session). */
export const isDemoAuth =
  import.meta.env.VITE_GROUNDS_DEMO === "1" || import.meta.env.VITE_GROUNDS_DEMO === "true";

export const demoUser = {
  id: "grounds-demo-solo",
  email: "solo@grounds.local",
  app_metadata: {},
  user_metadata: { name: "Solo operator" },
  aud: "authenticated",
  created_at: new Date(0).toISOString(),
} as User;
