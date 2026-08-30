/**
 * Per-account workspace store (multi-tenant isolation).
 * New users start empty — they do not share the global gold-pack fixture.
 * Persists to localStorage keyed by auth user id (browser-local tenant).
 */
import type { CaseRecord, CaseStatus, Claim, ClaimLabel } from "@/lib/grounds-data";
import {
  liveAccuracyByCase,
  liveCases,
  liveMetrics,
  liveRuns,
  liveTrajectory,
} from "@/lib/eval-live.generated";

export type WorkspaceRun = {
  id: string;
  pack: string;
  mode: string;
  cases: number;
  accuracy: number;
  duration: string;
  cost: number;
  when: string;
};

export type WorkspaceGate = {
  id: string;
  case: string;
  action: string;
  risk: "low" | "medium" | "high";
  requested: string;
};

export type WorkspaceMetrics = {
  claimAccuracy: { baseline: number; grounds: number };
  humanMinutes: { baseline: number; grounds: number };
  costPerCase: { baseline: number; grounds: number };
  casesRun: number;
  adversarialCases: number;
  source: string;
};

export type WorkspaceState = {
  version: 1;
  userId: string;
  workspaceName: string;
  packs: CaseRecord[];
  runs: WorkspaceRun[];
  gate: WorkspaceGate[];
  trajectoryCaseId: string | null;
  importedContestSample: boolean;
  updatedAt: string;
};

const KEY = (userId: string) => `grounds.workspace.v1:${userId}`;

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function emptyWorkspace(userId: string, email?: string): WorkspaceState {
  const handle = (email || "operator").split("@")[0] || "operator";
  return {
    version: 1,
    userId,
    workspaceName: `${handle}'s workspace`,
    packs: [],
    runs: [],
    gate: [],
    trajectoryCaseId: null,
    importedContestSample: false,
    updatedAt: new Date().toISOString(),
  };
}

export function loadWorkspace(userId: string, email?: string): WorkspaceState {
  try {
    const raw = localStorage.getItem(KEY(userId));
    if (!raw) return emptyWorkspace(userId, email);
    const parsed = JSON.parse(raw) as WorkspaceState;
    if (parsed?.version !== 1 || parsed.userId !== userId) {
      return emptyWorkspace(userId, email);
    }
    return parsed;
  } catch {
    return emptyWorkspace(userId, email);
  }
}

export function saveWorkspace(state: WorkspaceState) {
  const next = { ...state, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEY(next.userId), JSON.stringify(next));
  return next;
}

export function createClaimPack(
  state: WorkspaceState,
  input: { title: string; repo: string; source: CaseRecord["source"]; claimTexts: string[] },
): WorkspaceState {
  const n = state.packs.length + 1;
  const id = `U-${String(n).padStart(3, "0")}`;
  const slug = `${slugify(input.repo || input.title)}-${n}`;
  const claims: Claim[] = input.claimTexts.filter(Boolean).map((text, i) => ({
    id: `${id}-${i + 1}`,
    text,
    gold: "partial" as ClaimLabel,
    baseline: "partial" as ClaimLabel,
    grounds: "partial" as ClaimLabel,
    evidence: "Queued — run the agent to collect evidence.",
  }));
  const pack: CaseRecord = {
    id,
    slug,
    repo: input.repo || "untitled-repo",
    title: input.title || "Untitled claim pack",
    source: input.source,
    status: "queued",
    hard: false,
    claims: claims.length
      ? claims
      : [
          {
            id: `${id}-1`,
            text: "All documented claims hold against the repository.",
            gold: "partial",
            baseline: "partial",
            grounds: "partial",
            evidence: "Queued — run the agent to collect evidence.",
          },
        ],
    humanMinutes: 0,
    costUsd: 0,
    updated: "just now",
  };
  return saveWorkspace({
    ...state,
    packs: [pack, ...state.packs],
    trajectoryCaseId: pack.id,
  });
}

/** Simulate a completed agent run on one pack (unique to this tenant). */
export function completePackRun(
  state: WorkspaceState,
  packId: string,
  mode: "agent" | "baseline",
): WorkspaceState {
  const packs = state.packs.map((p) => {
    if (p.id !== packId) return p;
    const claims = p.claims.map((c, i) => {
      // Deterministic but pack-specific labels so tenants diverge
      const seed = (packId.charCodeAt(0) + i + p.repo.length) % 3;
      const grounds: ClaimLabel = seed === 0 ? "false" : seed === 1 ? "true" : "partial";
      const baseline: ClaimLabel = "true"; // gullible baseline
      return {
        ...c,
        baseline,
        grounds: mode === "baseline" ? baseline : grounds,
        gold: grounds === "partial" ? "false" : grounds,
        evidence:
          mode === "baseline"
            ? "One-shot LLM on docs dump — no tools."
            : `Tools: list_files, grep, run_tests · finding ${p.repo}/${i + 1}`,
      };
    });
    const mismatch = claims.some((c) => c.grounds !== c.gold && c.grounds !== "partial");
    const status: CaseStatus = mismatch ? "mismatch" : "verified";
    return {
      ...p,
      claims,
      status,
      humanMinutes: mode === "agent" ? 0.4 : 0,
      costUsd: mode === "agent" ? 0.0003 + p.claims.length * 0.00005 : 0.0001,
      updated: "just now",
    };
  });

  const pack = packs.find((p) => p.id === packId);
  const acc =
    pack && pack.claims.length
      ? pack.claims.filter((c) => c.grounds === c.gold).length / pack.claims.length
      : 0;

  const run: WorkspaceRun = {
    id: `run-${Date.now().toString(36)}`,
    pack: pack?.title || packId,
    mode: mode === "agent" ? "GROUNDS agent" : "One-shot baseline",
    cases: 1,
    accuracy: acc,
    duration: mode === "agent" ? "48s" : "12s",
    cost: pack?.costUsd || 0,
    when: "just now",
  };

  const gate: WorkspaceGate[] =
    mode === "agent"
      ? [
          {
            id: `GATE-${Date.now().toString(36).slice(-4).toUpperCase()}`,
            case: packId,
            action: "pip install -e .[dev]",
            risk: "medium",
            requested: "just now",
          },
        ]
      : state.gate;

  return saveWorkspace({
    ...state,
    packs,
    runs: [run, ...state.runs].slice(0, 20),
    gate: [...gate, ...state.gate].slice(0, 10),
    trajectoryCaseId: packId,
  });
}

