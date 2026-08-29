import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Github, Lock } from "lucide-react";
import { GroundsWordmark } from "@/components/brand/Logo";

const title = "Sign in to GROUNDS";
const description = "Access your claim packs, runs, approval queue and evaluation table.";

export const Route = createFileRoute("/signin")({
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
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 sm:px-16">
        <Link to="/" className="inline-flex w-fit rounded-full bg-ink px-4 py-2.5">
          <GroundsWordmark />
        </Link>
        <h1 className="t-display-sm anim-wipe mt-12 max-w-[14ch]">
          Sign in to your evidence layer
        </h1>
        <p className="t-meta mt-4 max-w-[42ch]">
          This demo signs you straight into the dashboard — no account needed.
        </p>

        <form
          className="mt-10 max-w-[420px] space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/dashboard" });
          }}
        >
          <div>
            <label htmlFor="email" className="t-item mb-2 block">
              Work email
            </label>
            <input
              id="email"
              type="email"
              required
              defaultValue="reviewer@acme.dev"
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
              defaultValue="grounded"
              className="t-body h-11 w-full rounded-xl border border-border px-4 outline-none focus:border-accent"
            />
          </div>
          <button type="submit" className="btn-ink w-full hover:opacity-90">
            Continue
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </button>
          <button type="button" className="btn-outline-ink w-full hover:bg-secondary">
            <Github className="h-4 w-4" strokeWidth={2} />
            Continue with GitHub
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
          <p className="t-meta mt-6 text-accent-foreground">
            Staff engineer, payments platform
          </p>
        </div>
      </div>
    </div>
  );
}
