from rate_limiter import RateLimiter


def test_allow_under_limit():
    rl = RateLimiter(limit=3)
    assert rl.allow() is True
    assert rl.allow() is True
