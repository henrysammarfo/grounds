import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { GroundsWordmark } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { cn } from "@/lib/utils";

const title = "Sign in or create your GROUNDS account";
const description =
  "Access your claim packs, runs, approval queue and evaluation table with a GROUNDS account.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: "/dashboard", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created — welcome to GROUNDS.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Try email instead.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 sm:px-16">
        <Link to="/" className="inline-flex w-fit rounded-full bg-ink px-4 py-2.5">
          <GroundsWordmark />
        </Link>
        <h1 className="t-display-sm anim-wipe mt-12 max-w-[14ch]">
          {mode === "signin" ? "Sign in to your evidence layer" : "Create your evidence layer"}
        </h1>
        <p className="t-meta mt-4 max-w-[42ch]">
          Claim packs, trajectories and the human gate live behind your account.
        </p>

        <div className="mt-8 inline-flex w-fit rounded-full bg-secondary p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "t-ui rounded-full px-4 py-2 transition-colors",
                mode === m ? "bg-ink text-on-dark" : "text-muted-foreground",
              )}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form className="mt-6 max-w-[420px] space-y-4" onSubmit={onSubmit}>
          {mode === "signup" && (
            <div>
              <label htmlFor="name" className="t-item mb-2 block">
                Display name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="t-body h-11 w-full rounded-xl border border-border px-4 outline-none focus:border-accent"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="t-item mb-2 block">
              Work email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="t-body h-11 w-full rounded-xl border border-border px-4 outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="password" className="t-item mb-2 block">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="t-body h-11 w-full rounded-xl border border-border px-4 outline-none focus:border-accent"
            />
          </div>
          <button type="submit" disabled={busy} className="btn-ink w-full hover:opacity-90 disabled:opacity-60">
            {mode === "signin" ? "Sign in" : "Create account"}
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={onGoogle}
            disabled={busy}
            className="btn-outline-ink w-full hover:bg-secondary disabled:opacity-60"
          >
            <GoogleGlyph />
            Continue with Google
          </button>
          <p className="t-caption flex items-center gap-1.5 pt-2">
            <Lock className="h-3.5 w-3.5" strokeWidth={2} />
            Sandboxed by default. We never store repository credentials.
          </p>
        </form>
      </div>

      <div className="band-accent relative hidden overflow-hidden lg:block">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_80%_at_20%_0%,rgba(255,255,255,0.5),transparent_60%)]" />
        <div className="relative flex h-full flex-col justify-center px-16">
          <p className="t-display-sm max-w-[16ch]">
            “The tests disagreed with the README. GROUNDS said so first.”
          </p>
          <p className="t-meta mt-6 text-accent-foreground">Staff engineer, payments platform</p>
        </div>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.6c-.1 1.1-.9 2.8-2.5 3.9l3.8 3c2.3-2.1 3.6-5.2 3.6-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-3c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.8-5l-4 3.1C3.2 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.2 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3l-4-3.1C.4 8.2 0 10 0 12s.4 3.8 1.2 5.4l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c2.3 0 3.8 1 4.7 1.8l3.4-3.3C18 1.2 15.2 0 12 0 7.3 0 3.2 2.7 1.2 6.6l4 3.1c1-2.9 3.6-4.9 6.8-4.9z" />
    </svg>
  );
}
