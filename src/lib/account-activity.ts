import { supabase } from "@/integrations/supabase/client";

export type ActivityEvent =
  | "sign_in"
  | "sign_up"
  | "sign_out_all"
  | "password_changed"
  | "password_reset_requested"
  | "email_change_requested"
  | "email_verification_sent"
  | "profile_updated"
  | "google_linked"
  | "google_unlinked";

export type ActivityRow = {
  id: string;
  event: string;
  detail: string | null;
  device: string | null;
  created_at: string;
};

export const EVENT_LABELS: Record<string, string> = {
  sign_in: "Signed in",
  sign_up: "Account created",
  sign_out_all: "Signed out of all devices",
  password_changed: "Password changed",
  password_reset_requested: "Password reset requested",
  email_change_requested: "Email change requested",
  email_verification_sent: "Verification email sent",
  profile_updated: "Profile updated",
  google_linked: "Google connected",
  google_unlinked: "Google disconnected",
};

/** Short, human-readable device description from the user agent. */
export function describeDevice(): string {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Safari\//.test(ua)
          ? "Safari"
          : /Firefox\//.test(ua)
            ? "Firefox"
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

/** Records an account event. Never throws — logging must not break a flow. */
export async function logActivity(event: ActivityEvent, detail?: string) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;
    await supabase
      .from("account_activity")
      .insert({ user_id: userId, event, detail: detail ?? null, device: describeDevice() });
  } catch {
    /* ignore */
  }
}

export async function fetchActivity(limit = 20): Promise<ActivityRow[]> {
  const { data } = await supabase
    .from("account_activity")
    .select("id, event, detail, device, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as ActivityRow[]) ?? [];
}
