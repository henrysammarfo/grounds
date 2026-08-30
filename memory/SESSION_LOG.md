# GROUNDS — SESSION LOG

## 2026-08-30 — Click-through product demo + multi-tenant decision

### Intent
User wanted real feature clicks (not scroll tour) and clarity on multi-tenant.

### Done
- Seeded demo human-gate queue when eval has none; Approve/Deny recorded in UI
- Settings Access: solo workspace copy; removed fake reviewer seats
- Workspace label → `solo`
- Re-recorded `demo/GROUNDS_DEMO.mp4` (~114s) with Playwright clicks: search/filter, export, start run, gate, settings toggles
- **Decision:** multi-tenant not needed for contest submit

---

## 2026-08-30 — Contest demo video (product, not slides)

### Intent
User rejected slide-deck demo; want **product** walkthrough of the live app.

### Done
- Fixed homepage metrics to live eval (removed stale 41% / 3.8 human-min mocks)
- `VITE_GROUNDS_DEMO=1` local-only dashboard auth bypass (DEV only)
- Recorded `demo/GROUNDS_DEMO.mp4` via Playwright against `npm run dev` (~186s): home → product → dashboard → cases/C-001 → trajectories → evaluation → gate → runs → docs → changelog
- Script: `scripts/render-product-demo.mjs` (`npm run demo:product`)

### Still open
- HackerEarth submission upload
- Optional interactive human-gate demo minutes

---

## 2026-08-30 — Contest demo video

### Intent
Produce ≤5 min micro1 demo (`VIDEO_SCRIPT.md`).

### Done
- Re-ran live `baseline/run.py --case C-001 --mode llm` + `agent/run.py --case C-001` (AgentRouter)
- Built `demo/index.html` beat sheet with measured metrics **0.1833 → 0.9083**
- Rendered slide MP4 (superseded by product walkthrough)
- Script: `scripts/render-demo-video.mjs`

### Still open
- HackerEarth submission upload
- Optional interactive human-gate demo minutes

---

## 2026-08-29 — Discovery + live research (no agent code yet)

### Intent
Read `GROUNDS_BIBLE.md` word-for-word; create Cursor rules + skill; live fact-check with Tavily + TinyFish; stand up `memory/` MDs; recommend win path. User: no unhackable claims; full production bar; bible may be wrong — recommend corrections.

### Sources read
- `scoutbot/docs/GROUNDS_BIBLE.md` (full)
- `scoutbot/docs/memory/research-raw/hackathons/micro1/{NOTES,LOCKED,DEEP_PASS}.md`
- `scoutbot/docs/WIN_DOCTRINE.md`, `PORTFOLIO_SLATE.md`, `SESSION_STATE.md`, `RESEARCH_PROTOCOL.md`
- `scoutbot/.cursor/rules/research-no-hallucinate.mdc`
- `grounds` repo: README (stale Quantum² template paste), routes, `src/lib/grounds-data.ts`, package.json, Lovable AGENTS.md

### Live tools
- Tavily search (deadline + AI README reliability + prizes query) → dumps in `memory/_raw_tavily_micro1.json`
- TinyFish automation on HackerEarth challenge URL → `memory/_raw_tinyfish_micro1.sse` (COMPLETED)
- WebFetch official HackerEarth page
- WebSearch cross-check
- Browser MCP: **unavailable** this environment

### Findings (short)
1. Deadline **Aug 31 18:00 UTC** is correct (bible OK). Stale social still says Aug 28–30.
2. Live regs **~7.8K** (bible 6.9K stale).
3. Submission package + trajectory requirements match bible (TinyFish quotes).
4. **Critical gap:** this repo is a Lovable/TanStack product shell with **mock** eval numbers — no Python LangGraph agent, no `cases/`, no real trajectories. Cannot win Measured/Repro/Agent-eng on UI alone.
5. Fake 0.61→0.92 must not ship as evidence.
6. Keys pasted in chat → rotate.

