# GROUNDS — CURRENT STATE

> Updated: **2026-08-30** (AgentRouter live + metered eval)  
> Contest close: **Aug 31 18:00 UTC**

## Measured (AgentRouter `gpt-5.6-sol`, this machine)

| Metric | Baseline | GROUNDS |
|---|---:|---:|
| Claim accuracy (macro) | **0.1833** | **0.9083** |
| Cost USD / case (avg) | **$0.000105** | **$0.000336** |
| Human min / case (gate) | **0.0** | **0.0** (unattended deny) |
| Cases | 10 (2 hard) | same |

Source: `out/metrics.json` · `out/EVAL_TABLE.md`

## LLM

- Provider: **AgentRouter** (`AGENT_ROUTER_API_KEY` in gitignored `grounds/.env`)
- Base: `https://agentrouter.org/v1` (aftercut pattern + WAF headers)
- Model: `gpt-5.6-sol`
- **Rotate the key** — it was pasted in chat

## Still for submit

- ~~Record ≤5 min video (`VIDEO_SCRIPT.md`)~~ → **done** `grounds_product_film_acts_1_6.mp4` (~1:42, local demo auth)
- Optional: `GROUNDS_INTERACTIVE_GATE=1` once to capture real human-min demo
