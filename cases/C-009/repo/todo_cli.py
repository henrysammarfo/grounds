TASKS: list[str] = []


def add_task(title: str) -> int:
    TASKS.append(title)
    return len(TASKS)


def main(argv: list[str] | None = None) -> int:
    argv = list(argv or [])
    if not argv:
        # Contradicts CHANGELOG "exits 0".
        raise SystemExit(2)
    if argv[0] == "add":
        add_task(argv[1])
        return 0
    raise SystemExit(1)
