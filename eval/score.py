"""Score baseline vs agent against gold labels; emit metrics for UI + REPRO."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from grounds_lib import ensure_out
from grounds_lib.cases import list_case_ids, load_case


def accuracy(pred: dict[str, str], gold: dict[str, str]) -> float:
    if not gold:
        return 0.0
    hits = sum(1 for k, v in gold.items() if pred.get(k) == v)
    return hits / len(gold)


def load_json(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def load_preds(data: dict[str, Any]) -> dict[str, str]:
    rows = data.get("predictions") or []
    return {r["claim_id"]: r["label"] for r in rows}


def avg(xs: list[float]) -> float | None:
    return round(sum(xs) / len(xs), 6) if xs else None


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="GROUNDS eval scorer")
    parser.add_argument("--all", action="store_true", default=True)
    args = parser.parse_args(argv)

    out = ensure_out()
    rows = []
    base_scores: list[float] = []
    agent_scores: list[float] = []
    base_costs: list[float] = []
    agent_costs: list[float] = []
    base_human: list[float] = []
    agent_human: list[float] = []
    base_wall: list[float] = []
    agent_wall: list[float] = []

    for cid in list_case_ids():
        bundle = load_case(cid)
        gold = {g.id: g.label for g in bundle.gold}
        bdata = load_json(out / "baseline" / cid / "predictions.json")
        adata = load_json(out / "agent" / cid / "report.json")
        bpred = load_preds(bdata)
        apred = load_preds(adata)
        bacc = accuracy(bpred, gold) if bpred else None
        aacc = accuracy(apred, gold) if apred else None
        bcost = float((bdata.get("usage") or {}).get("cost_usd") or 0)
        acost = float((adata.get("usage") or {}).get("cost_usd") or 0)
        bhum = float((bdata.get("timing") or {}).get("human_minutes") or 0)
        ahum = float((adata.get("timing") or {}).get("human_minutes") or 0)
        bwall = float((bdata.get("timing") or {}).get("wall_seconds") or 0)
        awall = float((adata.get("timing") or {}).get("wall_seconds") or 0)
        if bacc is not None:
            base_scores.append(bacc)
            base_costs.append(bcost)
            base_human.append(bhum)
            base_wall.append(bwall)
        if aacc is not None:
            agent_scores.append(aacc)
            agent_costs.append(acost)
            agent_human.append(ahum)
            agent_wall.append(awall)
        rows.append(
            {
                "case_id": cid,
                "hard": bundle.meta.hard,
                "title": bundle.meta.title,
                "gold": gold,
                "baseline": bpred,
                "agent": apred,
                "baseline_accuracy": bacc,
                "agent_accuracy": aacc,
                "baseline_cost_usd": bcost,
                "agent_cost_usd": acost,
                "baseline_human_minutes": bhum,
                "agent_human_minutes": ahum,
                "baseline_wall_seconds": bwall,
                "agent_wall_seconds": awall,
            }
        )

    metrics = {
        "cases_run": len(rows),
        "adversarial_cases": sum(1 for r in rows if r["hard"]),
        "claim_accuracy": {
            "baseline": round(sum(base_scores) / len(base_scores), 4) if base_scores else None,
            "grounds": round(sum(agent_scores) / len(agent_scores), 4) if agent_scores else None,
        },
        "cost_usd_per_case": {
            "baseline": avg(base_costs),
            "grounds": avg(agent_costs),
            "baseline_total": round(sum(base_costs), 6) if base_costs else None,
            "grounds_total": round(sum(agent_costs), 6) if agent_costs else None,
        },
        "human_minutes_per_case": {
            "baseline": avg(base_human),
            "grounds": avg(agent_human),
            "note": (
                "Gate wait only. Baseline=0 (no gate). "
                "Agent=0 unless GROUNDS_INTERACTIVE_GATE=1 during run."
            ),
        },
        "wall_seconds_per_case": {
            "baseline": avg(base_wall),
            "grounds": avg(agent_wall),
        },
        "pricing": {
            "model_default": "gpt-4o-mini",
            "usd_per_1m_input": 0.15,
            "usd_per_1m_output": 0.60,
            "source": "Tavily live pass 2026-08-30 (OpenAI gpt-4o-mini rates); override via GROUNDS_PRICE_*",
        },
        "per_case": [
            {
                "name": r["case_id"],
                "baseline": None
                if r["baseline_accuracy"] is None
                else round(100 * r["baseline_accuracy"]),
                "grounds": None
                if r["agent_accuracy"] is None
                else round(100 * r["agent_accuracy"]),
                "hard": r["hard"],
                "baseline_cost_usd": r["baseline_cost_usd"],
                "agent_cost_usd": r["agent_cost_usd"],
                "baseline_human_minutes": r["baseline_human_minutes"],
                "agent_human_minutes": r["agent_human_minutes"],
            }
            for r in rows
        ],
    }

    (out / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    (out / "eval_table.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")

    lines = [
        "# Eval table",
        "",
        "| Case | Hard | Baseline acc | GROUNDS acc | Baseline $ | GROUNDS $ | Base human-min | Agent human-min |",
        "|---|---|---:|---:|---:|---:|---:|---:|",
    ]
    for r in rows:
        ba = "—" if r["baseline_accuracy"] is None else f"{r['baseline_accuracy']*100:.0f}%"
        aa = "—" if r["agent_accuracy"] is None else f"{r['agent_accuracy']*100:.0f}%"
        lines.append(
            f"| {r['case_id']} | {r['hard']} | {ba} | {aa} | "
            f"{r['baseline_cost_usd']:.6f} | {r['agent_cost_usd']:.6f} | "
            f"{r['baseline_human_minutes']:.4f} | {r['agent_human_minutes']:.4f} |"
        )
    ca = metrics["claim_accuracy"]
    cc = metrics["cost_usd_per_case"]
    hm = metrics["human_minutes_per_case"]
    lines += [
        "",
        f"**Macro claim accuracy** — baseline: `{ca['baseline']}` · GROUNDS: `{ca['grounds']}`",
        f"**Cost USD / case (avg)** — baseline: `{cc['baseline']}` · GROUNDS: `{cc['grounds']}`",
        f"**Human min / case (avg, gate wait)** — baseline: `{hm['baseline']}` · GROUNDS: `{hm['grounds']}`",
        "",
    ]
    (out / "EVAL_TABLE.md").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
