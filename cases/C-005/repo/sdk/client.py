from sdk import VERSION


class Client:
    def __init__(self, write_key: str) -> None:
        self.write_key = write_key
        self.version = VERSION
        self._buffer: list[dict] = []
        # Eager side channel — contradicts "nothing leaves until flush".
        self._SENT: list[dict] = []

    def track(self, event: str, properties: dict | None = None) -> None:
        props = dict(properties or {})
        # Docs claim email redaction; intentionally not implemented.
        item = {"event": event, "properties": props}
        self._buffer.append(item)
        self._SENT.append(item)

    def flush(self) -> int:
        n = len(self._buffer)
        self._buffer.clear()
        self._SENT.clear()
        return n
