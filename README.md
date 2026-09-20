# Needle HTTP Service

Dockerized [cactus-needle](https://github.com/cactus-compute/needle) API on port **8888** by default (configurable via `.env`).

## Quick start

```bash
make build
make start
make test
```

Configure the host port in [`.env`](.env) (copied from [`.env.example`](.env.example)):

```bash
APP_PORT=8888
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness and warmup status |
| `GET` | `/tools` | Server-side demo tool schemas |
| `POST` | `/run` | Agent loop with server tools (executes Python functions) |
| `POST` | `/complete` | Single turn; optional client `tools` JSON schemas |
| `POST` | `/extract` | Structured extraction from text |

OpenAPI docs: `http://localhost:8888/docs` (use your `APP_PORT` if changed).

**Usage examples** (switch TypeScript / JavaScript / Python / PHP): [`http://localhost:8888/client/docs.html`](http://localhost:8888/client/docs.html)

Interactive browser tester: [`http://localhost:8888/client/`](http://localhost:8888/client/) (send individual requests or **Run all checks**).

## Test from outside the container

After `make start`:

```bash
make test-client              # Python suite (6 assertions, exit 0/1)
python3 scripts/test_client.py -v --base-url http://localhost:8888

NEEDLE_BASE_URL=http://localhost:8888 node scripts/test_client.mjs
```

Point at any host (remote machine, different port):

```bash
NEEDLE_BASE_URL=http://192.168.1.10:8888 python3 scripts/test_client.py
```

Quick curl smoke test: `make test`.

## Client examples

All endpoints are documented with copy-paste snippets in four languages on the usage page:

| Resource | URL |
|----------|-----|
| Usage docs (TS / JS / Python / PHP) | `http://localhost:8888/client/docs.html` |
| Interactive tester | `http://localhost:8888/client/` |

Set **Base URL** on that page if the service is not on `localhost:8888`. Your language choice is remembered in the browser (`localStorage`).

Minimal curl sanity check:

```bash
curl -s http://localhost:8888/health | jq
```

## Makefile

Run `make` or `make help` for targets: `build`, `start`, `stop`, `destroy`, `logs`, `restart`, `shell`, `test`, `test-client`.

## Notes

- The image bakes the Needle engine and `needle3` weights at build time (`needle fetch`, `needle download needle3`).
- Inference runs with a single uvicorn worker; the native engine is shared and serialized with an asyncio lock.
- On Apple Silicon, the image is `linux/arm64`. For x86 hosts, set `platform: linux/amd64` on the compose service and rebuild.
