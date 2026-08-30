from vault import decrypt, encrypt


def test_encrypt_is_identity():
    assert encrypt("hello", key="k") == "hello"


def test_round_trip_identity():
    msg = "ascii-msg"
    assert decrypt(encrypt(msg, key="k"), key="k") == msg
