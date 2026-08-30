import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings2, KeyRound, Users, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  component: SettingsPage,
});

const toggles = [
  {
    key: "gate",
    label: "Require human gate for non-allowlisted actions",
    detail: "Installs, network calls and destructive commands pause for review.",
    on: true,
  },
  {
    key: "egress",
    label: "Block sandbox network egress",
    detail: "Runs execute offline; only pre-fetched dependencies are available.",
    on: true,
  },
  {
    key: "baseline",
    label: "Always run the one-shot baseline alongside the agent",
    detail: "Keeps every accuracy claim comparable to a control.",
    on: true,
  },
  {
    key: "redact",
    label: "Redact secret-shaped strings in trajectories",
    detail: "Matched patterns are replaced before anything is stored.",
    on: false,
  },
];

function SettingsPage() {
  const storageKey = "grounds.settings.policy";
  const [state, setState] = useState(() => {
    const defaults = Object.fromEntries(toggles.map((t) => [t.key, t.on])) as Record<
      string,
      boolean
    >;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return defaults;
      return { ...defaults, ...(JSON.parse(raw) as Record<string, boolean>) };
    } catch {
      return defaults;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="t-display-sm">Settings</h1>
        <p className="t-meta mt-2">Workspace policy for runs, evidence and access.</p>
      </div>

      <section className="panel p-6">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-accent" strokeWidth={2} />
          <p className="t-item">Run policy</p>
        </div>
        <ul className="mt-5 divide-y divide-border-row">
          {toggles.map((t) => (
            <li key={t.key} className="flex items-start gap-6 py-4">
              <div className="flex-1">
                <p className="t-item">{t.label}</p>
                <p className="t-caption mt-1">{t.detail}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={state[t.key]}
                aria-label={t.label}
                onClick={() => {
                  setState((s) => {
                    const next = { ...s, [t.key]: !s[t.key] };
                    try {
                      localStorage.setItem(storageKey, JSON.stringify(next));
                    } catch {
                      /* ignore quota */
                    }
                    return next;
                  });
                  toast.success("Policy saved in this browser");
                }}
                className={cn(
                  "mt-1 h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors",
                  state[t.key] ? "bg-accent" : "bg-secondary",
                )}
              >
                <span
                  className={cn(
                    "block h-5 w-5 rounded-full bg-background shadow-sm transition-transform",
                    state[t.key] && "translate-x-5",
                  )}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="panel p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-accent" strokeWidth={2} />
            <p className="t-item">API key</p>
          </div>
          <p className="t-meta mt-3">Used by the CLI to submit claim packs.</p>
          <code className="mt-4 block truncate rounded-xl bg-ink px-4 py-3 font-mono text-[12px] text-on-dark">
            Use OPENAI_API_KEY in .env — never paste keys into the UI
          </code>
          <button
            type="button"
            className="btn-outline-ink mt-4 hover:bg-secondary"
            onClick={() =>
              toast.message("Rotate keys in your provider console, then update .env locally")
            }
          >
            Key hygiene tip
          </button>
        </section>

        <section className="panel p-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" strokeWidth={2} />
            <p className="t-item">Access</p>
          </div>
          <p className="t-meta mt-3">
            Contest / solo mode: one operator, one workspace. Shared orgs and seat-based
            multi-tenant review are not required for micro1 and are not shipped yet.
          </p>
          <ul className="mt-4 space-y-3">
            <li className="flex items-center justify-between">
              <span className="t-item">You (operator)</span>
              <span className="t-caption rounded-full bg-secondary px-2.5 py-1">Owner</span>
            </li>
          </ul>
          <button
            type="button"
            className="btn-outline-ink mt-5 hover:bg-secondary"
            onClick={() =>
              toast.message("Team invites / multi-tenant workspaces — post-contest roadmap")
            }
          >
            Invite later
          </button>
        </section>
      </div>

      <section className="panel flex flex-wrap items-start gap-4 p-6">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={2} />
        <p className="t-body max-w-[70ch]">
          Trajectories are retained for 90 days and never used for model training. Sandboxes are
          destroyed after each run.
        </p>
      </section>
    </div>
  );
}
