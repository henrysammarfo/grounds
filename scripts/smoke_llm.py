from grounds_lib.llm import UsageMeter, chat_json, resolve_llm_config

c = resolve_llm_config()
print(
    "provider",
    c and c["provider"],
    "model",
    c and c["model"],
    "base",
    c and c.get("base_url"),
    "has_key",
    bool(c and c.get("api_key")),
)
m = UsageMeter()
text, _ev = chat_json(
    [{"role": "user", "content": 'Return JSON {"ok": true} only.'}],
    purpose="smoke",
    meter=m,
    response_json=True,
)
print("ok_content", bool(text))
print("usage", m.to_dict())
print("content_prefix", (text or "")[:120])
