import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Timer, DollarSign, ShieldCheck } from "lucide-react";
import { metrics, accuracyByCase } from "@/lib/grounds-data";

export const Route = createFileRoute("/_authenticated/dashboard/evaluation")({
  component: EvaluationPage,
});

const pct = (n: number) => `${Math.round(n * 100)}%`;

function EvaluationPage() {
  const kpis = [
    {
      icon: TrendingUp,
      label: "Claim accuracy",
      baseline: pct(metrics.claimAccuracy.baseline),
      grounds: pct(metrics.claimAccuracy.grounds),
      delta: `+${Math.round((metrics.claimAccuracy.grounds - metrics.claimAccuracy.baseline) * 100)} pts`,
      good: true,
    },
    {
      icon: Timer,
      label: "Human minutes / case",
      baseline: `${metrics.humanMinutes.baseline}m`,
      grounds: `${metrics.humanMinutes.grounds}m`,
      delta: `-${(metrics.humanMinutes.baseline - metrics.humanMinutes.grounds).toFixed(1)}m`,
      good: true,
    },
    {
      icon: DollarSign,
      label: "Cost / case",
      baseline: `$${metrics.costPerCase.baseline.toFixed(4)}`,
      grounds: `$${metrics.costPerCase.grounds.toFixed(4)}`,
      delta: `+$${(metrics.costPerCase.grounds - metrics.costPerCase.baseline).toFixed(4)}`,
      good: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="t-display-sm">Evaluation</h1>
        <p className="t-meta mt-2">
          {metrics.casesRun} cases · gold labels frozen before any run ·{" "}
          {metrics.adversarialCases} adversarial cases included.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="panel p-6">
            <div className="flex items-center gap-2">
              <k.icon className="h-4 w-4 text-accent" strokeWidth={2.2} />
              <p className="t-caption">{k.label}</p>
            </div>
            <p className="t-display-sm mt-4">{k.grounds}</p>
            <p className="t-caption mt-2">
              baseline {k.baseline} ·{" "}
              <span className={k.good ? "text-success" : "text-warning"}>{k.delta}</span>
            </p>
          </div>
        ))}
      </div>

      <section className="panel p-6">
        <p className="t-item">Per-case claim accuracy</p>
        <p className="t-caption mt-1">Baseline (grey) vs GROUNDS (cyan)</p>
        <div className="mt-6 space-y-4">
          {accuracyByCase.map((c) => (
            <div key={c.name} className="flex items-center gap-4">
              <span className="t-caption w-14 shrink-0">{c.name}</span>
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-muted-foreground/50"
                    style={{ width: `${c.baseline}%` }}
                  />
                </div>
                <div className="h-2.5 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${c.grounds}%` }}
                  />
                </div>
              </div>
              <span className="t-caption w-24 shrink-0 text-right">
                {c.baseline}% → {c.grounds}%
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel flex flex-wrap items-start gap-4 p-6">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={2} />
        <div className="max-w-[70ch]">
          <p className="t-item">Honest reading</p>
          <p className="t-body mt-2">
            GROUNDS is roughly 3.5× more expensive per case and slower end-to-end. The trade is
            fewer wrong labels and less reviewer time. On C-010 the agent regressed against the
            baseline — that case stays in the pack rather than being quietly dropped.
          </p>
        </div>
      </section>
    </div>
  );
}
