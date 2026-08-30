"""Smoke tests for case loading and verify helpers."""

from __future__ import annotations

from grounds_lib.cases import list_case_ids, load_case
from grounds_lib.sandbox import Sandbox


def test_ten_cases_indexed():
    ids = list_case_ids()
    assert ids == [f"C-{i:03d}" for i in range(1, 11)]


def test_each_case_has_gold_alignment():
    for cid in list_case_ids():
        b = load_case(cid)
        claim_ids = {c.id for c in b.claims}
        gold_ids = {g.id for g in b.gold}
        assert claim_ids == gold_ids
        assert b.repo_dir.is_dir()


def test_sandbox_rejects_escape(tmp_path):
    s = Sandbox(tmp_path)
    (tmp_path / "ok.txt").write_text("x", encoding="utf-8")
    assert s.read_file("ok.txt").ok
    try:
        s.read_file("../outside.txt")
        assert False, "expected PermissionError"
    except PermissionError:
        pass
