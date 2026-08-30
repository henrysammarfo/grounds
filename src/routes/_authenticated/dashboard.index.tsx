import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CircleCheck,
  CircleAlert,
  CircleDashed,
  UserCheck,
  Timer,
  Coins,
  Target,
  Plus,
} from "lucide-react";
import { StatusPill } from "@/components/dash/StatusPill";
import { useWorkspace } from "@/lib/workspace-context";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Overview,
});

function Overview() {
  const { cases, metrics, gateQueue, runs, workspace } = useWorkspace();

  const kpis = [
    {
      icon: Target,
      label: "Claim accuracy",
      value: metrics.casesRun
        ? `${Math.round(metrics.claimAccuracy.grounds * 100)}%`
        : "—",
      delta: metrics.casesRun
        ? `+${Math.round((metrics.claimAccuracy.grounds - metrics.claimAccuracy.baseline) * 100)} pts vs baseline`
        : "Run a pack to score",
    },
    {
      icon: Timer,
      label: "Human minutes / case",
      value: `${metrics.humanMinutes.grounds.toFixed(1)}`,
      delta: `baseline ${metrics.humanMinutes.baseline.toFixed(1)}`,
    },
    {
      icon: Coins,
      label: "Cost / case",
      value: `$${metrics.costPerCase.grounds.toFixed(4)}`,
      delta: `baseline $${metrics.costPerCase.baseline.toFixed(4)}`,
    },
    {
      icon: UserCheck,
      label: "Awaiting approval",
      value: `${gateQueue.length}`,
      delta: gateQueue.length ? "open the human gate" : "queue clear",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t-display-sm">Overview</h1>
          <p className="t-meta mt-2">
            {workspace.workspaceName} · {metrics.source} · sandbox strict
          </p>
        </div>
        <Link to="/dashboard/cases" className="btn-ink hover:opacity-90">
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          New claim pack
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="panel p-6">
            <div className="flex items-center justify-between">
              <p className="t-caption">{k.label}</p>
              <k.icon className="h-4 w-4 text-accent" strokeWidth={2} />
            </div>
            <p className="t-display-sm mt-3">{k.value}</p>
            <p className="t-caption mt-1">{k.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="panel">
          <div className="flex items-center justify-between border-b border-border-row px-6 py-4">
            <p className="t-item">Your claim packs</p>
            <Link
              to="/dashboard/cases"
              className="t-caption inline-flex items-center gap-1 hover:text-ink"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {cases.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="t-item">Empty workspace</p>
              <p className="t-caption mt-2">
                New accounts start blank on purpose — create a pack to begin.
              </p>
              <Link to="/dashboard/cases" className="btn-ink mt-6 hover:opacity-90">
                Create your first pack
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border-row">
              {cases.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link
                    to="/dashboard/cases/$caseId"
                    params={{ caseId: c.slug }}
                    className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-secondary"
                  >
                    <div className="min-w-0">
                      <p className="t-item truncate">{c.title}</p>
                      <p className="t-caption mt-1">
                        {c.id} · {c.repo} · {c.source}
                      </p>
                    </div>
                    <StatusPill status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="border-b border-border-row px-6 py-4">
            <p className="t-item">Recent runs</p>
          </div>
          {runs.length === 0 ? (
            <p className="t-meta px-6 py-10 text-center">No runs yet in this tenant.</p>
          ) : (
            <ul className="divide-y divide-border-row">
              {runs.slice(0, 5).map((r) => (
                <li key={r.id} className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {r.mode.includes("GROUNDS") ? (
                      <CircleCheck className="h-4 w-4 text-success" strokeWidth={2} />
                    ) : r.accuracy < 0.5 ? (
                      <CircleAlert className="h-4 w-4 text-warning" strokeWidth={2} />
                    ) : (
                      <CircleDashed className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                    )}
                    <p className="t-item truncate">{r.pack}</p>
                  </div>
                  <p className="t-caption mt-1">
                    {r.mode} · {Math.round(r.accuracy * 100)}% · {r.when}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
