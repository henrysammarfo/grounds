# GROUNDS — CURRENT STATE

> Updated: **2026-08-30** (final film + submission ready)  
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
- Base: `https://agentrouter.org/v1`
- Model: `gpt-5.6-sol`
- **Rotate keys** that were pasted in chat

## Multi-tenant / product

- Per-account workspace store (`src/lib/workspace-store.ts`) — new signups start **empty**
- **New claim pack** creates tenant-private packs; runs/gate/eval scoped to that account
- Optional **Import contest sample** copies gold packs into YOUR workspace only
- Isolation: localStorage per auth user (not full server RLS)

## Final demo video

- File: `public/demo/grounds_product_film_acts_1_6.mp4` (= `grounds_multi_tenant_judge_full_demo.mp4`, ~26.8 MB, ~3:53)
- Acts: home/product → fresh signup → new pack → results → all pages → second-account empty
- Visible cursor; no demo bypass
- Cloud agent: `bc-2edeaf68-54e2-47ca-9489-60bdb2810d6d`

## Submission (HackerEarth)

- **Paste fields:** `submission/HACKEREARTH_FIELDS.md`
- **Video URL:** `https://grounds-alpha.vercel.app/demo/grounds_product_film_acts_1_6.mp4`
- **Source zip:** `submission/grounds-micro1-source.zip` — `node scripts/pack-submission.mjs`
- **Status:** artefacts ready — upload on HackerEarth before **2026-08-31 18:00 UTC**
