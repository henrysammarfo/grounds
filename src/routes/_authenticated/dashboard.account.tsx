import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { UserIdentity, User } from "@supabase/supabase-js";
import {
  AlertTriangle,
  BadgeCheck,
  Download,
  History,
  KeyRound,
  Link2,
  Link2Off,
  Mail,
  MailWarning,
  Monitor,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getRememberMe, setRememberMe, clearRememberMe } from "@/lib/auth-session";
import {
  EVENT_LABELS,
  describeDevice,
  fetchActivity,
  logActivity,
  type ActivityRow,
} from "@/lib/account-activity";
import {
  fetchSessions,
  labelFromUserAgent,
  revokeSession,
  type SessionRow,
} from "@/lib/account-sessions";
import { buildAccountExport, downloadFile } from "@/lib/account-export";
import { MIN_SCORE, breachCount, scorePassword } from "@/lib/password-strength";
import { PasswordStrength } from "@/components/dash/PasswordStrength";
import { deleteMyAccount } from "@/lib/account.functions";


export const Route = createFileRoute("/_authenticated/dashboard/account")({
  head: () => ({
    meta: [
      { title: "Account — GROUNDS profile and sign-in settings" },
      {
        name: "description",
        content:
          "View and edit your GROUNDS profile, manage linked Google and email credentials, change your password and session preferences.",
      },
      { property: "og:title", content: "Account settings — GROUNDS" },
      {
        property: "og:description",
        content: "Profile details, linked sign-in methods, password and session preferences.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionSince, setSessionSince] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [breach, setBreach] = useState<number | null>(null);
  const [checkingBreach, setCheckingBreach] = useState(false);
  const navigate = useNavigate();

  const strength = useMemo(() => scorePassword(newPassword), [newPassword]);

  async function loadActivity() {
    setActivity(await fetchActivity(25));
  }

  async function loadSessions() {
    setSessions(await fetchSessions());
  }

  async function refresh() {
    const { data } = await supabase.auth.getUser();
    const u = data.user ?? null;
    setUser(u);
    setNewEmail(u?.email ?? "");
    setIdentities(u?.identities ?? []);
    if (u) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", u.id)
        .maybeSingle();
      setDisplayName(profile?.display_name ?? "");
      setAvatarUrl(profile?.avatar_url ?? "");
      await Promise.all([loadActivity(), loadSessions()]);
    }
    setLoading(false);
  }

  useEffect(() => {
    setRemember(getRememberMe());
    refresh();
    supabase.auth.getSession().then(({ data }) => {
      const expires = data.session?.expires_at;
      if (expires) setSessionSince(new Date(expires * 1000).toLocaleString());
    });
  }, []);

  // Debounced breach lookup (k-anonymity: only a hash prefix leaves the browser).
  useEffect(() => {
    if (newPassword.length < 6) {
      setBreach(null);
      setCheckingBreach(false);
      return;
    }
    setCheckingBreach(true);
    let cancelled = false;
    const t = setTimeout(async () => {
      const count = await breachCount(newPassword);
      if (cancelled) return;
      setBreach(count);
      setCheckingBreach(false);
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [newPassword]);


  const hasPassword = identities.some((i) => i.provider === "email");
  const googleIdentity = identities.find((i) => i.provider === "google");

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy("profile");
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: displayName, avatar_url: avatarUrl || null });
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile saved.");
      await logActivity("profile_updated", displayName || undefined);
      loadActivity();
    }
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    const { error } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: `${window.location.origin}/dashboard/account` },
    );
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Confirm the change from the link sent to your new address.");
      await logActivity("email_change_requested", newEmail);
      loadActivity();
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (strength.score < MIN_SCORE) {
      toast.error("That password is too weak — make it longer and mix character types.");
      return;
    }
    setBusy("password");
    // Final breach check in case the debounced one has not resolved yet.
    const known = breach ?? (await breachCount(newPassword));
    setBreach(known);
    if (known && known > 0) {
      setBusy(null);
      toast.error("This password appears in known data breaches. Choose a different one.");
      return;
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      ...(currentPassword ? { current_password: currentPassword } : {}),
    } as Parameters<typeof supabase.auth.updateUser>[0]);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setBreach(null);
    toast.success(hasPassword ? "Password updated." : "Password set — you can now sign in with email.");
    await logActivity("password_changed");
    refresh();
  }

  async function exportData() {
    setBusy("export");
    try {
      const { filename, json } = await buildAccountExport();
      downloadFile(filename, json);
      toast.success("Your account data has been downloaded.");
      await logActivity("data_exported", filename);
      loadActivity();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not build the export.");
    } finally {
      setBusy(null);
    }
  }

  async function revokeOne(session: SessionRow) {
    setBusy(`session:${session.id}`);
    try {
      const ok = await revokeSession(session.id);
      if (!ok) {
        toast.error("That session is no longer active.");
      } else {
        toast.success("Session revoked — that device has been signed out.");
        await logActivity("session_revoked", labelFromUserAgent(session.user_agent));
        loadActivity();
      }
      await loadSessions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not revoke that session.");
    } finally {
      setBusy(null);
    }
  }


  async function sendResetLink() {
    if (!user?.email) return;
    setBusy("reset");
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success(`Reset link sent to ${user.email}.`);
      await logActivity("password_reset_requested", user.email);
      loadActivity();
    }
  }

  async function resendVerification() {
    if (!user?.email) return;
    setBusy("verify");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard/account` },
    });
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success(`Verification email sent to ${user.email}.`);
      await logActivity("email_verification_sent", user.email);
      loadActivity();
    }
  }

  async function signOutEverywhere() {
    setBusy("global");
    await logActivity("sign_out_all");
    const { error } = await supabase.auth.signOut({ scope: "global" });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    clearRememberMe();
    toast.success("Signed out on every device.");
    navigate({ to: "/auth", replace: true });
  }

  async function deleteAccount() {
    setBusy("delete");
    try {
      await deleteMyAccount();
      clearRememberMe();
      await supabase.auth.signOut();
      toast.success("Your account has been permanently deleted.");
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the account.");
    } finally {
      setBusy(null);
    }
  }

  async function linkGoogle() {
    setBusy("google");
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard/account` },
    });
    setBusy(null);
    if (error) toast.error(error.message);
    else await logActivity("google_linked");
  }

  async function unlinkGoogle() {
    if (!googleIdentity) return;
    if (identities.length < 2) {
      toast.error("Add a password first so you don't lose access.");
      return;
    }
    setBusy("google");
    const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Google disconnected.");
      await logActivity("google_unlinked");
      refresh();
    }
  }

  function toggleRemember(value: boolean) {
    setRemember(value);
    setRememberMe(value);
    toast.success(
      value
        ? "You'll stay signed in on this device."
        : "This session now ends when the browser closes.",
    );
  }

  const verified = Boolean(user?.email_confirmed_at);




  if (loading) {
    return <p className="t-meta">Loading your account…</p>;
  }

  return (
    <div className="max-w-[880px] space-y-6">
      <header>
        <h1 className="t-display-sm">Account</h1>
        <p className="t-meta mt-2">
          Your profile, sign-in methods and session preferences.
        </p>
      </header>

      {!verified && (
        <section className="panel flex flex-wrap items-start gap-4 border-warning/40 p-6">
          <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={2} />
          <div className="flex-1 min-w-[240px]">
            <p className="t-item">Verify your email address</p>
            <p className="t-caption mt-1">
              We sent a confirmation link to {user?.email}. Verifying keeps password resets and
              security alerts working.
            </p>
          </div>
          <button
            type="button"
            onClick={resendVerification}
            disabled={busy === "verify"}
            className="btn-ink hover:opacity-90 disabled:opacity-60"
          >
            <Mail className="h-4 w-4" strokeWidth={2} />
            Resend verification
          </button>
        </section>
      )}

      <section className="panel p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-[14px] font-semibold text-on-dark">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (displayName || user?.email || "gr").slice(0, 2).toUpperCase()
            )}
          </span>
          <div>
            <p className="t-heading">{displayName || "Unnamed reviewer"}</p>
            <p className="t-meta mt-1 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" strokeWidth={2} />
              {user?.email}
              {user?.email_confirmed_at && (
                <BadgeCheck className="h-3.5 w-3.5 text-success" strokeWidth={2.2} />
              )}
            </p>
          </div>
        </div>

        <form className="mt-7 grid gap-4 sm:grid-cols-2" onSubmit={saveProfile}>
          <div>
            <label htmlFor="display-name" className="t-item mb-2 block">
              Display name
            </label>
            <input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="t-body h-11 w-full rounded-xl border border-border px-4 outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="avatar-url" className="t-item mb-2 block">
              Avatar URL
            </label>
            <input
              id="avatar-url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
              className="t-body h-11 w-full rounded-xl border border-border px-4 outline-none focus:border-accent"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy === "profile"}
              className="btn-ink hover:opacity-90 disabled:opacity-60"
            >
              <UserRound className="h-4 w-4" strokeWidth={2} />
              Save profile
            </button>
          </div>
        </form>
      </section>

      <section className="panel p-7">
        <h2 className="t-heading">Sign-in methods</h2>
        <p className="t-meta mt-2">
          Keep at least one method connected. Linking both lets you sign in either way.
        </p>

        <div className="mt-6 divide-y divide-border-row rounded-xl border border-border-row">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-3">
              <KeyRound className="h-4.5 w-4.5 text-accent" strokeWidth={2} />
              <div>
                <p className="t-item">Email and password</p>
                <p className="t-caption mt-0.5">
                  {hasPassword ? `Enabled for ${user?.email}` : "Not set up yet"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={sendResetLink}
              disabled={busy === "reset" || !hasPassword}
              className="t-ui rounded-full border border-border px-3.5 py-1.5 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Email me a reset link
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-3">
              <GoogleGlyph />
              <div>
                <p className="t-item">Google</p>
                <p className="t-caption mt-0.5">
                  {googleIdentity
                    ? `Connected${googleIdentity.identity_data?.["email"] ? ` · ${googleIdentity.identity_data["email"]}` : ""}`
                    : "Not connected"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={googleIdentity ? unlinkGoogle : linkGoogle}
              disabled={busy === "google"}
              className="t-ui inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              {googleIdentity ? (
                <>
                  <Link2Off className="h-3.5 w-3.5" strokeWidth={2} />
                  Disconnect
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5" strokeWidth={2} />
                  Connect
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <form className="panel p-7" onSubmit={changeEmail}>
          <h2 className="t-heading">Email address</h2>
          <p className="t-meta mt-2">Changing it sends a confirmation to the new address.</p>
          <label htmlFor="new-email" className="t-item mb-2 mt-5 block">
            Email
          </label>
          <input
            id="new-email"
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="t-body h-11 w-full rounded-xl border border-border px-4 outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy === "email" || newEmail === user?.email}
            className="btn-outline-ink mt-4 w-full hover:bg-secondary disabled:opacity-50"
          >
            Update email
          </button>
        </form>

        <form className="panel p-7" onSubmit={changePassword}>
          <h2 className="t-heading">{hasPassword ? "Change password" : "Add a password"}</h2>
          <p className="t-meta mt-2">
            {hasPassword
              ? "Enter your current password to confirm the change."
              : "Set a password so you can sign in without Google."}
          </p>
          {hasPassword && (
            <>
              <label htmlFor="current-password" className="t-item mb-2 mt-5 block">
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="t-body h-11 w-full rounded-xl border border-border px-4 outline-none focus:border-accent"
              />
            </>
          )}
          <label htmlFor="account-new-password" className="t-item mb-2 mt-4 block">
            New password
          </label>
          <input
            id="account-new-password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="t-body h-11 w-full rounded-xl border border-border px-4 outline-none focus:border-accent"
          />
          <PasswordStrength
            password={newPassword}
            strength={strength}
            breach={breach}
            checking={checkingBreach}
          />
          <button
            type="submit"
            disabled={
              busy === "password" ||
              checkingBreach ||
              strength.score < MIN_SCORE ||
              Boolean(breach && breach > 0)
            }
            className="btn-outline-ink mt-4 w-full hover:bg-secondary disabled:opacity-50"
          >
            {hasPassword ? "Update password" : "Set password"}
          </button>

        </form>
      </section>

      <section className="panel p-7">
        <h2 className="t-heading">Session</h2>
        <label htmlFor="account-remember" className="mt-5 flex cursor-pointer items-start gap-3">
          <input
            id="account-remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => toggleRemember(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-[oklch(0.62_0.15_230)]"
          />
          <span>
            <span className="t-item block">Keep me signed in on this device</span>
            <span className="t-caption">
              Off means the session is discarded when the browser closes — recommended on shared
              machines.
            </span>
          </span>
        </label>
        <p className="t-caption mt-5 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
          Sessions are stored as short-lived tokens and refreshed automatically.
        </p>
      </section>

      <section className="panel p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="t-heading">Active sessions</h2>
            <p className="t-meta mt-2">
              Signing out everywhere revokes every refresh token, including other browsers and
              devices.
            </p>
          </div>
          <button
            type="button"
            onClick={signOutEverywhere}
            disabled={busy === "global"}
            className="btn-outline-ink hover:bg-secondary disabled:opacity-50"
          >
            Sign out of all devices
          </button>
        </div>

        <ul className="mt-6 divide-y divide-border-row rounded-xl border border-border-row">
          {sessions.length === 0 && (
            <li className="flex items-center gap-3 px-5 py-4">
              <Monitor className="h-4.5 w-4.5 text-accent" strokeWidth={2} />
              <div>
                <p className="t-item">{describeDevice()}</p>
                <p className="t-caption mt-0.5">
                  This device{sessionSince ? ` · token renews ${sessionSince}` : ""}
                </p>
              </div>
            </li>
          )}
          {sessions.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3">
                <Monitor
                  className={`h-4.5 w-4.5 ${s.is_current ? "text-accent" : "text-muted-foreground"}`}
                  strokeWidth={2}
                />
                <div>
                  <p className="t-item">{labelFromUserAgent(s.user_agent)}</p>
                  <p className="t-caption mt-0.5">
                    {[
                      s.is_current ? "This device" : null,
                      s.ip ? `IP ${s.ip}` : null,
                      s.refreshed_at
                        ? `Last active ${new Date(s.refreshed_at).toLocaleString()}`
                        : `Started ${new Date(s.created_at).toLocaleString()}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
              {s.is_current ? (
                <span className="t-caption rounded-full bg-secondary px-2.5 py-1">Current</span>
              ) : (
                <button
                  type="button"
                  onClick={() => revokeOne(s)}
                  disabled={busy === `session:${s.id}`}
                  className="t-ui inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" strokeWidth={2} />
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel flex flex-wrap items-start justify-between gap-4 p-7">
        <div className="max-w-[52ch]">
          <h2 className="t-heading">Export your data</h2>
          <p className="t-meta mt-2">
            Downloads a JSON file with your profile, sign-in methods, active sessions and full
            activity log. Credentials and tokens are never included.
          </p>
        </div>
        <button
          type="button"
          onClick={exportData}
          disabled={busy === "export"}
          className="btn-ink hover:opacity-90 disabled:opacity-60"
        >
          <Download className="h-4 w-4" strokeWidth={2} />
          Download my data
        </button>
      </section>


      <section className="panel p-7">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-accent" strokeWidth={2} />
          <h2 className="t-heading">Account activity</h2>
        </div>
        <p className="t-meta mt-2">
          Recent sign-ins, credential changes and password resets on this account.
        </p>
        {activity.length === 0 ? (
          <p className="t-caption mt-6">No activity recorded yet.</p>
        ) : (
          <ul className="mt-6 divide-y divide-border-row rounded-xl border border-border-row">
            {activity.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
                <div>
                  <p className="t-item">{EVENT_LABELS[a.event] ?? a.event}</p>
                  <p className="t-caption mt-0.5">
                    {[a.detail, a.device].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <span className="t-caption">{new Date(a.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel border-destructive/40 p-7">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" strokeWidth={2} />
          <h2 className="t-heading">Delete account</h2>
        </div>
        <p className="t-meta mt-2">
          This permanently removes your profile, activity log and every connected credential
          (email and Google). It cannot be undone.
        </p>
        <label htmlFor="confirm-delete" className="t-item mb-2 mt-5 block">
          Type DELETE to confirm
        </label>
        <input
          id="confirm-delete"
          value={confirmDelete}
          onChange={(e) => setConfirmDelete(e.target.value)}
          placeholder="DELETE"
          className="t-body h-11 w-full max-w-[280px] rounded-xl border border-border px-4 outline-none focus:border-destructive"
        />
        <button
          type="button"
          onClick={deleteAccount}
          disabled={confirmDelete !== "DELETE" || busy === "delete"}
          className="btn-ink mt-4 flex bg-destructive hover:opacity-90 disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
          Permanently delete my account
        </button>
      </section>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.6c-.1 1.1-.9 2.8-2.5 3.9l3.8 3c2.3-2.1 3.6-5.2 3.6-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-3c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.8-5l-4 3.1C3.2 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.2 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3l-4-3.1C.4 8.2 0 10 0 12s.4 3.8 1.2 5.4l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c2.3 0 3.8 1 4.7 1.8l3.4-3.3C18 1.2 15.2 0 12 0 7.3 0 3.2 2.7 1.2 6.6l4 3.1c1-2.9 3.6-4.9 6.8-4.9z" />
    </svg>
  );
}
