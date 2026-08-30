# Improvement Changelog — GROUNDS

Contest deliverable: baseline → iterations → final, with evidence and one removed experiment.

## 0.5.0 — 2026-08-29 — Verify node + evidence merge

- Split labeling into explicit **verify** path: tools gather evidence, then evidence-only LLM label with heuristic merge (prefer non-`partial`).
- Macro claim accuracy on gold-pack v1: baseline **0.41** → GROUNDS **0.83** (`out/metrics.json`).
- Trajectories record tool I/O, finding memory IDs, and human-gate decisions.

## 0.4.2 — 2026-08-29 — Human gate before network/install

- `run_tests` / commands containing `pip install` / `npm install` / curl pause for approval.
- Unattended default: **deny** and record `denied_unattended` in trajectory.

## 0.4.1 — 2026-08-29 — Sandbox inventory hardening

- `list_files` rejects path escapes and `%…%` pollution; fixed subprocess env (full `os.environ` + `PYTHONPATH`) after Windows fixture corruption.

## 0.4.0 — Removed experiment: self-critique rewrite loop

- Extra LLM “critique and rewrite labels” pass after verify.
- **Removed:** ~1.9× token cost for &lt;1pt accuracy move inside noise on early packs.
- Lesson: spend tokens on **evidence collection**, not second-guessing without new tools.

## 0.3.1 — Trajectories record full tool I/O

- JSONL schema `grounds.trajectory.v1`: instructions → tool args/stdout tails → verify → gate → report.

## 0.3.0 — Gold packs C-001…C-010

- Ten synthetic fixtures; two hard (C-005, C-006). Identical inputs for baseline and agent.

## Failure mode (hot take)

The dominant failure is **over-trusting fluent docs**. One-shot LLMs agree with README/PR prose; GROUNDS only wins when the verify node is forced to cite artefacts. If tools are shallow (miss `LICENSE` vs README), accuracy collapses toward baseline — inventory breadth is load-bearing.

## Hot take

Documentation honesty is an agent workflow, not a lint rule. micro1-shaped trajectories (tool I/O + human checkpoints) are the product; the CI “docs gate” is the company.
