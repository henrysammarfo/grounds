"""GROUNDS agent — LangGraph StateGraph with tools, verify, human gate, cost metering."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, TypedDict

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from grounds_lib import ensure_out
from grounds_lib.cases import list_case_ids, load_case
from grounds_lib.gate import HumanMeter, resolve_gate
from grounds_lib.llm import UsageMeter
from grounds_lib.sandbox import Sandbox
from grounds_lib.trajectory import TrajectoryLog
from grounds_lib.verify import collect_evidence, evidence_report, verify_labels


class AgentState(TypedDict, total=False):
    case_id: str
    auto_approve: bool
    labels: dict[str, str]
    evidence: list[dict[str, Any]]
    findings: list[dict[str, Any]]
    gate: list[dict[str, Any]]
    error: str


def _build_graph(meter: UsageMeter, human: HumanMeter):
    from langgraph.graph import END, START, StateGraph

    def plan_node(state: AgentState) -> AgentState:
        return state

    def gather_node(state: AgentState) -> AgentState:
        bundle = load_case(state["case_id"])
        sandbox = Sandbox(bundle.repo_dir)
        if state.get("auto_approve"):
            sandbox.allow_network_install = True
        cells, results, findings = collect_evidence(
            sandbox, bundle.claims, bundle.meta.test_cmd
        )
        labels = verify_labels(bundle.claims, cells, meter=meter)
        return {
            **state,
            "labels": {k: str(v) for k, v in labels.items()},
            "evidence": evidence_report(cells, labels),
            "findings": [
                {
                    "id": f.id,
                    "kind": f.kind,
                    "summary": f.summary,
                    "claim_ids": f.claim_ids,
                }
                for f in findings
            ],
            "gate": list(sandbox.pending_approvals),
            "_tool_results": [
                {
                    "name": r.name,
                    "ok": r.ok,
                    "args": r.args,
                    "exit_code": r.exit_code,
                    "elapsed_s": r.elapsed_s,
                    "output_tail": (r.output or "")[-2000:],
                    "requires_approval": r.requires_approval,
                }
                for r in results
            ],
            "_memory_findings": list(sandbox.finding_ids),
        }

    def verify_node(state: AgentState) -> AgentState:
        evidence = state.get("evidence") or []
        labels = dict(state.get("labels") or {})
        for row in evidence:
            if not row.get("sources"):
                labels[row["claim_id"]] = "partial"
        return {**state, "labels": labels}

    def gate_node(state: AgentState) -> AgentState:
        pending = state.get("gate") or []
        resolved = resolve_gate(
            pending,
            auto_approve=bool(state.get("auto_approve")),
            human=human,
        )
        return {**state, "gate": resolved}

    def report_node(state: AgentState) -> AgentState:
        return state

    g = StateGraph(AgentState)
    g.add_node("plan", plan_node)
    g.add_node("gather", gather_node)
    g.add_node("verify", verify_node)
    g.add_node("gate", gate_node)
    g.add_node("report", report_node)
    g.add_edge(START, "plan")
    g.add_edge("plan", "gather")
    g.add_edge("gather", "verify")
    g.add_edge("verify", "gate")
    g.add_edge("gate", "report")
    g.add_edge("report", END)
    return g.compile()


def run_case(case_id: str, auto_approve: bool = False) -> dict[str, Any]:
    t0 = time.perf_counter()
    meter = UsageMeter()
    human = HumanMeter()
    bundle = load_case(case_id)
    traj = TrajectoryLog(case_id, "grounds-agent")
    traj.add(
        "plan",
        "instruction",
        text="Verify each claim with tools; verify node re-derives labels from evidence; human gate before installs.",
        claims=[{"id": c.id, "text": c.text} for c in bundle.claims],
    )

    graph = _build_graph(meter, human)
    final: AgentState = graph.invoke({"case_id": case_id, "auto_approve": auto_approve})
    elapsed = time.perf_counter() - t0

    tool_results = final.get("_tool_results") or []  # type: ignore[arg-type]
    for tr in tool_results:
        traj.add(
            "tool",
            tr.get("name", "tool"),
            args=tr.get("args"),
            ok=tr.get("ok"),
            exit_code=tr.get("exit_code"),
            elapsed_s=tr.get("elapsed_s"),
            output_tail=tr.get("output_tail"),
            requires_approval=tr.get("requires_approval"),
        )

    traj.add("memory", "findings", ids=final.get("_memory_findings") or [])
    traj.add(
        "verify",
        "labels",
        labels=final.get("labels"),
        evidence=final.get("evidence"),
        usage=meter.to_dict(),
    )
    for g in final.get("gate") or []:
        traj.add("gate", "human_checkpoint", **g)
    traj.add(
        "report",
        "complete",
        wall_s=elapsed,
        usage=meter.to_dict(),
        human=human.to_dict(),
    )

    out_dir = ensure_out() / "agent" / case_id
    out_dir.mkdir(parents=True, exist_ok=True)
    report = {
        "case_id": case_id,
        "agent": "grounds-langgraph",
        "predictions": [
            {"claim_id": k, "label": v} for k, v in (final.get("labels") or {}).items()
        ],
        "evidence": final.get("evidence") or [],
        "findings": final.get("findings") or [],
        "gate": final.get("gate") or [],
        "meta": bundle.meta.model_dump(),
        "timing": {
            "wall_seconds": round(elapsed, 3),
            "human_minutes": human.human_minutes,
            "human_wait_seconds": round(human.wait_seconds, 3),
            "note": (
                "human_minutes = interactive gate wait only. "
                "Set GROUNDS_INTERACTIVE_GATE=1 to time approvals; "
                "unattended default is deny at 0 human minutes."
            ),
        },
        "usage": meter.to_dict(),
    }
    (out_dir / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    traj.write(out_dir / "trajectory.jsonl")
    return report


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="GROUNDS LangGraph claim verifier")
    parser.add_argument("--case", action="append", dest="cases")
    parser.add_argument("--all", action="store_true")
    parser.add_argument(
        "--auto-approve",
        action="store_true",
        help="Approve allowlist-exceeding actions (CI only)",
    )
    args = parser.parse_args(argv)

    ids = list_case_ids() if args.all or not args.cases else args.cases
    reports = []
    for cid in ids:
        print(f"agent {cid} ...")
        reports.append(run_case(cid, auto_approve=args.auto_approve))
    summary = ensure_out() / "agent" / "summary.json"
    summary.write_text(json.dumps(reports, indent=2), encoding="utf-8")
    total_cost = sum((r.get("usage") or {}).get("cost_usd") or 0 for r in reports)
    total_human = sum((r.get("timing") or {}).get("human_minutes") or 0 for r in reports)
    print(
        f"Wrote {summary} ({len(reports)} cases, "
        f"cost_usd={total_cost:.6f}, human_min={total_human:.4f})"
    )


if __name__ == "__main__":
    if os.environ.get("GROUNDS_INTERRUPT_GATE") == "1":
        print("GROUNDS_INTERRUPT_GATE noted — prefer GROUNDS_INTERACTIVE_GATE=1")
    main()
