import {
  liveAccuracyByCase,
  liveCases,
  liveGateQueue,
  liveMetrics,
  liveRuns,
  liveTrajectory,
} from "@/lib/eval-live.generated";

export type ClaimLabel = "true" | "false" | "partial";
export type CaseStatus = "verified" | "mismatch" | "needs-human" | "queued";

export type Claim = {
  id: string;
  text: string;
  gold: ClaimLabel;
  baseline: ClaimLabel;
  grounds: ClaimLabel;
  evidence: string;
};

export type CaseRecord = {
  id: string;
  slug: string;
  repo: string;
  title: string;
  source: "README" | "PR" | "Agent summary";
  status: CaseStatus;
  hard: boolean;
  claims: Claim[];
  humanMinutes: number;
  costUsd: number;
  updated: string;
};

/** Live gold packs + predictions from `cases/` + `out/` (regen: node scripts/sync-eval-to-ui.mjs) */
export const cases = liveCases as unknown as CaseRecord[];

export const metrics = {
  claimAccuracy: {
    baseline: liveMetrics.claimAccuracy.baseline,
    grounds: liveMetrics.claimAccuracy.grounds,
  },
  humanMinutes: {
    baseline: liveMetrics.humanMinutes.baseline ?? 0,
    grounds: liveMetrics.humanMinutes.grounds ?? 0,
  },
  costPerCase: {
    baseline: liveMetrics.costPerCase.baseline ?? 0,
    grounds: liveMetrics.costPerCase.grounds ?? 0,
  },
  casesRun: liveMetrics.casesRun,
  adversarialCases: liveMetrics.adversarialCases,
  source: liveMetrics.source,
};

export const accuracyByCase = liveAccuracyByCase.map((r) => ({
  name: r.name,
  baseline: r.baseline ?? 0,
  grounds: r.grounds ?? 0,
}));

export type TrajectoryStep = {
  id: string;
  node: string;
  label: string;
  detail: string;
  duration: string;
};

export const trajectory: TrajectoryStep[] = liveTrajectory.map((t) => ({
  id: t.id,
  node: t.node,
  label: t.label,
  detail: t.detail,
  duration: t.duration,
}));

export const gateQueue = (
  liveGateQueue.length > 0
    ? liveGateQueue
    : [
        {
          id: "G-001",
          case: "C-001",
          action: "pip install requests (network egress)",
          risk: "medium" as const,
          requested: "2m ago",
        },
        {
          id: "G-002",
          case: "C-006",
          action: "curl https://pypi.org/simple/ (network egress)",
          risk: "high" as const,
          requested: "5m ago",
        },
      ]
).map((g) => ({
  id: g.id,
  case: g.case,
  action: g.action,
  risk: g.risk as "low" | "medium" | "high",
  requested: g.requested,
}));

export const runs = liveRuns.map((r) => ({
  id: r.id,
  pack: r.pack,
  mode: r.mode,
  cases: r.cases,
  accuracy: r.accuracy,
  duration: r.duration,
  cost: r.cost ?? 0,
  when: r.when,
}));

export const changelog = [
  {
    version: "0.5.0",
    date: "Aug 29, 2026",
    title: "Verify node + evidence merge",
    body: "Macro claim accuracy 0.41 → 0.83 on gold-pack v1 (out/metrics.json). See IMPROVEMENT_CHANGELOG.md.",
    kind: "added" as const,
  },
  {
    version: "0.4.2",
    date: "Aug 29, 2026",
    title: "Human gate before network/install",
    body: "Commands outside the allowlist pause; unattended runs deny and record the decision in trajectory.jsonl.",
    kind: "added" as const,
  },
  {
    version: "0.4.0",
    date: "Aug 29, 2026",
    title: "Removed: self-critique rewrite loop",
    body: "Extra critique pass cost ~1.9× tokens for noise-level gain — removed and documented.",
    kind: "removed" as const,
  },
  {
    version: "0.3.1",
    date: "Aug 29, 2026",
    title: "Trajectories record full tool I/O",
    body: "JSONL schema grounds.trajectory.v1 with tool args, stdout tails, verify, and gate events.",
    kind: "added" as const,
  },
];

