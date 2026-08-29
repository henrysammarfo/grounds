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

export const cases: CaseRecord[] = [
  {
    id: "C-001",
    slug: "ledger-core-readme",
    repo: "acme/ledger-core",
    title: "All tests pass and no secrets are committed",
    source: "README",
    status: "mismatch",
    hard: false,
    humanMinutes: 3,
    costUsd: 0.14,
    updated: "Today at 10:30 a.m.",
    claims: [
      {
        id: "CL-1",
        text: "The full test suite passes on a clean checkout.",
        gold: "false",
        baseline: "true",
        grounds: "false",
        evidence: "pytest -q → 2 failed in tests/test_settlement.py::test_rounding",
      },
      {
        id: "CL-2",
        text: "No credentials are stored in the repository.",
        gold: "partial",
        baseline: "true",
        grounds: "partial",
        evidence: "rg 'AKIA' → fixtures/aws_sample.env:3 (test fixture, not live)",
      },
      {
        id: "CL-3",
        text: "Python 3.11 is supported.",
        gold: "true",
        baseline: "true",
        grounds: "true",
        evidence: "pyproject.toml requires-python = '>=3.10'; CI matrix includes 3.11",
      },
    ],
  },
  {
    id: "C-002",
    slug: "vector-index-pr",
    repo: "acme/vector-index",
    title: "PR #482 — 'zero breaking changes to the public API'",
    source: "PR",
    status: "verified",
    hard: false,
    humanMinutes: 2,
    costUsd: 0.11,
    updated: "Today at 09:12 a.m.",
    claims: [
      {
        id: "CL-1",
        text: "No public symbol was removed or renamed.",
        gold: "true",
        baseline: "partial",
        grounds: "true",
        evidence: "api-diff snapshot: 0 removals, 4 additions",
      },
      {
        id: "CL-2",
        text: "Benchmarks improved by 18%.",
        gold: "partial",
        baseline: "true",
        grounds: "partial",
        evidence: "bench/run.py → 11.4% median on the same hardware profile",
      },
    ],
  },
  {
    id: "C-003",
    slug: "agent-summary-migrations",
    repo: "acme/billing-api",
    title: "Agent summary — 'migrations are reversible and tested'",
    source: "Agent summary",
    status: "needs-human",
    hard: true,
    humanMinutes: 6,
    costUsd: 0.31,
    updated: "Yesterday at 6:44 p.m.",
    claims: [
      {
        id: "CL-1",
        text: "Every migration has a down() path.",
        gold: "false",
        baseline: "true",
        grounds: "false",
        evidence: "3 of 17 migrations raise NotImplementedError in down()",
      },
      {
        id: "CL-2",
        text: "Migration tests run in CI.",
        gold: "true",
        baseline: "false",
        grounds: "true",
        evidence: ".github/workflows/ci.yml job 'migrations' present and required",
      },
      {
        id: "CL-3",
        text: "Rollback was rehearsed against production-shaped data.",
        gold: "partial",
        baseline: "true",
        grounds: "partial",
        evidence: "Only a 200-row synthetic fixture — human gate requested",
      },
    ],
  },
  {
    id: "C-004",
    slug: "edge-cache-readme",
    repo: "acme/edge-cache",
    title: "README — 'no network calls at import time'",
    source: "README",
    status: "verified",
    hard: false,
    humanMinutes: 2,
    costUsd: 0.09,
    updated: "Fri at 4:02 p.m.",
    claims: [
      {
        id: "CL-1",
        text: "Importing the package performs no network I/O.",
        gold: "true",
        baseline: "true",
        grounds: "true",
        evidence: "sandbox import with egress blocked → exit 0",
      },
    ],
  },
  {
    id: "C-005",
    slug: "sdk-docs-adversarial",
    repo: "acme/telemetry-sdk",
    title: "Adversarial pack — docs written to look correct",
    source: "Agent summary",
    status: "mismatch",
    hard: true,
    humanMinutes: 8,
    costUsd: 0.38,
    updated: "Fri at 11:20 a.m.",
    claims: [
      {
        id: "CL-1",
        text: "Sampling defaults to 100% in development.",
        gold: "false",
        baseline: "true",
        grounds: "false",
        evidence: "config.py: DEFAULT_SAMPLE_RATE = 0.1 regardless of env",
      },
      {
        id: "CL-2",
        text: "The SDK is dependency-free.",
        gold: "false",
        baseline: "partial",
        grounds: "false",
        evidence: "pyproject lists httpx and orjson as runtime deps",
      },
    ],
  },
  {
    id: "C-006",
    slug: "queue-worker-pr",
    repo: "acme/queue-worker",
    title: "PR #91 — 'at-least-once delivery preserved'",
    source: "PR",
    status: "queued",
    hard: false,
    humanMinutes: 0,
    costUsd: 0,
    updated: "Queued",
    claims: [
      {
        id: "CL-1",
        text: "Acknowledgement happens after the handler returns.",
        gold: "true",
        baseline: "true",
        grounds: "true",
        evidence: "pending run",
      },
    ],
  },
];

