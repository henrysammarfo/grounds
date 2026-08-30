"""Initial schema."""


def up(conn):
    conn.execute(
        "CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL)"
    )


def down(conn):
    conn.execute("DROP TABLE users")
