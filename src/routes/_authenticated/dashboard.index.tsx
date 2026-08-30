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
} from "lucide-react";
import { cases, metrics, gateQueue, runs } from "@/lib/grounds-data";
import { StatusPill } from "@/components/dash/StatusPill";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Overview,
});

const kpis = [
  {
    icon: Target,
    label: "Claim accuracy",
    value: `${Math.round(metrics.claimAccuracy.grounds * 100)}%`,
    delta: `+${Math.round((metrics.claimAccuracy.grounds - metrics.claimAccuracy.baseline) * 100)} pts vs baseline`,
  },
  {
    icon: Timer,
    label: "Human minutes / case",
    value: `${metrics.humanMinutes.grounds}`,
    delta: `down from ${metrics.humanMinutes.baseline}`,
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
    delta: "oldest 1 hr ago",
  },
];

function Overview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="t-display-sm">Overview</h1>
        <p className="t-meta mt-2">
          gold-pack-v1 · synced from out/metrics.json · sandbox strict
        </p>
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
            <p className="t-item">Recent claim packs</p>
            <Link
              to="/dashboard/cases"
              className="t-caption inline-flex items-center gap-1 hover:text-ink"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
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
        </section>

        <section className="panel">
          <div className="flex items-center justify-between border-b border-border-row px-6 py-4">
            <p className="t-item">Approval queue</p>
            <Link
              to="/dashboard/gate"
              className="t-caption inline-flex items-center gap-1 hover:text-ink"
            >
              Open gate <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="divide-y divide-border-row">
            {gateQueue.map((g) => (
              <li key={g.id} className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {g.risk === "high" ? (
                    <CircleAlert className="h-4 w-4 text-destructive" strokeWidth={2} />
                  ) : g.risk === "medium" ? (
                    <CircleDashed className="h-4 w-4 text-warning" strokeWidth={2} />
                  ) : (
                    <CircleCheck className="h-4 w-4 text-success" strokeWidth={2} />
                  )}
                  <p className="t-item">{g.id}</p>
                  <p className="t-caption ml-auto">{g.requested}</p>
                </div>
                <p className="t-meta mt-2">{g.action}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <div className="border-b border-border-row px-6 py-4">
          <p className="t-item">Latest runs</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border-row">
                {["Run", "Pack", "Mode", "Cases", "Accuracy", "Duration", "When"].map((h) => (
                  <th key={h} className="t-caption px-6 py-3 text-left font-normal">
                    {h}
                  </th>
                ))}
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