export const metrics = {
  claimAccuracy: { baseline: 0.61, grounds: 0.92 },
  humanMinutes: { baseline: 14.2, grounds: 3.8 },
  costPerCase: { baseline: 0.06, grounds: 0.21 },
  casesRun: 10,
  adversarialCases: 2,
};

export const accuracyByCase = [
  { name: "C-001", baseline: 33, grounds: 100 },
  { name: "C-002", baseline: 50, grounds: 100 },
  { name: "C-003", baseline: 33, grounds: 100 },
  { name: "C-004", baseline: 100, grounds: 100 },
  { name: "C-005", baseline: 0, grounds: 100 },
  { name: "C-006", baseline: 100, grounds: 100 },
  { name: "C-007", baseline: 66, grounds: 66 },
  { name: "C-008", baseline: 50, grounds: 100 },
  { name: "C-009", baseline: 66, grounds: 100 },
  { name: "C-010", baseline: 100, grounds: 66 },
];

export type TrajectoryStep = {
  id: string;
  node: "plan" | "read" | "grep" | "test" | "verify" | "gate" | "report";
  label: string;
  detail: string;
  duration: string;
};

export const trajectory: TrajectoryStep[] = [
  {
    id: "T1",
    node: "plan",
    label: "Decompose claim pack",
    detail: "3 claims → 3 verification plans; memory seeded with finding IDs.",
    duration: "0.4s",
  },
  {
    id: "T2",
    node: "grep",
    label: "rg 'AKIA|BEGIN PRIVATE KEY' -n",
    detail: "1 hit — fixtures/aws_sample.env:3",
    duration: "0.2s",
  },
  {
    id: "T3",
    node: "read",
    label: "read fixtures/aws_sample.env",
    detail: "Placeholder value, referenced only by tests → downgrade to partial.",
    duration: "0.3s",
  },
  {
    id: "T4",
    node: "test",
    label: "sandbox: pytest -q",
    detail: "2 failed, 118 passed — tests/test_settlement.py::test_rounding",
    duration: "42.1s",
  },
  {
    id: "T5",
    node: "verify",
    label: "Verify node re-checks each label against cited evidence",
    detail: "CL-1 false (test output), CL-2 partial (fixture), CL-3 true (pyproject).",
    duration: "1.1s",
  },
  {
    id: "T6",
    node: "gate",
    label: "Human gate requested before dependency install",
    detail: "Action outside allowlist: pip install -e '.[dev]' — approved by reviewer.",
    duration: "waiting 41s",
  },
  {
    id: "T7",
    node: "report",
    label: "Emit report.json + trajectory.jsonl",
    detail: "3 labels, 5 evidence cells, 1 retry recorded.",
    duration: "0.2s",
  },
];

