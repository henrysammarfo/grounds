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

## Submission (HackerEarth)

- **Paste fields:** `submission/HACKEREARTH_FIELDS.md`
- **Source zip:** `submission/grounds-micro1-source.zip` (**21.6 MB** &lt; 50 MB) — rebuild: `node scripts/pack-submission.mjs`
- **Video URL (after deploy):** https://grounds-alpha.vercel.app/demo/grounds_product_film_acts_1_6.mp4
- Cloud film agent FINISHED: https://cursor.com/agents/bc-297d00b1-fd27-4b5a-96b8-2c8ff5329bc6

## Demo video

- **Judge-path film (signup→sign-in→results):** `grounds_judge_path_signup_signin_film.mp4` (~85s) — Computer Use + Playwright on temp Vercel deploy with real Supabase auth
- Cloud film agent (judge path): https://cursor.com/agents/bc-96957f96-5371-428f-ab44-62a42cc513ba
- Cloud product film (Acts 1–6, demo bypass): `public/demo/grounds_product_film_acts_1_6.mp4` (~1:42)
- Local click-through: `demo/GROUNDS_DEMO.mp4`

## Live deploy blocker (2026-08-30)

- **`grounds-alpha.vercel.app` is broken** — missing `VITE_SUPABASE_*` at Vercel build → client throws on load
- Fix: `docs/DEPLOY_VERCEL.md` — add Supabase env vars in Vercel, redeploy
- Temporary working deploy used for judge film: `temporary-rapid-hawthorn-7kywpoj.vercel.app` (anonymous, expires)

## Still for submit

- Paste fields + upload zip on HackerEarth before **Aug 31 18:00 UTC**
- Confirm video URL returns 200 after Vercel deploy
- Optional: `GROUNDS_INTERACTIVE_GATE=1` once to capture real human-min demo
