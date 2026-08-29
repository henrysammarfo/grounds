import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { GroundsWordmark } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { setRememberMe } from "@/lib/auth-session";

const title = "Choose a new GROUNDS password";
const description = "Set a new password to recover access to your GROUNDS workspace.";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const isRecovery = hash.includes("type=recovery");

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (isRecovery && session)) setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setRememberMe(true);
      toast.success("Password updated — you're signed in.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-16 sm:px-16">
      <div className="mx-auto w-full max-w-[420px]">
        <Link to="/" className="inline-flex w-fit rounded-full bg-ink px-4 py-2.5">
          <GroundsWordmark />
        </Link>
        <h1 className="t-display-sm anim-wipe mt-10 max-w-[14ch]">Set a new password</h1>

        {!ready ? (
          <div className="panel mt-8 p-6">
            <KeyRound className="h-6 w-6 text-accent" strokeWidth={1.9} />
            <p className="t-item mt-4">Waiting for your recovery link</p>
            <p className="t-meta mt-2">
              Open this page from the reset email we sent you. If the link expired, request a new
              one from the sign-in page.
            </p>
            <Link to="/auth" className="btn-outline-ink mt-6 w-full hover:bg-secondary">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <label htmlFor="new-password" className="t-item mb-2 block">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="t-body h-11 w-full rounded-xl border border-border px-4 outline-none focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="t-item mb-2 block">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="t-body h-11 w-full rounded-xl border border-border px-4 outline-none focus:border-accent"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="btn-ink w-full hover:opacity-90 disabled:opacity-60"
            >
              Update password
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
