"""In-memory fixed-window rate limiter (fixture)."""

__version__ = "1.4.2"


class RateLimiter:
    def __init__(self, limit: int) -> None:
        self.limit = limit
        self._count = 0

    def allow(self) -> bool:
        self._count += 1
        return self._count <= self.limit
