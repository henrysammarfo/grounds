DEFAULT_TIMEOUT = 5
MAX_RETRIES = 3  # documented but unused — fixture trap


class FakeTransport:
    def __init__(self, status: int = 200, body: str = "ok") -> None:
        self.status = status
        self.body = body
        self.calls = 0

    def get(self, url: str, timeout: int) -> tuple[int, str]:
        self.calls += 1
        _ = (url, timeout)
        return self.status, self.body


def fetch_url(url: str, transport: FakeTransport, timeout: int | None = None) -> str:
    timeout = DEFAULT_TIMEOUT if timeout is None else timeout
    # No retry loop despite MAX_RETRIES / agent summary.
    status, body = transport.get(url, timeout=timeout)
    if status != 200:
        raise RuntimeError(f"HTTP {status}")
    return body
