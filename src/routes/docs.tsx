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
    code: `cd grounds
python -m pip install -e ".[dev]"
# OPENAI_API_KEY in .env or ../scoutbot/agent/.env`,
  },
  {
    icon: ListChecks,
    title: "2 · Run the baseline",
    code: `python baseline/run.py --all --mode llm
# → out/baseline/<case>/predictions.json
# → out/baseline/<case>/trajectory.jsonl`,
  },
  {
    icon: Terminal,
    title: "3 · Run the agent",
    code: `python agent/run.py --all
# → out/agent/<case>/report.json
# → out/agent/<case>/trajectory.jsonl`,
  },
  {
    icon: ListChecks,
    title: "4 · Score + sync UI",
    code: `python eval/score.py
node scripts/sync-eval-to-ui.mjs
# → out/metrics.json · out/EVAL_TABLE.md`,
  },
];

function DocsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Docs"
        title="Reproduce every number on this site"
        sub="Identical packs, identical repositories, one scoring script. Canonical steps live in REPRO.md."
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
            <h2 className="t-heading mt-4">Layout</h2>
            <pre className="t-mono mt-4 overflow-x-auto rounded-xl bg-ink p-5 text-on-dark/90">{`cases/C-00N/{meta,claims,gold}.json + repo/
baseline/run.py
agent/run.py
eval/score.py
out/   # generated artefacts
REPRO.md
IMPROVEMENT_CHANGELOG.md`}</pre>
          </div>
          <div>
            <Video className="h-6 w-6 text-accent" strokeWidth={1.9} />
            <h2 className="t-heading mt-4">Video + changelog</h2>
            <p className="t-body mt-3 text-muted-foreground">
              Shoot from <code className="t-mono">VIDEO_SCRIPT.md</code>. Contest changelog is{" "}
              <code className="t-mono">IMPROVEMENT_CHANGELOG.md</code> — not the marketing route alone.
            </p>
            <Link to="/changelog" className="t-item mt-6 inline-flex text-accent hover:underline">
              Product changelog →
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
