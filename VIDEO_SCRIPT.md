# VIDEO_SCRIPT.md — GROUNDS ≤5 minutes

Target: micro1 deliverable. One continuous capture preferred; captions OK.

## Beat sheet (≈4:30)

| # | Time | On screen | Say |
|---|---|---|---|
| 1 | 0:00–0:35 | README of `cases/C-001/repo` claiming tests pass / no secrets | “AI READMEs sound true while tests fail. GROUNDS grounds each claim in the real repo.” |
| 2 | 0:35–1:20 | `python baseline/run.py --case C-001 --mode llm` + predictions.json showing `true` on failing claims | “Baseline: one-shot LLM, docs dump only, no tools. It believes the prose.” |
| 3 | 1:20–3:10 | `python agent/run.py --case C-001` + scroll `trajectory.jsonl` (grep AKIA, pytest fail, verify) | “Agent: list/read/grep/test in a sandbox, then a verify node that only sees evidence. Human gate before installs.” |
| 4 | 3:10–4:00 | `out/EVAL_TABLE.md` + `out/metrics.json` (0.41 → 0.83) | “Same ten gold packs both sides. Macro claim accuracy: baseline 0.41, GROUNDS 0.83.” |
| 5 | 4:00–4:45 | `IMPROVEMENT_CHANGELOG.md` — highlight verify node + **removed** self-critique loop | “Best change: evidence-only verify. Removed experiment: critique rewrite — cost up, signal flat.” |
| 6 | 4:45–5:00 | Logo / one-liner | “Documentation honesty as an agent workflow — trajectories judges can replay.” |

## Must show

- Tool I/O in trajectory (not just final labels)
- Fair baseline vs agent on identical cases
- One removed experiment
- Do **not** claim unhackable

## Record checklist

- [ ] Clean terminal font, 1080p+
- [ ] No API keys visible
- [ ] File paths match repo
- [ ] Under 5:00 hard cap
