import { createFileRoute, Link } from "@tanstack/react-router";
import { Terminal, FolderTree, ListChecks, Video } from "lucide-react";
import { PageShell, PageHeader } from "@/components/site/PageShell";

const title = "GROUNDS repro guide — run the eval end to end";
const description =
  "Clone, install, run the baseline and the agent over the same gold claim packs, and regenerate the scoring table from the recorded artefacts.";

export const Route = createFileRoute("/docs")({
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
  component: DocsPage,
});

const steps = [
  {
    icon: Terminal,
    title: "1 · Install",
    code: `git clone https://github.com/grounds-ai/grounds
cd grounds && uv sync
cp .env.example .env   # add your own model key`,
  },
  {
    icon: ListChecks,
    title: "2 · Run the baseline",
    code: `python baseline/run.py --pack gold-pack-v3
# → runs/R-0141/predictions.json`,
  },
  {
    icon: Terminal,
    title: "3 · Run the agent",
    code: `python agent/graph.py --pack gold-pack-v3 --sandbox strict
# → runs/R-0142/report.json
# → runs/R-0142/trajectory.jsonl`,
  },
  {
    icon: ListChecks,
    title: "4 · Score both",
    code: `python eval/score.py --runs R-0141 R-0142
# accuracy | human-min | cost per case`,
  },
];

function DocsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Docs"
        title="Reproduce every number on this site"
        sub="Identical packs, identical repositories, one scoring script. Nothing here depends on a screenshot."
      />

      <section className="mx-auto max-w-[1080px] px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          {steps.map((s) => (
            <article key={s.title} className="panel overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border-row px-6 py-4">
                <s.icon className="h-4.5 w-4.5 text-accent" strokeWidth={2} />
                <p className="t-item">{s.title}</p>
              </div>
              <pre className="t-mono overflow-x-auto bg-ink px-6 py-5 text-on-dark/90">
                {s.code}
              </pre>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary">
        <div className="mx-auto grid max-w-[1080px] gap-10 px-6 py-16 md:grid-cols-2">
          <div>
            <FolderTree className="h-6 w-6 text-accent" strokeWidth={1.9} />
            <h2 className="t-display-sm mt-5 max-w-[14ch]">Repository layout</h2>
            <p className="t-meta mt-4 max-w-[42ch]">
              Every case is a fixture plus claims plus gold labels. Runs write artefacts, never
              prose.
            </p>
          </div>
          <pre className="t-mono overflow-x-auto rounded-2xl bg-ink p-6 text-on-dark/90">
            {`cases/<id>/
  repo_fixture/
  claims.json
  gold.json
baseline/run.py      → predictions.json
agent/graph.py       → report.json + trajectory.jsonl
eval/score.py        → accuracy · human-min · cost
CHANGELOG.md · REPRO.md`}
          </pre>
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-border p-8">
          <div className="flex items-start gap-4">
            <Video className="mt-1 h-5 w-5 text-accent" strokeWidth={2} />
            <div>
              <p className="t-heading">Five-minute walkthrough</p>
              <p className="t-meta mt-2 max-w-[48ch]">
                Problem, baseline, GROUNDS, the table, and the one experiment we removed.
              </p>
            </div>
          </div>
          <Link to="/changelog" className="btn-ink hover:opacity-90">
            Read the changelog
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
