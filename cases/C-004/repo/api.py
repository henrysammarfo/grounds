"""Minimal in-process API handlers (fixture)."""

_STORE: list[dict] = []


def health() -> dict:
    return {"status": "ok"}


def create_item(payload: dict) -> dict:
    # Intentionally permissive — contradicts README "strict validation".
    _STORE.append(payload)
    return payload
