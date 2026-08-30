"""Case loading and claim types."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

from grounds_lib import CASES_DIR

ClaimLabel = Literal["true", "false", "partial"]


class Claim(BaseModel):
    id: str
    text: str


class GoldClaim(BaseModel):
    id: str
    label: ClaimLabel
    rationale: str = ""


class CaseMeta(BaseModel):
    id: str
    title: str
    repo: str
    source: Literal["README", "PR", "Agent summary"]
    hard: bool = False
    test_cmd: str | None = "python -m pytest -q"
    notes: str = ""


class CaseBundle(BaseModel):
    meta: CaseMeta
    claims: list[Claim]
    gold: list[GoldClaim]
    root: Path = Field(exclude=True)

    @property
    def repo_dir(self) -> Path:
        return self.root / "repo"


def load_case(case_id: str) -> CaseBundle:
    root = CASES_DIR / case_id
    if not root.is_dir():
        raise FileNotFoundError(f"Unknown case: {case_id} ({root})")
    meta = CaseMeta.model_validate_json((root / "meta.json").read_text(encoding="utf-8"))
    claims_raw = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    gold_raw = json.loads((root / "gold.json").read_text(encoding="utf-8"))
    claims = [Claim.model_validate(c) for c in claims_raw]
    gold = [GoldClaim.model_validate(g) for g in gold_raw]
    return CaseBundle(meta=meta, claims=claims, gold=gold, root=root)


def list_case_ids() -> list[str]:
    index = CASES_DIR / "INDEX.json"
    if index.is_file():
        data = json.loads(index.read_text(encoding="utf-8"))
        return list(data["cases"])
    return sorted(p.name for p in CASES_DIR.iterdir() if p.is_dir() and p.name.startswith("C-"))
