# GROUNDS — FACT CHECK LOG

> Protocol: Tavily → TinyFish → official page/PDF. Unverified stays labeled.  
> Raw dumps (gitignored): `memory/_raw_tavily_micro1.json`, `memory/_raw_tinyfish_micro1.sse`  
> Date of this pass: **2026-08-29**

---

## Contest facts

| CLAIM | VERIFIED | SOURCES | ACTION |
|---|---|---|---|
| Submissions close **Mon Aug 31 2026 18:00 UTC** | **yes** | TinyFish COMPLETE quote: “August 31 at 18:00 UTC”; WebFetch page header “Aug 28 – Aug 31 … 3:00 PM – 6:00 PM · UTC”; LinkedIn Camila Farias extension post | Keep bible deadline; ignore stale “ends Aug 29/30” summaries |
| Challenge window Aug 28–31 UTC | **yes** | Same as above | Update NOTES if they still say Aug 28–30 only |
| Team size 1 / individual | **yes** | WebFetch HackerEarth | OK |
| ~7.8K registrations (live) | **yes** | WebFetch 2026-08-29 | Bible ~6.9K is stale — update memory |
| $10,000 cash prize pool | **yes** | TinyFish Prizes tab quote “$10,000 in cash”; Camila LinkedIn | Keep |
| Winner takes $5,000 | **partial** | Camila LinkedIn (“winner will now take $5000”); TinyFish did **not** quote per-place split on Prizes tab | Do not assert $5k in pitch until Prizes tab / PDF confirms |
| Older posts: $5k pool / $3k winner | **stale** | Facebook/Instagram/older LinkedIn | Prefer live HackerEarth + Camila extension |
| ≤50 paid micro1 eng opportunities | **yes** | TinyFish quote | Keep |
| Trace buy $2–$15/trace, cap $100–$200, not prize, not guaranteed | **yes** | TinyFish FAQs/Prizes quote | Keep |
| Deliverables: code+changelog · repro · ≤5m video · trajectories | **yes** | TinyFish Submission Package quotes | Matches bible §2 |
| Rubric includes Agent eng · Repro · Measured · E2E; tie-break that order | **yes** | TinyFish Evaluation / Rule Book | PDF also had Value 15 + Hot take 5 — keep PDF as primary for full /100 until page lists points |
| Full /100: Value 15 · Agent 30 · E2E 20 · Measured 15 · Repro 15 · Hot take 5 | **partial** | scoutbot NOTES/DEEP_PASS cite PDF p5; TinyFish listed dimensions without point weights | Re-open PDF before changing bible; do not invent weights |
| Coding agents required · own API keys · sandbox · human approval · no secrets | **yes** | PDF/NOTES + TinyFish qualification/trace language | Keep |
| micro1 owns submissions under Participation Agreement | **partial** | NOTES cite page; not re-extracted this pass | Re-read Rule Book before submit |
| Tavily answer “ends Aug 29” / “Aug 28–30 only” | **no** (contradicted) | Prior NOTES + this pass WebFetch/TinyFish | Prefer host page; Tavily answers can lag |

---

## Product / market claims

| CLAIM | VERIFIED | SOURCES | ACTION |
|---|---|---|---|
| AI-written prose can look correct while runtime/tests disagree | **yes** (directionally) | New Relic State of AI Coding 2026 (Tavily); DAPLab README-for-agents article; Help Net Security ReadSecBench (agents follow README instructions) | Good wow narrative; cite sources, don’t invent percentages in video |
| Dashboard metrics baseline 0.61 / GROUNDS 0.92 | **no** (retired) | Was mock in `grounds-data.ts` | **Replaced** by real eval 0.4083 → 0.8250 in `out/metrics.json` (2026-08-29) |
| GROUNDS beats one-shot baseline on 10 gold packs | **yes** | `out/metrics.json` + `out/EVAL_TABLE.md` after `baseline/run.py --all --mode llm` + `agent/run.py --all` + `eval/score.py` | Keep regenerating before submit |
| gpt-4o-mini price $0.15/1M in · $0.60/1M out | **partial** | Tavily answer 2026-08-30 | Used as default in `grounds_lib/llm.py`; override via env; re-check openai.com/api/pricing before submit |
| Cost + human-min fully metered in runners | **yes** | `grounds_lib/llm.py`, gate, eval | Live AgentRouter run 2026-08-30 |
| AgentRouter OpenAI-compatible base `https://agentrouter.org/v1` | **yes** | aftercut `KEYS_SETUP.md` + `agent-router.ts` | Used |
| Fresh eval baseline 0.1833 → GROUNDS 0.9083 | **yes** | `out/metrics.json` 2026-08-30 | Cost avg $0.000105 vs $0.000336 |
| “North Korea can’t hack / zero bugs” | **rejected** | Security doctrine | Never claim; document residual risk |

---

## Case pack fixtures (local)

| CLAIM | VERIFIED | SOURCES | ACTION |
|---|---|---|---|
| Ten gold cases `C-001`…`C-010` exist under `cases/` with INDEX | **yes** | `cases/INDEX.json`; `grounds_lib.cases.list_case_ids()` | Use for baseline/agent eval |
| ≥2 hard/adversarial packs | **yes** | `meta.hard` true on C-005, C-006 | Keep in measured table |
| C-001 README “all tests pass / no secrets” is false vs fixture | **yes** | `python -m pytest -q` exit 1; `config/sample.env` has `AKIAIOSFODNN7EXAMPLE` (labeled fixture) | Demo case for video |
| Fixture AWS/key strings are real secrets | **no** | Explicit FIXTURE / EXAMPLE placeholders only | Do not treat as live credentials |

---

## Tool reliability notes

- **Tavily** broad answer mixed stale prize splits and wrong eval language (“clarity, idea strength…”) — treat answers as leads, not law.
- **TinyFish** successfully walked HackerEarth tabs and returned verbatim prize/submission/timeline quotes (run `6fb069ca-…`).
- **Browser MCP** (`cursor-ide-browser`) unavailable this session — used WebFetch + TinyFish instead.
- **HackerEarth cached snippets** in some Tavily results still show Aug 28–30 / 1.3K regs — stale index vs live page.

---

## Keys / secrets

- User pasted Tavily + TinyFish keys in chat → treat as exposed → **rotate**.
- Never commit `.env` or keys into this repo or Lovable sync.
