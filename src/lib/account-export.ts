import { supabase } from "@/integrations/supabase/client";
import { fetchActivity } from "@/lib/account-activity";
import { fetchSessions } from "@/lib/account-sessions";

/**
 * Collects everything this account holds and returns it as a JSON string.
 * Only data readable by the signed-in user (RLS applies) is included — no
 * tokens, passwords or other credentials.
 */
export async function buildAccountExport(): Promise<{ filename: string; json: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("You are not signed in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const [activity, sessions] = await Promise.all([fetchActivity(1000), fetchSessions()]);

  const payload = {
    export_format: "grounds.account-export.v1",
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email ?? null,
      email_verified: Boolean(user.email_confirmed_at),
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
      user_metadata: user.user_metadata ?? {},
    },
    sign_in_methods: (user.identities ?? []).map((i) => ({
      provider: i.provider,
      email: (i.identity_data as Record<string, unknown> | undefined)?.["email"] ?? null,
      created_at: i.created_at ?? null,
      last_sign_in_at: i.last_sign_in_at ?? null,
    })),
    profile: profile ?? null,
    active_sessions: sessions.map((s) => ({
      id: s.id,
      created_at: s.created_at,
      last_active: s.refreshed_at,
      user_agent: s.user_agent,
      ip: s.ip,
      current: s.is_current,
    })),
    activity_log: activity,
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    filename: `grounds-account-export-${stamp}.json`,
    json: JSON.stringify(payload, null, 2),
  };
}

export function downloadFile(filename: string, contents: string, type = "application/json") {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
