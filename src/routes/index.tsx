import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  FileSearch,
  TerminalSquare,
  ShieldCheck,
  GitPullRequest,
  Gauge,
  ScrollText,
} from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { VerdictCard } from "@/components/site/VerdictCard";
import { metrics } from "@/lib/grounds-data";

const title = "GROUNDS — Verify engineering claims against the real repository";
const description =
  "GROUNDS grounds every README, PR and agent claim in repo evidence and sandboxed tests, beating a one-shot LLM baseline on gold claim packs.";

export const Route = createFileRoute("/")({
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
  component: Home,
});

const pillars = [
  {
    icon: FileSearch,
    title: "Read the repo, not the prose",
    body: "The agent greps, opens file ranges and cites line numbers. Every label carries an artefact a reviewer can open.",
  },
  {
    icon: TerminalSquare,
    title: "Run the tests in a sandbox",
    body: "The project's own runner, egress blocked, exit codes recorded. Claims about passing suites are settled by the suite.",
  },
  {
    icon: ShieldCheck,
    title: "Stop before consequential actions",
    body: "Installs, network calls and writes outside the fixture pause the graph and surface an approval card.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <section className="relative">
        <div className="mx-auto max-w-[1080px] px-6 pb-[60px] pt-[150px] text-center sm:pt-[200px]">
          <h1 className="t-display anim-wipe mx-auto max-w-[16ch]">
            Verify engineering claims against the real repository
          </h1>
          <p className="t-body anim-rise mx-auto mt-6 max-w-[54ch] text-muted-foreground">
            READMEs, pull requests and agent summaries sound true while the tests fail.
            GROUNDS grounds every claim in evidence — then proves the gain against a one-shot
            baseline.
          </p>
          <div className="anim-rise mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link to="/dashboard" className="btn-ink hover:opacity-90">
              Get started
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
            <Link to="/product" className="btn-outline-ink hover:bg-secondary">
              See how it works
            </Link>
          </div>
        </div>

        {/* Full-bleed accent band with the product mockup sitting on it */}
        <div className="band-accent relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,rgba(255,255,255,0.45),transparent_60%)]" />
          <div className="relative flex justify-center px-4 pb-16 pt-[76px]">
            <VerdictCard />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1080px] gap-px overflow-hidden rounded-2xl border border-border bg-border px-0 py-0 sm:grid-cols-3 sm:my-20 my-14 mx-6">
        {[
          [
            "Claim accuracy",
            `${Math.round(metrics.claimAccuracy.grounds * 100)}%`,
            `vs ${Math.round(metrics.claimAccuracy.baseline * 100)}% one-shot baseline`,
          ],
          [
            "Cost USD / case",
            `$${metrics.costPerCase.grounds.toFixed(4)}`,
            `baseline $${metrics.costPerCase.baseline.toFixed(4)}`,
          ],
          ["Gold cases", `${metrics.casesRun}`, `${metrics.adversarialCases} adversarial`],
        ].map(([label, value, sub]) => (
          <div key={label} className="bg-background px-8 py-10">
            <p className="t-caption">{label}</p>
            <p className="t-display-sm mt-2">{value}</p>
            <p className="t-meta mt-1">{sub}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-[1080px] px-6 py-16">
        <h2 className="t-display-sm max-w-[16ch]">
          A tool-using agent, a verify node, and a human gate
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {pillars.map((p) => (
            <article key={p.title} className="panel p-7">
              <p.icon className="h-6 w-6 text-accent" strokeWidth={1.9} />
              <h3 className="t-heading mt-5">{p.title}</h3>
              <p className="t-meta mt-3">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary">
        <div className="mx-auto grid max-w-[1080px] gap-10 px-6 py-16 md:grid-cols-2">
          <div>
            <h2 className="t-display-sm max-w-[14ch]">Baseline with makeup, or an agent?</h2>
            <p className="t-meta mt-4 max-w-[46ch]">
              Same claim packs, same repositories, same scoring script. The only thing that
              changes is whether the system can look.
            </p>
            <Link to="/docs" className="btn-ink mt-7 hover:opacity-90">
              Read the repro guide
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </div>
          <div className="panel divide-y divide-border-row">
            {[
              ["Method", "One-shot LLM on dumped text", "Tools · verify node · memory · gate"],
              ["Claim accuracy", "0.41", "0.83"],
              ["Evidence cells", "0", "5.4 per case"],
              ["Replayable trajectory", "No", "trajectory.jsonl"],
            ].map(([k, a, b]) => (
              <div key={k} className="grid grid-cols-[1.1fr_1fr_1fr] gap-3 px-5 py-4">
                <span className="t-caption">{k}</span>
                <span className="t-meta">{a}</span>
                <span className="t-item text-accent-foreground">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: GitPullRequest, t: "CI gate", d: "Fail a pull request when a claim contradicts the repo." },
            { icon: Gauge, t: "Measured", d: "Accuracy, human minutes and cost per case, every run." },
            { icon: ScrollText, t: "Reproducible", d: "One command regenerates the table from artefacts." },
          ].map((i) => (
            <div key={i.t} className="flex items-start gap-4">
              <i.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={2} />
              <div>
                <p className="t-item">{i.t}</p>
                <p className="t-meta mt-1.5">{i.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-[1080px] px-6">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-8 py-16 text-center sm:px-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
          <h2 className="t-display-sm relative text-on-dark">
            Put a honesty gate in front of merge
          </h2>
          <p className="t-body relative mx-auto mt-4 max-w-[46ch] text-on-dark/70">
            Ten gold packs, a fair baseline, and trajectories your reviewers can replay.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/dashboard" className="btn-light">
              Open dashboard
            </Link>
            <Link
              to="/pricing"
              className="btn-outline-ink border-on-dark/25 bg-transparent text-on-dark"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
