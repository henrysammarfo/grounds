"""Shared configuration and path helpers for GROUNDS contest runners."""

from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CASES_DIR = ROOT / "cases"
OUT_DIR = ROOT / "out"
DEFAULT_ALLOWLIST = (
    "read_file",
    "grep",
    "run_tests",
    "list_dir",
    "list_files",
)


def load_dotenv_files() -> None:
    """Load .env files into os.environ without overriding existing vars.

    Order: grounds/.env, then optional scoutbot agent/.env for local LLM keys.
    Never logs secret values.
    """
    candidates = [
        ROOT / ".env",
        Path(os.environ.get("GROUNDS_DOTENV_PATH", "")),
        ROOT.parent / "scoutbot" / "agent" / ".env",
    ]
    for path in candidates:
        if not path or not path.is_file():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val


def openai_api_key() -> str | None:
    """Back-compat: any configured LLM key (OpenAI or AgentRouter)."""
    from grounds_lib.llm import resolve_llm_config

    cfg = resolve_llm_config()
    return cfg["api_key"] if cfg else None


def ensure_out() -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    return OUT_DIR
