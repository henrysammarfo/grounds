"""LLM client + token/cost metering (OpenAI or AgentRouter-compatible)."""

from __future__ import annotations

import os
from dataclasses import asdict, dataclass, field
from typing import Any

from grounds_lib import load_dotenv_files

# Default OpenAI-native pricing for cost estimates when usage is returned.
# AgentRouter may bill differently — override GROUNDS_PRICE_* if needed.
DEFAULT_MODEL = "gpt-4o-mini"
DEFAULT_ROUTER_MODEL = "gpt-5.6-sol"
DEFAULT_IN_PER_M = 0.15
DEFAULT_OUT_PER_M = 0.60


@dataclass
class UsageEvent:
    model: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0
    provider: str = "openai"
    purpose: str = ""


@dataclass
class UsageMeter:
    events: list[UsageEvent] = field(default_factory=list)

    def add(self, event: UsageEvent) -> None:
        self.events.append(event)

    @property
    def prompt_tokens(self) -> int:
        return sum(e.prompt_tokens for e in self.events)

    @property
    def completion_tokens(self) -> int:
        return sum(e.completion_tokens for e in self.events)

    @property
    def total_tokens(self) -> int:
        return sum(e.total_tokens or (e.prompt_tokens + e.completion_tokens) for e in self.events)

    @property
    def cost_usd(self) -> float:
        return round(sum(e.cost_usd for e in self.events), 6)

    def to_dict(self) -> dict[str, Any]:
        return {
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "cost_usd": self.cost_usd,
            "calls": len(self.events),
            "events": [asdict(e) for e in self.events],
        }


def _prices() -> tuple[float, float]:
    load_dotenv_files()
    inp = float(os.environ.get("GROUNDS_PRICE_IN_PER_M", DEFAULT_IN_PER_M))
    out = float(os.environ.get("GROUNDS_PRICE_OUT_PER_M", DEFAULT_OUT_PER_M))
    return inp, out


def estimate_cost_usd(prompt_tokens: int, completion_tokens: int) -> float:
    inp, out = _prices()
    return round((prompt_tokens / 1_000_000) * inp + (completion_tokens / 1_000_000) * out, 8)


def _agentrouter_headers(key: str) -> dict[str, str]:
    """Claude Code wire-image headers required by AgentRouter WAF (aftercut pattern)."""
    return {
        "User-Agent": "claude-cli/2.1.158 (external, sdk-cli)",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": (
            "claude-code-20250219,interleaved-thinking-2025-05-14,"
            "effort-2025-11-24,oauth-2025-04-20"
        ),
        "anthropic-dangerous-direct-browser-access": "true",
        "x-app": "cli",
        "x-stainless-lang": "python",
        "x-stainless-package-version": "1.40.0",
        "x-stainless-os": "Windows",
        "x-stainless-arch": "x64",
        "x-stainless-runtime": "python",
    }


def resolve_llm_config() -> dict[str, Any] | None:
    """Prefer AgentRouter (aftercut naming) if set, else OpenAI. Never logs secrets."""
    load_dotenv_files()
    router_key = (
        os.environ.get("AGENT_ROUTER_API_KEY")
        or os.environ.get("AGENTROUTER_API_KEY")
        or os.environ.get("ANTHROPIC_AUTH_TOKEN")
    )
    openai_key = os.environ.get("OPENAI_API_KEY")
    if router_key:
        base = (
            os.environ.get("AGENT_ROUTER_OPENAI_BASE")
            or os.environ.get("AGENTROUTER_BASE_URL")
            or os.environ.get("AGENT_ROUTER_BASE_URL")
            or os.environ.get("OPENAI_BASE_URL")
            or "https://agentrouter.org/v1"
        )
        model = (
            os.environ.get("GROUNDS_MODEL")
            or os.environ.get("AGENT_ROUTER_OPENAI_MODEL")
            or DEFAULT_ROUTER_MODEL
        )
        return {
            "api_key": router_key,
            "base_url": base.rstrip("/"),
            "provider": "agentrouter",
            "model": model,
            "default_headers": _agentrouter_headers(router_key),
        }
    if openai_key:
        base = os.environ.get("OPENAI_BASE_URL")
        cfg: dict[str, Any] = {
            "api_key": openai_key,
            "provider": "openai",
            "model": os.environ.get("GROUNDS_MODEL", DEFAULT_MODEL),
        }
        if base:
            cfg["base_url"] = base.rstrip("/")
        return cfg
    return None


def chat_json(
    messages: list[dict[str, str]],
    *,
    purpose: str,
    meter: UsageMeter | None = None,
    temperature: float = 0,
    response_json: bool = True,
) -> tuple[str | None, UsageEvent | None]:
    """Chat completion; returns (content, usage_event)."""
    cfg = resolve_llm_config()
    if not cfg:
        return None, None
    try:
        from openai import OpenAI
    except ImportError:
        return None, None

    kwargs: dict[str, Any] = {"api_key": cfg["api_key"]}
    if cfg.get("base_url"):
        kwargs["base_url"] = cfg["base_url"]
    if cfg.get("default_headers"):
        kwargs["default_headers"] = cfg["default_headers"]
    client = OpenAI(**kwargs)

    create_kwargs: dict[str, Any] = {
        "model": cfg["model"],
        "messages": messages,
        "temperature": temperature,
    }
    # Some router models reject response_format — try JSON mode, fall back once.
    if response_json:
        create_kwargs["response_format"] = {"type": "json_object"}

    try:
        resp = client.chat.completions.create(**create_kwargs)
    except Exception:
        if response_json:
            create_kwargs.pop("response_format", None)
            # Ask for JSON in the prompt path already; retry without format
            resp = client.chat.completions.create(**create_kwargs)
        else:
            raise

    content = resp.choices[0].message.content or ""
    usage = getattr(resp, "usage", None)
    pt = int(getattr(usage, "prompt_tokens", 0) or 0)
    ct = int(getattr(usage, "completion_tokens", 0) or 0)
    tt = int(getattr(usage, "total_tokens", 0) or (pt + ct))
    event = UsageEvent(
        model=str(cfg["model"]),
        prompt_tokens=pt,
        completion_tokens=ct,
        total_tokens=tt,
        cost_usd=estimate_cost_usd(pt, ct),
        provider=str(cfg["provider"]),
        purpose=purpose,
    )
    if meter is not None:
        meter.add(event)
    return content, event
