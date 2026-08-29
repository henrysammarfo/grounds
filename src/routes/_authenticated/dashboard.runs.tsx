import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Play, GitCompare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { runs } from "@/lib/grounds-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/runs")({
  component: RunsPage,
});

function RunsPage() {
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"agent" | "baseline">("agent");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t-display-sm">Runs</h1>
          <p className="t-meta mt-2">
            Baseline and agent execute the same packs so the comparison stays fair.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            toast.success(
              mode === "agent"
                ? "GROUNDS agent queued on gold-pack-v3"
                : "One-shot baseline queued on gold-pack-v3",
            );
            setTimeout(() => setBusy(false), 1600);
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
            <select className="t-body h-10 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-accent">
              <option>gold-pack-v3 (10 cases)</option>
              <option>gold-pack-v2 (8 cases)</option>
              <option>adversarial-v1 (2 cases)</option>
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

      <section className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border-row px-6 py-4">
          <GitCompare className="h-4 w-4 text-accent" strokeWidth={2} />
          <p className="t-item">Run history</p>
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
                  <td className="t-meta px-6 py-4">${r.cost.toFixed(2)}</td>
                  <td className="t-meta px-6 py-4">{r.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
