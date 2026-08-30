from widget_cli.greet import greet


def test_greet_returns_expected():
    # Intentional mismatch vs implementation (fixture for claim verification).
    assert greet("Ada") == "Hi, Ada!"