export const gateQueue = [
  {
    id: "G-118",
    case: "C-003",
    action: "Run migration rollback against fixture database",
    risk: "medium" as const,
    requested: "4 min ago",
  },
  {
    id: "G-117",
    case: "C-005",
    action: "Install unpinned dependency httpx==0.27 in sandbox",
    risk: "high" as const,
    requested: "22 min ago",
  },
  {
    id: "G-116",
    case: "C-001",
    action: "Read fixtures/aws_sample.env (matched secret pattern)",
    risk: "low" as const,
    requested: "1 hr ago",
  },
];

export const runs = [
  {
    id: "R-0142",
    pack: "gold-pack-v3",
    mode: "GROUNDS agent",
    cases: 10,
    accuracy: 0.92,
    duration: "11m 04s",
    cost: 2.1,
    when: "Today 10:30",
  },
  {
    id: "R-0141",
    pack: "gold-pack-v3",
    mode: "One-shot baseline",
    cases: 10,
    accuracy: 0.61,
    duration: "1m 18s",
    cost: 0.6,
    when: "Today 10:12",
  },
  {
    id: "R-0140",
    pack: "gold-pack-v2",
    mode: "GROUNDS agent",
    cases: 8,
    accuracy: 0.88,
    duration: "9m 41s",
    cost: 1.7,
    when: "Yesterday 18:02",
  },
  {
    id: "R-0139",
    pack: "adversarial-v1",
    mode: "GROUNDS agent",
    cases: 2,
    accuracy: 1.0,
    duration: "3m 22s",
    cost: 0.7,
    when: "Fri 11:20",
  },
];

export const changelog = [
  {
    version: "0.5.0",
    date: "Aug 29, 2026",
    title: "Verify node split out of the reporter",
    body: "Labels are now re-derived from cited evidence in a dedicated node. Accuracy 0.84 → 0.92 on gold-pack-v3.",
    kind: "added" as const,
  },
  {
    version: "0.4.2",
    date: "Aug 28, 2026",
    title: "Human gate before any action outside the allowlist",
    body: "Network calls and installs pause the graph and surface an approval card with the exact command.",
    kind: "added" as const,
  },
  {
    version: "0.4.0",
    date: "Aug 28, 2026",
    title: "Removed: self-critique rewrite loop",
    body: "The extra critique pass cost 1.9x tokens for a 0.4pt accuracy change — inside noise. Removed and documented.",
    kind: "removed" as const,
  },
  {
    version: "0.3.1",
    date: "Aug 27, 2026",
    title: "Trajectories record full tool I/O",
    body: "Every read, grep and test writes stdout, exit code and elapsed time to trajectory.jsonl.",
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
      "We sampled claim packs from ten repositories and labelled each claim true, false, or partial against the actual code and a sandboxed test run. A one-shot LLM handed the same texts agreed with the documentation 61% of the time. Most of its errors were in one direction: it believed the claim.",
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
      "Our first agent read files, ran tests, and produced labels in a single call. It looked like an agent from the outside and behaved like a baseline with makeup.",
      "Splitting verification out changed the shape of the trajectory: the reporter can no longer invent a justification after the fact, because the verify node only sees the evidence cells that were actually collected.",
      "Accuracy moved from 0.84 to 0.92 on gold-pack-v3, and — more usefully for reviewers — the number of labels with no cited artefact went to zero.",
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
      "Median human time per case fell from 14.2 minutes to 3.8 — not because the human does less thinking, but because the thinking arrives pre-assembled.",
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
    a: "Every run writes trajectory.jsonl with full tool I/O, exit codes and timings. The repro guide regenerates the eval table from those artefacts with one command.",
  },
  {
    q: "Which languages are supported?",
    a: "Python, TypeScript, Java, C++, Go and Rust repositories. Test execution uses the project's own runner; evidence collection is language-agnostic.",
  },
  {
    q: "Where does the accuracy number come from?",
    a: "Claim-label accuracy versus gold across ten cases including two adversarial packs, scored by eval/score.py. Baseline 0.61, GROUNDS 0.92.",
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
