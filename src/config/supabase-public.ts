/**
 * Public Supabase project config (publishable key is browser-safe; RLS enforces access).
 * Fallback when VITE_* vars are missing on external hosts (e.g. Vercel without Lovable secrets).
 */
export const SUPABASE_PUBLIC_URL = "https://ariogynmjsgiwbsskjjw.supabase.co";
export const SUPABASE_PUBLIC_PUBLISHABLE_KEY =
  "sb_publishable_lwQE2EkmhEU0Z83v7iT5ng_CoyFvGpT";
