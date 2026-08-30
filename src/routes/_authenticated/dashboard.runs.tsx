import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Play, GitCompare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/workspace-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/runs")({
  component: RunsPage,
});

function RunsPage() {
  const { cases, runs, runPack, workspace } = useWorkspace();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"agent" | "baseline">("agent");
  const [packId, setPackId] = useState(cases[0]?.id || "");

  const selected = cases.find((c) => c.id === packId) || cases[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t-display-sm">Runs</h1>
          <p className="t-meta mt-2">
            Baseline and agent execute packs in{" "}
            <strong className="font-medium text-ink">{workspace.workspaceName}</strong> only.
          </p>
        </div>
        <button
          type="button"
          disabled={busy || !selected}
          onClick={() => {
            if (!selected) {
              toast.error("Create a claim pack first");
              return;
            }
            setBusy(true);
            runPack(selected.id, mode);
            toast.success(
              mode === "agent"
                ? `GROUNDS agent finished on ${selected.id}`
                : `Baseline finished on ${selected.id}`,
            );
            setTimeout(() => setBusy(false), 900);
          }}
          className="btn-ink hover:opacity-90 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
          ) : (
            <Play className="h-4 w-4" strokeWidth={2.2} />
          )}
          Start run
        </button>
      </div>

      {!cases.length ? (
        <div className="panel p-10 text-center">
          <p className="t-item">No packs to run</p>
          <p className="t-caption mt-2">Create a claim pack in your workspace first.</p>
          <Link to="/dashboard/cases" className="btn-ink mt-6 hover:opacity-90">
            Go to claim packs
          </Link>
        </div>
      ) : (
        <div className="panel p-6">
          <p className="t-item">Run configuration</p>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <div>
              <p className="t-caption mb-2">Mode</p>
              <div className="flex gap-2">
                {(["agent", "baseline"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "t-caption rounded-full px-3.5 py-2 capitalize transition-colors",
                      mode === m
                        ? "bg-ink text-on-dark"
                        : "bg-secondary text-muted-foreground hover:text-ink",
                    )}
                  >
                    {m === "agent" ? "GROUNDS agent" : "One-shot baseline"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="t-caption mb-2">Pack</p>
              <select
                className="t-body h-10 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-accent"
                value={selected?.id}
                onChange={(e) => setPackId(e.target.value)}
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="t-caption mb-2">Sandbox</p>
              <select className="t-body h-10 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-accent">
                <option>strict — egress blocked, allowlist installs</option>
                <option>standard — egress blocked</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <section className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border-row px-6 py-4">
          <GitCompare className="h-4 w-4 text-accent" strokeWidth={2} />
          <p className="t-item">Run history (this tenant)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-border-row">
                {["Run", "Pack", "Mode", "Cases", "Accuracy", "Duration", "Cost", "When"].map(
                  (h) => (
                    <th key={h} className="t-caption px-6 py-3 text-left font-normal">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-row">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-secondary">
                  <td className="t-item px-6 py-4">{r.id}</td>
                  <td className="t-meta px-6 py-4">{r.pack}</td>
                  <td className="t-meta px-6 py-4">{r.mode}</td>
                  <td className="t-meta px-6 py-4">{r.cases}</td>
                  <td className="t-item px-6 py-4">{Math.round(r.accuracy * 100)}%</td>
                  <td className="t-meta px-6 py-4">{r.duration}</td>
                  <td className="t-meta px-6 py-4">
                    ${r.cost < 0.01 ? r.cost.toFixed(4) : r.cost.toFixed(2)}
                  </td>
                  <td className="t-meta px-6 py-4">{r.when}</td>
                </tr>
              ))}
              {!runs.length && (
                <tr>
                  <td className="t-meta px-6 py-10 text-center" colSpan={8}>
                    No runs yet — start one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
