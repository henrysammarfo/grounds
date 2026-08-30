# widget-cli

Tiny greeting CLI used as a GROUNDS fixture.

## Status

- **All unit tests pass** (`python -m pytest -q`).
- **No secrets** in this repository — credentials are never committed.

## API

```python
from widget_cli.greet import greet
greet("Ada")  # -> "Hello, Ada!"
```