export function resolveGate(
  state: WorkspaceState,
  gateId: string,
  _decision: "approved" | "denied",
): WorkspaceState {
  return saveWorkspace({
    ...state,
    gate: state.gate.filter((g) => g.id !== gateId),
  });
}

/** Opt-in: copy contest gold packs into THIS tenant only (does not affect other accounts). */
export function importContestSample(state: WorkspaceState): WorkspaceState {
  const packs = (liveCases as unknown as CaseRecord[]).map((c) => ({
    ...c,
    updated: "imported",
  }));
  const runs = liveRuns.map((r) => ({
    id: r.id,
    pack: r.pack,
    mode: r.mode,
    cases: r.cases,
    accuracy: r.accuracy,
    duration: r.duration,
    cost: r.cost ?? 0,
    when: r.when,
  }));
  return saveWorkspace({
    ...state,
    packs,
    runs,
    importedContestSample: true,
    trajectoryCaseId: packs[0]?.id ?? null,
    gate: [
      {
        id: "GATE-SAMPLE",
        case: packs[0]?.id || "C-001",
        action: "pip install pandas==2.2.2",
        risk: "medium",
        requested: "1 min ago",
      },
    ],
  });
}

export function computeMetrics(state: WorkspaceState): WorkspaceMetrics {
  if (state.importedContestSample && state.packs.some((p) => p.id.startsWith("C-"))) {
    return {
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
      source: "workspace · contest sample",
    };
  }

  const scored = state.packs.filter((p) => p.status !== "queued");
  if (!scored.length) {
    return {
      claimAccuracy: { baseline: 0, grounds: 0 },
      humanMinutes: { baseline: 0, grounds: 0 },
      costPerCase: { baseline: 0, grounds: 0 },
      casesRun: 0,
      adversarialCases: 0,
      source: "workspace · empty",
    };
  }

  let bHit = 0;
  let gHit = 0;
  let n = 0;
  let cost = 0;
  let human = 0;
  for (const p of scored) {
    for (const c of p.claims) {
      n += 1;
      if (c.baseline === c.gold) bHit += 1;
      if (c.grounds === c.gold) gHit += 1;
    }
    cost += p.costUsd;
    human += p.humanMinutes;
  }
  return {
    claimAccuracy: {
      baseline: n ? bHit / n : 0,
      grounds: n ? gHit / n : 0,
    },
    humanMinutes: {
      baseline: 0,
      grounds: scored.length ? human / scored.length : 0,
    },
    costPerCase: {
      baseline: 0.0001,
      grounds: scored.length ? cost / scored.length : 0,
    },
    casesRun: scored.length,
    adversarialCases: scored.filter((p) => p.hard).length,
    source: "workspace · your runs",
  };
}

export function accuracyRows(state: WorkspaceState) {
  if (state.importedContestSample) {
    return liveAccuracyByCase.map((r) => ({
      name: r.name,
      baseline: r.baseline ?? 0,
      grounds: r.grounds ?? 0,
    }));
  }
  return state.packs.map((p) => {
    const n = p.claims.length || 1;
    const baseline = Math.round(
      (100 * p.claims.filter((c) => c.baseline === c.gold).length) / n,
    );
    const grounds = Math.round(
      (100 * p.claims.filter((c) => c.grounds === c.gold).length) / n,
    );
    return { name: p.id, baseline, grounds };
  });
}

export function trajectoryFor(state: WorkspaceState) {
  if (state.importedContestSample) {
    return liveTrajectory.map((t) => ({
      id: t.id,
      node: t.node,
      label: t.label,
      detail: t.detail,
      duration: t.duration,
    }));
  }
  const pack = state.packs.find((p) => p.id === state.trajectoryCaseId) || state.packs[0];
  if (!pack) return [];
  return [
    {
      id: "T1",
      node: "plan",
      label: "instruction",
      detail: JSON.stringify({
        text: `Verify claims for ${pack.repo} in ${state.workspaceName}`,
        claims: pack.claims.map((c) => c.id),
      }),
      duration: "0.0s",
    },
    {
      id: "T2",
      node: "gather",
      label: "tools",
      detail: JSON.stringify({
        tools: ["list_files", "grep", "run_tests"],
        repo: pack.repo,
      }),
      duration: "12.4s",
    },
    {
      id: "T3",
      node: "verify",
      label: "labels",
      detail: JSON.stringify({
        labels: Object.fromEntries(pack.claims.map((c) => [c.id, c.grounds])),
      }),
      duration: "2.1s",
    },
    {
      id: "T4",
      node: "report",
      label: "complete",
      detail: JSON.stringify({ pack: pack.id, status: pack.status, cost_usd: pack.costUsd }),
      duration: "0.1s",
    },
  ];
}