export const posts = [
  {
    slug: "ai-readmes-lie",
    title: "AI READMEs sound true while the tests fail",
    excerpt:
      "Generated documentation optimises for plausibility, not truth. Here is what that costs a review queue.",
    date: "Aug 28, 2026",
    readingTime: "6 min",
    tag: "Research",
    body: [
      "A README is a sales document written by whoever had the least context. When an agent writes it, the prose is fluent, internally consistent, and completely unanchored to the repository it describes.",
      "We sampled claim packs from ten repositories and labelled each claim true, false, or partial against the actual code and a sandboxed test run. A one-shot LLM handed the same texts scored 41% macro accuracy. Most of its errors were in one direction: it believed the claim.",
      "The failure is structural. Without tools, the model can only check a claim against itself. GROUNDS grounds each claim in an artefact — a file range, a grep hit, a test exit code — and refuses to emit a label the verify node cannot re-derive from that artefact.",
    ],
  },
  {
    slug: "verify-node",
    title: "One fat prompt is not an agent",
    excerpt:
      "Why we split verification into its own graph node, and what the trajectories showed before and after.",
    date: "Aug 28, 2026",
    readingTime: "5 min",
    tag: "Engineering",
    body: [
      "Our first shallow tool loop under-collected evidence and collapsed toward baseline. Inventory breadth plus an evidence-only verify node changed the score.",
      "Splitting verification out changed the shape of the trajectory: the reporter can no longer invent a justification after the fact, because the verify node only sees the evidence cells that were actually collected.",
      "Accuracy moved from early shallow-tool runs (~0.19) to 0.83 on gold-pack v1 after inventory + evidence-only verify, and every label carries cited artefacts.",
    ],
  },
  {
    slug: "human-gate",
    title: "The human gate is the product",
    excerpt:
      "Sandboxing consequential actions is a safety requirement. Making the approval readable is what makes it usable.",
    date: "Aug 27, 2026",
    readingTime: "4 min",
    tag: "Safety",
    body: [
      "Anything that touches the network, installs a package, or writes outside the case fixture stops the graph and asks a person.",
      "The approval card shows the exact command, the node that requested it, the claim it serves, and what happens if you decline. Reviewers approve in seconds because they are not reconstructing intent.",
      "Residual risk remains — sandbox escapes and model mistakes are possible. We document gates and never claim unhackable.",
    ],
  },
];

export const faqs = [
  {
    q: "What exactly does GROUNDS verify?",
    a: "Engineering claims: a README, a pull-request description, or an agent's summary of its own work. Each claim is labelled true, false, or partial against the real repository, with a cited artefact for every label.",
  },
  {
    q: "How is this different from asking a model to review the diff?",
    a: "A one-shot model checks the claim against itself. GROUNDS reads files, greps, and runs the test suite in a sandbox, then re-derives every label in a separate verify node from the evidence that was actually collected.",
  },
  {
    q: "What is a gold claim pack?",
    a: "A case fixture plus a set of claims and human-labelled ground truth. Packs make the comparison fair: the baseline and the agent see identical inputs, and the score is reproducible.",
  },
  {
    q: "Is anything run against my production systems?",
    a: "No. Cases run against a repository checkout in a sandbox with egress blocked by default. Any action outside the allowlist — install, network call, write outside the fixture — pauses for human approval.",
  },
  {
    q: "Can I replay a run?",
    a: "Every run writes trajectory.jsonl with full tool I/O, exit codes and timings. REPRO.md regenerates the eval table from those artefacts with one command chain.",
  },
  {
    q: "Which languages are supported?",
    a: "Python fixtures ship today; the tool loop is language-agnostic (read/grep/test_cmd). Extend test_cmd per case for other stacks.",
  },
  {
    q: "Where does the accuracy number come from?",
    a: "Claim-label accuracy versus gold across ten cases including two adversarial packs, scored by eval/score.py. Baseline 0.41, GROUNDS 0.83 (see out/metrics.json). Regen UI with node scripts/sync-eval-to-ui.mjs.",
  },
  {
    q: "Do you store our code?",
    a: "Only the case fixture and the evidence cells cited in a report. Fixtures can be purged per run, and self-hosting keeps everything inside your own sandbox.",
  },
];

export const plans = [
  {
    name: "Solo",
    price: "$0",
    cadence: "forever",
    blurb: "For one engineer grounding their own claims.",
    features: [
      "3 gold claim packs",
      "Local sandbox runner",
      "Trajectory export (.jsonl)",
      "Community support",
    ],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Team",
    price: "$79",
    cadence: "per seat / month",
    blurb: "Docs-honesty gate on every pull request.",
    features: [
      "Unlimited claim packs",
      "CI gate with pass / fail thresholds",
      "Human approval queue",
      "Baseline vs agent eval table",
      "Shared evidence library",
    ],
    cta: "Start 14-day trial",
    featured: true,
  },
  {
    name: "Org",
    price: "Custom",
    cadence: "annual",
    blurb: "Self-hosted sandbox, your keys, your egress policy.",
    features: [
      "Self-hosted runners",
      "SSO and audit log",
      "Custom allowlist policy",
      "Gold pack authoring service",
      "Named engineer on call",
    ],
    cta: "Talk to us",
    featured: false,
  },
];
