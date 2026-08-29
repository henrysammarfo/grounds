import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  FileCode2,
  FlaskConical,
  BadgeCheck,
  UserCheck,
  FileJson,
  ArrowRight,
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/site/PageShell";
import { VerdictCard } from "@/components/site/VerdictCard";

const title = "How GROUNDS works — tools, verify node, human gate";
const description =
  "Inside the GROUNDS graph: grep and read, sandboxed tests, an independent verify node, a human approval gate, and replayable trajectories.";

export const Route = createFileRoute("/product")({
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
  component: ProductPage,
});

const nodes = [
  {
    icon: Search,
    name: "Plan",
    body: "The claim pack is decomposed into one verification plan per claim, with the memory of prior finding IDs attached.",
  },
  {
    icon: FileCode2,
    name: "Read & grep",
    body: "Ripgrep over the fixture, then targeted file reads. Every hit becomes an evidence cell with a path and line range.",
  },
  {
    icon: FlaskConical,
    name: "Test",
    body: "The project's own runner executes in a sandbox with egress blocked. Exit codes and stdout land in the trajectory.",
  },
  {
    icon: BadgeCheck,
    name: "Verify",
    body: "A separate node re-derives every label from the collected evidence. A label without an artefact is not emitted.",
  },
  {
    icon: UserCheck,
    name: "Human gate",
    body: "Anything outside the allowlist pauses and asks a person, showing the exact command and the claim it serves.",
  },
  {
    icon: FileJson,
    name: "Report",
    body: "report.json plus trajectory.jsonl — labels, evidence, retries and timings, replayable end to end.",
  },
];

function ProductPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Product"
        title="A graph you can read, not a prompt you have to trust"
        sub="GROUNDS is a tool-using agent with an explicit verify step. Each node leaves an artefact, so the verdict is auditable rather than persuasive."
      >
        <Link to="/dashboard" className="btn-ink hover:opacity-90">
          Open the dashboard
          <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
        </Link>
      </PageHeader>

      <section className="band-accent relative mt-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,rgba(255,255,255,0.45),transparent_60%)]" />
        <div className="relative flex justify-center px-4 py-16">
          <VerdictCard />
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-6 py-16">
        <h2 className="t-display-sm max-w-[16ch]">Six nodes, one contract: cite or stay quiet</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {nodes.map((n, i) => (
            <article key={n.name} className="panel p-7">
              <div className="flex items-center justify-between">
                <n.icon className="h-6 w-6 text-accent" strokeWidth={1.9} />
                <span className="t-caption">0{i + 1}</span>
              </div>
              <h3 className="t-heading mt-5">{n.name}</h3>
              <p className="t-meta mt-3">{n.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary">
        <div className="mx-auto max-w-[1080px] px-6 py-16">
          <h2 className="t-display-sm max-w-[18ch]">What the trajectory looks like</h2>
          <pre className="t-mono mt-8 overflow-x-auto rounded-2xl bg-ink p-6 text-on-dark/90">
            {`{"node":"grep","cmd":"rg 'AKIA|BEGIN PRIVATE KEY' -n","hits":1,"ms":204}
{"node":"read","path":"fixtures/aws_sample.env","lines":"1-8","ms":312}
{"node":"test","cmd":"pytest -q","exit":1,"failed":2,"passed":118,"ms":42104}
{"node":"verify","claim":"CL-1","label":"false","evidence":["test:tests/test_settlement.py::test_rounding"]}
{"node":"gate","action":"pip install -e '.[dev]'","status":"approved","by":"reviewer","ms":41022}
{"node":"report","claims":3,"evidence_cells":5,"retries":1}`}
          </pre>
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="t-display-sm max-w-[14ch]">Safety is a graph property</h2>
            <p className="t-meta mt-4 max-w-[46ch]">
              Consequential actions are not a prompt instruction — they are an edge the graph
              cannot cross without an approval token.
            </p>
          </div>
          <ul className="panel divide-y divide-border-row">
            {[
              ["Egress", "Blocked by default inside the case sandbox"],
              ["Installs", "Allowlist only; anything else waits for a human"],
              ["Writes", "Confined to the case fixture directory"],
              ["Secrets", "Pattern-matched, never echoed into a report"],
            ].map(([k, v]) => (
              <li key={k} className="flex items-start justify-between gap-6 px-5 py-4">
                <span className="t-item">{k}</span>
                <span className="t-meta text-right">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PageShell>
  );
}
