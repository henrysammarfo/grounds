# tiny-json-api

Strict JSON API with **schema validation** on every write.

- `POST /items` **rejects** bodies missing `name`
- Ships `openapi.yaml` (OpenAPI 3.1)
- `GET /health` → `{"status":"ok"}`
