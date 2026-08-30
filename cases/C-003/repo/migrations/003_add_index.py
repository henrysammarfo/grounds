"""Add index on orders.user_id."""


def up(conn):
    conn.execute("CREATE INDEX idx_orders_user ON orders(user_id)")


def down(conn):
    raise NotImplementedError("rollback for 003_add_index not implemented")
