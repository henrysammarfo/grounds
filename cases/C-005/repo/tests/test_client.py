from sdk import Client, VERSION


def test_version_matches():
    c = Client(write_key="pk_fixture_not_real")
    assert c.version == VERSION == "0.3.1"


def test_no_redaction():
    c = Client(write_key="pk_fixture_not_real")
    c.track("signup", {"email": "user@example.com"})
    assert c._buffer[0]["properties"]["email"] == "user@example.com"


def test_eager_sent_before_flush():
    c = Client(write_key="pk_fixture_not_real")
    c.track("ping", {})
    assert len(c._SENT) == 1
    assert len(c._buffer) == 1


def test_flush_returns_count():
    c = Client(write_key="pk_fixture_not_real")
    c.track("a", {})
    c.track("b", {})
    assert c.flush() == 2
    assert c._buffer == []
