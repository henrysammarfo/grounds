"""One-shot baseline: naive prose believer and optional LLM mode with cost metering."""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from grounds_lib import ensure_out
from grounds_lib.cases import ClaimLabel, list_case_ids, load_case
from grounds_lib.llm import UsageMeter, chat_json, resolve_llm_config
from grounds_lib.trajectory import TrajectoryLog


def naive_oneshot(claims_text: str, claim_texts: list[tuple[str, str]]) -> dict[str, ClaimLabel]:
    labels: dict[str, ClaimLabel] = {}
    blob = claims_text.lower()
    for cid, text in claim_texts:
        t = text.lower()
        if re.search(r"\b(partially|mostly|should|probably)\b", t):
            labels[cid] = "partial"
        elif re.search(r"\b(not|never|no |fail)\b", t) and "no secrets" not in t and "no network" not in t:
            labels[cid] = "partial"
        else:
            labels[cid] = "true" if blob else "partial"
    return labels


def llm_oneshot(
    claims: list[tuple[str, str]], docs: str, meter: UsageMeter
) -> dict[str, ClaimLabel] | None:
    claim_block = "\n".join(f"- {cid}: {text}" for cid, text in claims)
    prompt = (
        "You are given repository documentation text and a list of engineering claims.\n"
        "For each claim, answer ONLY with JSON object mapping claim id to one of: "
        '"true", "false", "partial". Do not use tools. Judge only from the text.\n\n'
        f"DOCUMENTATION:\n{docs[:12000]}\n\nCLAIMS:\n{claim_block}\n"
    )
    content, _event = chat_json(
        [{"role": "user", "content": prompt}],
        purpose="baseline_oneshot",
        meter=meter,
        response_json=True,
    )
    if not content:
        return None
    raw = json.loads(content)
    if len(raw) == 1 and isinstance(next(iter(raw.values())), dict):
        raw = next(iter(raw.values()))
    out: dict[str, ClaimLabel] = {}
    for cid, _ in claims:
        val = str(raw.get(cid, "partial")).lower()
        if val not in {"true", "false", "partial"}:
            val = "partial"
        out[cid] = val  # type: ignore[assignment]
    return out


def run_case(case_id: str, mode: str) -> dict:
    t0 = time.perf_counter()
    meter = UsageMeter()
    bundle = load_case(case_id)
    traj = TrajectoryLog(case_id, f"baseline:{mode}")
    traj.add("plan", "instruction", text="One-shot: are these claims true? No tools.")

    docs_parts: list[str] = []
    for name in ("README.md", "PR_BODY.md", "AGENT_SUMMARY.md"):
        p = bundle.repo_dir / name
        if p.is_file():
            docs_parts.append(f"===== {name} =====\n{p.read_text(encoding='utf-8')}")
    docs = "\n\n".join(docs_parts) or "(no docs)"
    traj.add("context", "docs_dump", chars=len(docs), files=len(docs_parts))

    pairs = [(c.id, c.text) for c in bundle.claims]
    labels: dict[str, ClaimLabel]
    used = mode
    cfg = resolve_llm_config()
    if mode == "llm":
        llm = llm_oneshot(pairs, docs, meter)
        if llm is None:
            labels = naive_oneshot(docs, pairs)
            used = "naive(fallback)"
            traj.add("model", "fallback", reason="LLM key missing or call failed")
        else:
            labels = llm
            traj.add(
                "model",
                cfg["provider"] if cfg else "openai",
                model=cfg["model"] if cfg else "gpt-4o-mini",
                usage=meter.to_dict(),
            )
    else:
        labels = naive_oneshot(docs, pairs)
        traj.add("model", "naive")

    elapsed = time.perf_counter() - t0
    predictions = [{"claim_id": cid, "label": lab} for cid, lab in labels.items()]
    traj.add("report", "predictions", predictions=predictions, usage=meter.to_dict())

    out_dir = ensure_out() / "baseline" / case_id
    out_dir.mkdir(parents=True, exist_ok=True)
    report = {
        "case_id": case_id,
        "mode": used,
        "predictions": predictions,
        "timing": {
            "wall_seconds": round(elapsed, 3),
            "human_minutes": 0.0,
            "note": "Baseline is fully automated (no human gate).",
        },
        "usage": meter.to_dict(),
    }
    (out_dir / "predictions.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    traj.write(out_dir / "trajectory.jsonl")
    return report


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="GROUNDS one-shot baseline")
    parser.add_argument("--case", action="append", dest="cases", help="Case id (repeatable)")
    parser.add_argument("--all", action="store_true", help="Run all cases")
    parser.add_argument("--mode", choices=["naive", "llm"], default="llm")
    args = parser.parse_args(argv)

    ids = list_case_ids() if args.all or not args.cases else args.cases
    reports = [run_case(cid, args.mode) for cid in ids]
    summary_path = ensure_out() / "baseline" / "summary.json"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(reports, indent=2), encoding="utf-8")
    total_cost = sum((r.get("usage") or {}).get("cost_usd") or 0 for r in reports)
    print(
        f"Wrote {summary_path} ({len(reports)} cases, mode={args.mode}, "
        f"cost_usd={total_cost:.6f})"
    )


if __name__ == "__main__":
    main()
