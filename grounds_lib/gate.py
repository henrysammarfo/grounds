"""Human-gate stopwatch and interactive approval."""

from __future__ import annotations

import os
import time
from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class GateDecision:
    cmd: str
    reason: str
    decision: str  # approved | denied | denied_unattended | timeout
    wait_seconds: float = 0.0
    interactive: bool = False


@dataclass
class HumanMeter:
    decisions: list[GateDecision] = field(default_factory=list)

    @property
    def wait_seconds(self) -> float:
        return sum(d.wait_seconds for d in self.decisions)

    @property
    def human_minutes(self) -> float:
        return round(self.wait_seconds / 60.0, 4)

    def to_dict(self) -> dict[str, Any]:
        return {
            "human_minutes": self.human_minutes,
            "wait_seconds": round(self.wait_seconds, 3),
            "decisions": [asdict(d) for d in self.decisions],
        }


def interactive_gate_enabled() -> bool:
    return os.environ.get("GROUNDS_INTERACTIVE_GATE", "").strip() in {"1", "true", "yes"}


def resolve_gate(
    pending: list[dict[str, Any]],
    *,
    auto_approve: bool,
    human: HumanMeter,
) -> list[dict[str, Any]]:
    """Resolve pending approvals; time human wait when interactive."""
    out: list[dict[str, Any]] = []
    for item in pending:
        cmd = str(item.get("cmd") or "")
        reason = str(item.get("reason") or "")
        if auto_approve:
            d = GateDecision(cmd=cmd, reason=reason, decision="approved_auto", wait_seconds=0.0)
            human.decisions.append(d)
            out.append(asdict(d))
            continue
        if interactive_gate_enabled():
            print("\n=== GROUNDS HUMAN GATE ===")
            print(reason or cmd)
            print(f"Command: {cmd}")
            print("Approve? [y/N] (timed)")
            t0 = time.perf_counter()
            try:
                ans = input("> ").strip().lower()
            except EOFError:
                ans = "n"
            waited = time.perf_counter() - t0
            decision = "approved" if ans in {"y", "yes"} else "denied"
            d = GateDecision(
                cmd=cmd,
                reason=reason,
                decision=decision,
                wait_seconds=waited,
                interactive=True,
            )
            human.decisions.append(d)
            out.append(asdict(d))
            continue
        d = GateDecision(
            cmd=cmd,
            reason=reason,
            decision="denied_unattended",
            wait_seconds=0.0,
            interactive=False,
        )
        human.decisions.append(d)
        out.append(asdict(d))
    return out
