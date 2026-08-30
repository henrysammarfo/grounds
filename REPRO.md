# REPRO — GROUNDS claim verification

Clean-room reproduction for the micro1 Frontier Engineering Challenge package.

## Requirements

- Python **3.11+** (tested on 3.13)
- Node optional (marketing app only)
- `OPENAI_API_KEY` for LLM baseline + evidence-only verify node  
  (loaded from `grounds/.env` or `../scoutbot/agent/.env` via `grounds_lib`)
- Never commit secrets

## Install

```bash
cd grounds
python -m pip install -e ".[dev]"
# or:
python -m pip install langgraph langchain-core langchain-openai openai pydantic rich httpx pytest
```

## Run baseline (one-shot)

```bash
python baseline/run.py --all --mode llm
# offline gullible baseline (no API):
python baseline/run.py --all --mode naive
```

Writes `out/baseline/<case>/predictions.json` + `trajectory.jsonl`.

## Run GROUNDS agent

```bash
python agent/run.py --all
```

LangGraph graph: `plan → gather(tools) → verify → gate → report`.  
Writes `out/agent/<case>/report.json` + `trajectory.jsonl`.

Human gate: installs/network beyond allowlist are recorded in trajectory; unattended runs deny by default. Set `--auto-approve` only in controlled CI.

## Score

```bash
python eval/score.py
```

Writes `out/metrics.json`, `out/eval_table.json`, `out/EVAL_TABLE.md`.

## Latest measured result (this machine, 2026-08-30 · AgentRouter `gpt-5.6-sol`)

| | Claim accuracy (macro) | Cost USD / case (avg) | Human min / case |
|---|---:|---:|---:|
| Baseline (LLM one-shot) | **0.1833** | $0.000105 | 0.0 |
| GROUNDS agent | **0.9083** | $0.000336 | 0.0 (unattended deny) |
| Cases | 10 (2 hard/adversarial) | | |

Per-case table: `out/EVAL_TABLE.md`.

## Approximate runtime / cost

Filled automatically by `eval/score.py` from token usage + gate stopwatch:

```bash
python baseline/run.py --all --mode llm
python agent/run.py --all
python eval/score.py
# see out/metrics.json → cost_usd_per_case · human_minutes_per_case · wall_seconds_per_case
```

Pricing defaults (gpt-4o-mini): **$0.15 / 1M input**, **$0.60 / 1M output** (Tavily live 2026-08-30). Override with `GROUNDS_PRICE_IN_PER_M` / `GROUNDS_PRICE_OUT_PER_M`.

Human minutes = **interactive gate wait** only (`GROUNDS_INTERACTIVE_GATE=1`). Unattended agent runs record `0` human minutes (deny by default).

LLM keys (put in `grounds/.env`, never commit / never paste in chat):

```
OPENAI_API_KEY=...
# or
AGENTROUTER_API_KEY=...
AGENTROUTER_BASE_URL=https://agentrouter.org/v1
```

## Layout

```
cases/C-00N/{meta,claims,gold}.json + repo/
baseline/run.py
agent/run.py
eval/score.py
grounds_lib/{cases,sandbox,verify,trajectory}.py
out/   # generated artefacts (gitignored optional)
```

## Safety

Sandbox confines reads to the case `repo/`. Consequential installs require approval. Residual risk remains (model errors, sandbox escapes) — do not claim unhackable.
