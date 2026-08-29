import { supabase } from "@/integrations/supabase/client";

/**
 * "Remember me" handling.
 *
 * The Supabase client always persists its session in browser storage so the
 * access token can be refreshed. When the user opts OUT of "remember me" we
 * mark the session as tab-scoped: a marker is written to sessionStorage, which
 * the browser clears on restart. On the next boot the marker is gone, so the
 * stored session is discarded before any protected route can use it.
 */
const REMEMBER_KEY = "grounds.remember-me";
const TAB_KEY = "grounds.session-active";

export function setRememberMe(remember: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
  window.sessionStorage.setItem(TAB_KEY, "1");
}

export function getRememberMe(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(REMEMBER_KEY) !== "0";
}

export function clearRememberMe() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REMEMBER_KEY);
  window.sessionStorage.removeItem(TAB_KEY);
}

let enforced: Promise<void> | null = null;

/** Discards a non-remembered session that survived a browser restart. */
export function enforceSessionPersistence(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (enforced) return enforced;

  enforced = (async () => {
    const remembered = window.localStorage.getItem(REMEMBER_KEY) !== "0";
    if (remembered || window.sessionStorage.getItem(TAB_KEY)) {
      window.sessionStorage.setItem(TAB_KEY, "1");
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) await supabase.auth.signOut();
    window.localStorage.removeItem(REMEMBER_KEY);
  })();

  return enforced;
}
