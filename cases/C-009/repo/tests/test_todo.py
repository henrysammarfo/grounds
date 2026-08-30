import pytest

from todo_cli import TASKS, add_task, main


def test_add_task_returns_length():
    TASKS.clear()
    assert add_task("buy milk") == 1
    assert add_task("ship") == 2


def test_main_empty_argv_exits_nonzero():
    with pytest.raises(SystemExit) as exc:
        main([])
    assert exc.value.code == 2
