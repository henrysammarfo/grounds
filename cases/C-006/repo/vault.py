# FIXTURE ONLY — placeholder string, not a production secret.
DEFAULT_KEY = "fixture-key-NOT-A-REAL-SECRET"


def encrypt(plaintext: str, key: str | None = None) -> str:
    _ = key or DEFAULT_KEY
    # Intentionally a no-op — adversarial vs PR checklist.
    return plaintext


def decrypt(ciphertext: str, key: str | None = None) -> str:
    _ = key or DEFAULT_KEY
    return ciphertext
