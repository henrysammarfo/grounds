import pytest

from fetchy import DEFAULT_TIMEOUT, FakeTransport, fetch_url


def test_default_timeout_is_five():
    assert DEFAULT_TIMEOUT == 5


def test_success():
    t = FakeTransport(status=200, body="hello")
    assert fetch_url("http://example.test", t) == "hello"
    assert t.calls == 1


def test_failure_no_retry():
    t = FakeTransport(status=500, body="err")
    with pytest.raises(RuntimeError):
        fetch_url("http://example.test", t)
    assert t.calls == 1
