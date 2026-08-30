# HackerEarth submission — paste these fields

## Title

```
GROUNDS — Claim-verification agent that grounds README/PR claims in repo evidence
```

## Video URL

```
https://grounds-alpha.vercel.app/demo/grounds_product_film_acts_1_6.mp4
```

(Cloud Computer Use film ~1:42. Fallback local click-through: `demo/GROUNDS_DEMO.mp4`. Agent: https://cursor.com/agents/bc-297d00b1-fd27-4b5a-96b8-2c8ff5329bc6)

## Source Code

Upload: `submission/grounds-micro1-source.zip` (built by `scripts/pack-submission.mjs`)

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
- Solo workspace product UI synced from live eval (`out/metrics.json`) — not mock dashboard numbers

### Measured improvement (identical 10 packs, 2 hard)
| Metric | Baseline (one-shot LLM) | GROUNDS |
|---|---:|---:|
| Macro claim accuracy | **0.1833** | **0.9083** |
| Cost USD / case (avg) | $0.000105 | $0.000336 |
| Human min / case (gate wait) | 0.0 | 0.0 (unattended deny) |

Source: `out/metrics.json` · model via AgentRouter `gpt-5.6-sol` (OpenAI-compatible). Regenerable via `REPRO.md`.

### Improvement changelog (highlights)
- **Best change:** evidence-only verify + merge
- **Removed experiment:** self-critique rewrite loop (~1.9× tokens, &lt;1pt accuracy) — spend tokens on evidence, not vanity rewrites
- Full log: `IMPROVEMENT_CHANGELOG.md`

### Repro
```bash
python -m pip install -e ".[dev]"
python baseline/run.py --all --mode llm
python agent/run.py --all
python eval/score.py
```
Details + versions: `REPRO.md`. Trajectories under `out/agent/*/trajectory.jsonl`.

### Product / demo
- Live app: https://grounds-alpha.vercel.app  
- Repo: https://github.com/henrysammarfo/grounds  
- Demo video: product click-through (search/filter, start run, gate approve/deny, evaluation)

### Honesty / residual risk
Sandbox + allowlist + human gate reduce risk; they do **not** make the system unhackable. Fixture leakage, sandbox escapes, and model mistakes remain possible.

### Hot take
Documentation honesty is an **agent workflow**, not a lint rule. micro1-shaped trajectories (tool I/O + human checkpoints) are the product.

---
