"""Sandboxed repo tools: read, list, grep, run_tests with allowlist gating."""

from __future__ import annotations

import re
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class ToolResult:
    ok: bool
    name: str
    args: dict[str, Any]
    output: str
    exit_code: int | None = None
    elapsed_s: float = 0.0
    requires_approval: bool = False
    approval_reason: str = ""


@dataclass
class Sandbox:
    repo_dir: Path
    allow_network_install: bool = False
    pending_approvals: list[dict[str, Any]] = field(default_factory=list)
    finding_ids: list[str] = field(default_factory=list)

    def _resolve(self, rel: str) -> Path:
        target = (self.repo_dir / rel).resolve()
        root = self.repo_dir.resolve()
        if root not in target.parents and target != root:
            raise PermissionError(f"Path escapes sandbox: {rel}")
        return target

    def list_dir(self, rel: str = ".") -> ToolResult:
        t0 = time.perf_counter()
        path = self._resolve(rel)
        if not path.exists():
            return ToolResult(False, "list_dir", {"path": rel}, f"missing: {rel}", elapsed_s=time.perf_counter() - t0)
        entries = sorted(p.name + ("/" if p.is_dir() else "") for p in path.iterdir())
        out = "\n".join(entries) if entries else "(empty)"
        return ToolResult(True, "list_dir", {"path": rel}, out, 0, time.perf_counter() - t0)

    def list_files(self, glob_pat: str = "**/*", max_files: int = 80) -> ToolResult:
        t0 = time.perf_counter()
        paths = []
        root = self.repo_dir.resolve()
        for p in self.repo_dir.glob(glob_pat):
            if not p.is_file():
                continue
            try:
                resolved = p.resolve()
            except OSError:
                continue
            if root not in resolved.parents and resolved != root:
                continue
            rel = p.relative_to(self.repo_dir).as_posix()
            if any(part in {"__pycache__", ".git", "node_modules"} for part in p.parts):
                continue
            if "%" in rel or rel.startswith("$"):
                continue
            paths.append(rel)
            if len(paths) >= max_files:
                break
        paths.sort()
        return ToolResult(True, "list_files", {"glob": glob_pat}, "\n".join(paths) or "(empty)", 0, time.perf_counter() - t0)

    def read_file(self, rel: str, max_bytes: int = 80_000) -> ToolResult:
        t0 = time.perf_counter()
        path = self._resolve(rel)
        if not path.is_file():
            return ToolResult(False, "read_file", {"path": rel}, f"not a file: {rel}", elapsed_s=time.perf_counter() - t0)
        data = path.read_bytes()[:max_bytes]
        text = data.decode("utf-8", errors="replace")
        return ToolResult(True, "read_file", {"path": rel}, text, 0, time.perf_counter() - t0)

    def grep(self, pattern: str, rel: str = ".", max_hits: int = 40) -> ToolResult:
        t0 = time.perf_counter()
        root = self._resolve(rel)
        rx = re.compile(pattern)
        hits: list[str] = []
        files = [root] if root.is_file() else list(root.rglob("*"))
        for path in files:
            if not path.is_file():
                continue
            if path.suffix in {".pyc", ".png", ".jpg", ".gif", ".webp", ".ico"}:
                continue
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            for i, line in enumerate(text.splitlines(), 1):
                if rx.search(line):
                    rel_path = path.relative_to(self.repo_dir).as_posix()
                    hits.append(f"{rel_path}:{i}:{line.strip()}")
                    if len(hits) >= max_hits:
                        break
            if len(hits) >= max_hits:
                break
        out = "\n".join(hits) if hits else "(no matches)"
        return ToolResult(True, "grep", {"pattern": pattern, "path": rel}, out, 0, time.perf_counter() - t0)

    def run_tests(self, cmd: str | None) -> ToolResult:
        t0 = time.perf_counter()
        if not cmd:
            return ToolResult(
                True,
                "run_tests",
                {"cmd": None},
                "no test_cmd configured for this case",
                0,
                time.perf_counter() - t0,
            )
        # Network/install beyond allowlist requires human approval
        lowered = cmd.lower()
        if any(x in lowered for x in ("pip install", "npm install", "curl ", "wget ")):
            if not self.allow_network_install:
                reason = f"Command requires human approval (network/install): {cmd}"
                self.pending_approvals.append({"cmd": cmd, "reason": reason})
                return ToolResult(
                    False,
                    "run_tests",
                    {"cmd": cmd},
                    reason,
                    None,
                    time.perf_counter() - t0,
                    requires_approval=True,
                    approval_reason=reason,
                )
        try:
            import os

            env = os.environ.copy()
            env["PYTHONPATH"] = str(self.repo_dir)
            proc = subprocess.run(
                cmd,
                shell=True,
                cwd=str(self.repo_dir),
                capture_output=True,
                text=True,
                timeout=120,
                env=env,
            )
            out = (proc.stdout or "") + (proc.stderr or "")
            return ToolResult(
                proc.returncode == 0,
                "run_tests",
                {"cmd": cmd},
                out[-12000:],
                proc.returncode,
                time.perf_counter() - t0,
            )
        except subprocess.TimeoutExpired:
            return ToolResult(False, "run_tests", {"cmd": cmd}, "timeout after 120s", 124, time.perf_counter() - t0)
        except OSError as exc:
            return ToolResult(False, "run_tests", {"cmd": cmd}, str(exc), 1, time.perf_counter() - t0)
