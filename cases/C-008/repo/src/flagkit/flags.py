FLAGS: dict[str, bool] = {
    "dark_mode": True,
}


def is_enabled(key: str) -> bool:
    return FLAGS.get(key, False)
