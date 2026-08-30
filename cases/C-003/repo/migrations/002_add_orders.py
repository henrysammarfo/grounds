"""Add orders table."""


def up(conn):
    conn.execute(
        "CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL)"
    )


def down(conn):
    raise NotImplementedError("rollback for 002_add_orders not implemented")
