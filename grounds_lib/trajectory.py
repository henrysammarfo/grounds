"""Trajectory JSONL writer (micro1-friendly)."""

from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class TrajectoryEvent:
    ts: float
    node: str
    kind: str
    detail: dict[str, Any] = field(default_factory=dict)


class TrajectoryLog:
    def __init__(self, case_id: str, agent_name: str) -> None:
        self.case_id = case_id
        self.agent_name = agent_name
        self.events: list[TrajectoryEvent] = []
        self._t0 = time.time()

    def add(self, node: str, kind: str, **detail: Any) -> None:
        self.events.append(
            TrajectoryEvent(ts=time.time() - self._t0, node=node, kind=kind, detail=detail)
        )

    def write(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", encoding="utf-8") as fh:
            fh.write(
                json.dumps(
                    {
                        "case_id": self.case_id,
                        "agent": self.agent_name,
                        "schema": "grounds.trajectory.v1",
                    }
                )
                + "\n"
            )
            for ev in self.events:
                fh.write(json.dumps(asdict(ev), ensure_ascii=False) + "\n")
