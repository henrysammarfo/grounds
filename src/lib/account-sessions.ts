import { supabase } from "@/integrations/supabase/client";

export type SessionRow = {
  id: string;
  created_at: string;
  refreshed_at: string | null;
  not_after: string | null;
  user_agent: string | null;
  ip: string | null;
  is_current: boolean;
};

/** Turns a raw user agent into a short "Chrome on macOS" style label. */
export function labelFromUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS X/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /(iPhone|iPad|iOS)/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";
  return `${browser} on ${os}`;
}

export async function fetchSessions(): Promise<SessionRow[]> {
  const { data, error } = await supabase.rpc("my_sessions");
  if (error) return [];
  return (data as SessionRow[]) ?? [];
}

/** Revokes one session. Throws with a readable message on failure. */
export async function revokeSession(sessionId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("revoke_session", { _session_id: sessionId });
  if (error) throw new Error(error.message);
  return Boolean(data);
}
