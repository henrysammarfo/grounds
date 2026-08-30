import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Braces, Copy } from "lucide-react";
import { toast } from "sonner";
import { TrajectoryList } from "@/components/dash/TrajectoryList";
import { useWorkspace } from "@/lib/workspace-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/trajectories")({
  component: TrajectoriesPage,
});

function TrajectoriesPage() {
  const { cases, trajectory, workspace } = useWorkspace();
  const [active, setActive] = useState(cases[0]?.id ?? "");

  useEffect(() => {
    if (!active && cases[0]) setActive(cases[0].id);
    if (active && !cases.some((c) => c.id === active) && cases[0]) {
      setActive(cases[0].id);
    }
  }, [cases, active]);

  const jsonl = useMemo(
    () =>
      trajectory
        .map((s) =>
          JSON.stringify({ step: s.id, node: s.node, action: s.label, result: s.detail }),
        )
        .join("\n"),
    [trajectory],
  );

  if (!cases.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="t-display-sm">Trajectory inspector</h1>
          <p className="t-meta mt-2">{workspace.workspaceName} has no packs yet.</p>
        </div>
        <div className="panel p-10 text-center">
          <p className="t-item">Nothing to replay</p>
          <Link to="/dashboard/cases" className="btn-ink mt-6 hover:opacity-90">
            Create a claim pack
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="t-display-sm">Trajectory inspector</h1>
        <p className="t-meta mt-2">
          Tool I/O for {workspace.workspaceName}. Other accounts cannot open these traces.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="panel h-fit p-2">
          {cases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(c.id)}
              className={cn(
                "t-item block w-full rounded-xl px-3.5 py-2.5 text-left transition-colors",
                active === c.id ? "bg-ink text-on-dark" : "hover:bg-secondary",
              )}
            >
              {c.id}
              <span className="t-caption block truncate opacity-70">{c.repo}</span>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <p className="t-item mb-5">
              {active} · {trajectory.length} steps · tenant-private
            </p>
            <TrajectoryList steps={trajectory} />
          </div>

          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-row px-6 py-4">
              <span className="t-item inline-flex items-center gap-2">
                <Braces className="h-4 w-4 text-accent" strokeWidth={2} />
                trajectory.jsonl
              </span>
              <button
                type="button"
                className="t-caption inline-flex items-center gap-1.5 hover:text-ink"
                onClick={() => {
                  navigator.clipboard?.writeText(jsonl);
                  toast.success("Copied trajectory.jsonl");
                }}
              >
                <Copy className="h-3.5 w-3.5" strokeWidth={2.2} />
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto bg-ink px-6 py-5 font-mono text-[12px] leading-6 text-on-dark">
              {jsonl || "// run a pack to emit trajectory steps"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
