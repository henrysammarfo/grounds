---
name: grounds-micro1
description: Build and ship GROUNDS for the micro1 Frontier Engineering Challenge — claim-verification agent, gold packs, baseline vs agent eval, trajectories, REPRO, and video. Use when working on GROUNDS, micro1, claim packs, LangGraph verify node, or contest submission.
disable-model-invocation: true
---

# GROUNDS × micro1

## When to use

User is building/submitting **GROUNDS** for micro1 Frontier Engineering Challenge 2026, or asks about claim verification agents, gold packs, baselines, trajectories, or contest deliverables.

## Read first

1. `memory/CURRENT_STATE.md`
2. `memory/FACT_CHECK.md`
3. Scoutbot: `docs/GROUNDS_BIBLE.md` and `docs/memory/research-raw/hackathons/micro1/{NOTES,LOCKED,DEEP_PASS}.md`

## Non-negotiables

- Prefer **live** HackerEarth over stale social/Tavily summaries for deadline/prizes.
- **Never** claim unhackable; document residual risk.
- **Never** treat Lovable dashboard mock data as Measured Improvement.
- No secrets in repo; human gate before network/install beyond allowlist.
- Full production implementation — no half-done samples for contest core.

## Architecture (bible)

```
cases/<id>/{repo_fixture, claims.json, gold.json}
baseline/run.py → predictions.json
agent/graph.py → tools(read,grep,test) → verify → report.json + trajectory.jsonl
eval/score.py → accuracy, human-min, cost
CHANGELOG.md · REPRO.md · VIDEO
```

## Agent exceed checklist

- [ ] Explicit **verify** node (not one fat prompt)
- [ ] Tool I/O visible in trajectories
- [ ] Retries + human checkpoint before network/install beyond allowlist
- [ ] Memory of prior finding IDs within a case
- [ ] Changelog entry per experiment with evidence cells
- [ ] One **removed** experiment documented

## Rubric targeting (/100 from PDF — re-check PDF if disputed)

| Criterion | Pts | How GROUNDS scores |
|---|---:|---|
| Problem & User Value | 15 | Eng lead / AI README lies bottleneck |
| Agent Solution & Engineering | 30 | Tools + verify + memory + human gate |
| End to End Quality | 20 | Signed-name package, not AI sludge |
| Measured Improvement | 15 | Same ≥10 cases baseline vs agent |
| Reproducibility | 15 | One-command REPRO |
| Hot Take / Insights | 5 | Failure mode + removed experiment |

## Demo video (≤5 min)

1. Problem: README claims “all tests pass / no secrets”
2. Baseline: LLM says looks good
3. GROUNDS: tools find failing test + risky file
4. Accuracy/time/cost table
5. Best changelog change + one removed experiment

## Research tools

- Tavily: `https://api.tavily.com/search` (`TAVILY_API_KEY`)
- TinyFish: `https://agent.tinyfish.ai/v1/automation/run-sse` (header `X-API-Key`)
- Persist results to `memory/FACT_CHECK.md`

## Output when implementing code

Follow senior-architect contract: Architecture Analysis → Filepath Declaration → Code → Tests → Architectural Impact. Stop on conflicts and ask.
