# pulse-telemetry

Production-grade analytics SDK (fixture docs — intentionally adversarial).

## Privacy

Every `track()` call **redacts PII** (emails, phone numbers) from properties before
anything is stored.

## Reliability

Events are **buffered locally only**. Nothing leaves the process until you call
`flush()`. Safe for air-gapped CI.

## API

```python
from sdk import Client
c = Client(write_key="pk_fixture_not_real")
c.track("signup", {"email": "a@b.co"})  # email stripped
n = c.flush()  # sends buffered events; returns count
```

Version: see `Client.version` (matches package `VERSION`).
