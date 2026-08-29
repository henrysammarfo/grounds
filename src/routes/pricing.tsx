import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { PageShell, PageHeader } from "@/components/site/PageShell";
import { plans } from "@/lib/grounds-data";
import { cn } from "@/lib/utils";

const title = "GROUNDS pricing — a docs-honesty gate for every team size";
const description =
  "Free for solo engineers, per-seat for teams running a CI honesty gate, and self-hosted for organisations with their own sandbox policy.";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Pricing"
        title="Pay for verdicts, not for prose"
        sub="Every plan includes the verify node, the human gate and full trajectory export. Bigger plans add scale, control and where the sandbox runs."
      />

      <section className="mx-auto max-w-[1080px] px-6 pb-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <article
              key={p.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-8",
                p.featured
                  ? "border-transparent bg-ink text-on-dark"
                  : "border-border bg-background",
              )}
            >
              {p.featured && (
                <span className="t-caption absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-accent-foreground">
                  <Sparkles className="h-3 w-3" strokeWidth={2.4} />
                  Most adopted
                </span>
              )}
              <p className={cn("t-item", p.featured && "text-on-dark")}>{p.name}</p>
              <p
                className={cn(
                  "t-display-sm mt-4",
                  p.featured ? "text-on-dark" : "text-ink",
                )}
              >
                {p.price}
              </p>
              <p className={cn("t-caption mt-1", p.featured && "text-on-dark/60")}>
                {p.cadence}
              </p>
              <p className={cn("t-meta mt-4", p.featured && "text-on-dark/70")}>{p.blurb}</p>
              <ul className="mt-7 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.6} />
                    <span className={cn("t-meta", p.featured && "text-on-dark/80")}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/dashboard"
                className={cn("mt-8", p.featured ? "btn-light" : "btn-ink hover:opacity-90")}
              >
                {p.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary">
        <div className="mx-auto max-w-[1080px] px-6 py-16">
          <h2 className="t-display-sm max-w-[16ch]">What counts as a case?</h2>
          <p className="t-meta mt-4 max-w-[52ch]">
            One claim pack run against one repository fixture, including every tool call, test
            execution and the report. Retries inside a run are free; a re-run after a code change
            is a new case.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              ["Typical PR pack", "2–5 claims", "~$0.18 in model spend"],
              ["README pack", "3–8 claims", "~$0.24 in model spend"],
              ["Adversarial pack", "2–4 claims", "~$0.38 in model spend"],
            ].map(([a, b, c]) => (
              <div key={a} className="panel p-6">
                <p className="t-item">{a}</p>
                <p className="t-meta mt-2">{b}</p>
                <p className="t-caption mt-1">{c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-border p-8">
          <div>
            <p className="t-heading">Not sure which plan fits?</p>
            <p className="t-meta mt-2">
              Send us a repository and a claim you doubt. We will run it and show the trajectory.
            </p>
          </div>
          <Link to="/contact" className="btn-ink hover:opacity-90">
            Talk to us
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
