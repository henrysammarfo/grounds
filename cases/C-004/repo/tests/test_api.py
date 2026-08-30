from api import create_item, health


def test_health():
    assert health() == {"status": "ok"}


def test_create_accepts_partial_payload():
    # Documents actual behavior: missing name is accepted.
    result = create_item({"sku": "X"})
    assert result["sku"] == "X"
