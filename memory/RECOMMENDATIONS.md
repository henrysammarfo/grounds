# GROUNDS — Win recommendations (2026-08-29)

> Fact-backed. Not a guarantee of placement (~7.8K regs). Increases odds by matching the rubric judges actually score.

---

## Brutal truth

| Asset | Helps win? |
|---|---|
| Lovable marketing + dashboard | Weak for micro1 unless it demos real runs |
| Mock accuracy 0.61 → 0.92 | **Harms** if submitted as measured evidence |
| Real LangGraph agent + gold packs + trajectories + REPRO + video | **Required** to compete on Agent eng / Measured / Repro |

You currently have a strong **story and UI**. You do **not** yet have the **contest package**.

---

## What increases win chance (ordered)

1. **Ship the agent package first** — `cases/` (≥10 + ≥1 adversarial), `baseline/run.py`, `agent/` with explicit verify node, human gate, trajectory JSONL, `eval/score.py`.
2. **Fair measured delta** — identical claim packs for baseline vs GROUNDS; table with accuracy, human minutes, cost; one hard-case narrative.
3. **Repro in one clean env** — pin versions; one command chain; expected outputs; runtime/cost. Judges fail silent “works on my laptop.”
4. **Trajectories judges can read** — instructions → tool I/O → feedback → retries → human checkpoints (qualification gate includes **trace** checks — TinyFish).
5. **Improvement Changelog with a removed experiment** — PDF/page require it; your mock already names “self-critique rewrite loop” — recreate that honesty with **real** numbers.
6. **≤5 min video beat map** from bible §8 — visceral false-README catch.
7. **Do not clone PDF examples** as the product story (repo buy / hiring / podcast) — crowded homework look.
8. **Align with micro1’s business** — verification + trajectories they might buy ($2–$15/trace, not guaranteed) without making that the prize thesis.

---

## Bible corrections / updates

| Bible item | Recommendation |
|---|---|
| Deadline Aug 31 18:00 UTC | **Keep** — live page confirms |
| ~6.9K regs | Update to **~7.8K** (live) |
| Full rubric point weights | Keep PDF weights until page publishes points; TinyFish confirmed dimension names + tie-break |
| Winner $ amount | Say “$10k pool” unless Prizes tab quotes $5k; LinkedIn Camila says $5k winner (**partial**) |
| Suggested stack Python + LangGraph | **Keep** — named-friendly; matches Agent eng scoring |
| Marketing-first build | **Deprioritize** until contest core exists |

---

## Security (your note: not claiming unhackable)

Correct. Pitch: sandbox + allowlist + human gate + no secrets. Document residual risk (sandbox escapes, model jailbreaks, fixture leakage). Never “nation-state proof.”

---

## API keys needed for build

| Key | Needed for |
|---|---|
| `OPENAI_API_KEY` or Venice/Google LLM key | Baseline + agent LLM calls |
| `TAVILY_API_KEY` | Ongoing fact-check (have; **rotate** — pasted in chat) |
| `TINYFISH_API_KEY` | Page scrape fact-check (have; **rotate**) |
| Optional Google Cloud | Only if you choose Gemini path |

Confirm which LLM you want as default for contest runs so REPRO pins one provider.

---

## Decision needed from you

1. **Scaffold contest core in this `grounds` repo** (e.g. top-level `cases/`, `agent/`, …) **or** separate `grounds-agent` repo?  
2. **Freeze UI** and spend remaining hours on agent+eval+video? (Recommended: yes.)  
3. **Default LLM provider** for baseline/agent: OpenAI / Venice / Google?

Once you pick, next phase is BUILDING the contest package to production quality — not more dashboard chrome.
