# HackerEarth submission — paste these fields

## Title

```
GROUNDS — Claim-verification agent that grounds README/PR claims in repo evidence
```

## Video URL

```
https://grounds-alpha.vercel.app/demo/grounds_product_film_acts_1_6.mp4
```

Final judge film (~3:53, under 5:00): **visible cursor** · homepage/product → **fresh signup** (empty workspace) → **New claim pack** → re-run/results/export → trajectories · runs · human gate · evaluation · settings → **second account** (isolation). No demo bypass.

Mirror file: `public/demo/grounds_multi_tenant_judge_full_demo.mp4` (same bytes).

## Source Code

Upload: `submission/grounds-micro1-source.zip` (rebuild: `node scripts/pack-submission.mjs`)

Zip excludes MP4s (hosted at Video URL) so the archive stays ≤50MB.

## Description (paste below)

---

**GROUNDS** verifies engineering claims in READMEs, PRs, and agent summaries against the **real repository** — with tools, sandboxed tests, an evidence-only **verify** node, and a **human gate** before installs/network — then beats a one-shot LLM **baseline** on identical gold claim packs.

### Problem
Fluent docs can look true while tests fail and secrets slip into the tree. One-shot LLMs trust the prose. Reviewers need **artefacts** (grep hits, pytest exit codes, trajectory JSONL), not vibes.

### Solution (agent engineering)
LangGraph graph: **plan → gather (list/read/grep/test) → verify → human gate → report**

- Explicit **verify** node: labels re-derived from evidence only (not a fat prompt)
- Sandbox inventory + pytest; gate pauses `pip`/`npm`/curl beyond allowlist
- Trajectories: `grounds.trajectory.v1` JSONL with tool I/O and gate decisions
- Product UI: fresh account → empty workspace → create claim pack → run packs → measured evaluation (per-account local workspace)

### Measured improvement (identical 10 packs, 2 hard)
| Metric | Baseline (one-shot LLM) | GROUNDS |
|---|---:|---:|
| Macro claim accuracy | **0.1833** | **0.9083** |
| Cost USD / case (avg) | $0.000105 | $0.000336 |
| Human min / case (gate wait) | 0.0 | 0.0 (unattended deny) |

Source: `out/metrics.json` · model via AgentRouter `gpt-5.6-sol`. Regenerable via `REPRO.md`.

### Improvement changelog (highlights)
- **Best change:** evidence-only verify + merge
- **Removed experiment:** self-critique rewrite loop (~1.9× tokens, &lt;1pt accuracy)
- Full log: `IMPROVEMENT_CHANGELOG.md`

### Repro
```bash
python -m pip install -e ".[dev]"
python baseline/run.py --all --mode llm
python agent/run.py --all
python eval/score.py
```

### Product / demo
- Live app: https://grounds-alpha.vercel.app  
- Demo video: cursor walkthrough — signup → new pack → every page → second-account isolation (~3:53)

### Honesty / residual risk
Sandbox + allowlist + human gate reduce risk; they do **not** make the system unhackable. Workspace isolation is per-auth-user localStorage (not full server RLS).

### Hot take
Documentation honesty is an **agent workflow**, not a lint rule.

---