### Artifacts created this session
- `memory/CURRENT_STATE.md`
- `memory/FACT_CHECK.md`
- `memory/SESSION_LOG.md` (this file)
- `.cursor/rules/grounds-doctrine.mdc`
- `.cursor/rules/research-no-hallucinate.mdc`
- `.cursor/skills/grounds-micro1/SKILL.md`
- `.gitignore` entries for `.env` + raw research dumps

### Next session should
1. Scaffold contest core under `contest/` or repo root per bible architecture.
2. Author 10 gold packs + adversarial.
3. Implement baseline + LangGraph agent with verify + human gate + trajectory JSONL.
4. Run eval; replace mock metrics; write REPRO + video script.

---

## 2026-08-29 — BUILDING: contest core + measured eval

### Live research
- `node scripts/research-live.mjs` — Tavily + TinyFish on LangGraph interrupt/HITL (COMPLETE).

### Built
- `cases/C-001`…`C-010` + INDEX
- `grounds_lib/` sandbox, verify, trajectory, cases
- `baseline/run.py`, `agent/run.py` (LangGraph), `eval/score.py`
- `REPRO.md`, `IMPROVEMENT_CHANGELOG.md`, `tests/test_smoke.py` (3 passed)

### Measured (fact)
- Baseline LLM macro accuracy **0.4083**
- GROUNDS agent **0.8250** on same 10 gold packs (`out/metrics.json`)
- UI metrics/copy updated to 0.41 → 0.83 (removed fake 0.61/0.92)

### Still open
- Record ≤5 min video (`VIDEO_SCRIPT.md`)
- Fill cost/human-min from provider usage + stopwatch

### Also this turn
- `scripts/sync-eval-to-ui.mjs` → live dashboard data
- `VIDEO_SCRIPT.md`, docs route = real REPRO commands
- Contact localStorage inbox; settings policy persistence
- `agent/graph.py` alias; npm scripts `contest:*`
- TrajectoryList fallback icons for tool/memory nodes

---

## 2026-08-30 — Cost + human-min full instrumentation

### Built
- `grounds_lib/llm.py` — OpenAI / AgentRouter client, token usage, USD cost (gpt-4o-mini defaults $0.15/$0.60 per 1M from Tavily)
- `grounds_lib/gate.py` — interactive gate stopwatch (`GROUNDS_INTERACTIVE_GATE=1`)
- baseline/agent write `usage` + `timing` into out/; eval aggregates cost + human-min + wall
- tests: 4 passed (smoke + metering)

### Blocker
- Scoutbot `OPENAI_API_KEY=` is empty; grounds `.env` has no LLM key yet
- User has OpenAI + AgentRouter keys — must place in `grounds/.env` locally (not chat), then `npm run contest:all`

---

## 2026-08-30 — AgentRouter wired + metered contest run

### Integration (from aftercut)
- `AGENT_ROUTER_API_KEY` + `AGENT_ROUTER_OPENAI_BASE=https://agentrouter.org/v1`
- WAF headers (Claude Code wire-image) in `grounds_lib/llm.py`
- Default model `gpt-5.6-sol`

### Live eval
- Baseline acc **0.1833** · GROUNDS **0.9083**
- Cost/case avg baseline **$0.000105** · GROUNDS **$0.000336**
- Human-min 0 (unattended)
- UI synced via `scripts/sync-eval-to-ui.mjs`

### Security
- Key was pasted in chat → **rotate** at agentrouter.org/console/token
- Stored only in gitignored `grounds/.env`


---

## 2026-08-29 — Author `cases/` gold packs C-001…C-010

### Intent
Create exactly 10 case directories with meta/claims/gold + synthetic `repo/` fixtures for contest eval.

### Done
- `cases/INDEX.json` + C-001…C-010 (2–4 claims each; hard: C-005 telemetry, C-006 vault-lite)
- C-001: failing pytest + fake AKIA-looking `config/sample.env`
- C-003: migrations with `down()` → `NotImplementedError` vs agent summary
- C-005: adversarial pulse-telemetry docs (no PII redaction; eager `_SENT`)
- Smoke: `grounds_lib.cases.load_case` OK; pytest fails only on C-001 as designed
- `.gitignore`: `__pycache__/`, `.pytest_cache/`, venvs

### Next
Baseline + agent + eval against these packs.
