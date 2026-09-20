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

Interactive browser tester: `http://localhost:8888/client/` (send individual requests or **Run all checks**).

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

## curl examples

```bash
curl -s http://localhost:8888/health | jq

curl -s -X POST http://localhost:8888/run \
  -H "Content-Type: application/json" \
  -d '{"query":"what is the weather in Lagos?"}' | jq

curl -s -X POST http://localhost:8888/complete \
  -H "Content-Type: application/json" \
  -d '{
    "text": "turn on living room lights",
    "tools": [{
      "name": "set_lights",
      "description": "Turn room lights on or off",
      "parameters": {
        "type": "object",
        "properties": {
          "room": {"type": "string"},
          "on": {"type": "boolean"}
        },
        "required": ["room", "on"]
      }
    }]
  }' | jq

curl -s -X POST http://localhost:8888/extract \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Invoice from Acme Corp, total $1,200",
    "schema": {
      "type": "object",
      "properties": {
        "vendor": {"type": "string"},
        "total": {"type": "number"}
      },
      "required": ["vendor", "total"]
    }
  }' | jq
```

Plain JSON Schema objects are wrapped automatically. You can also pass a full tool dict with `name`, `description`, and `parameters`:

```bash
curl -s -X POST http://localhost:8888/extract \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Invoice from Acme Corp, total $1,200",
    "schema": {
      "name": "invoice",
      "description": "Invoice fields",
      "parameters": {
        "type": "object",
        "properties": {
          "vendor": {"type": "string"},
          "total": {"type": "number"}
        },
        "required": ["vendor", "total"]
      }
    }
  }' | jq
```

## JavaScript (fetch)

```javascript
const base = "http://localhost:8888";

const runRes = await fetch(`${base}/run`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "set thermostat to 20 heat" }),
});
console.log(await runRes.json());

const completeRes = await fetch(`${base}/complete`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "message Alice hello there" }),
});
console.log(await completeRes.json());
```

## Makefile

Run `make` or `make help` for targets: `build`, `start`, `stop`, `destroy`, `logs`, `restart`, `shell`, `test`, `test-client`.

## Notes

- The image bakes the Needle engine and `needle3` weights at build time (`needle fetch`, `needle download needle3`).
- Inference runs with a single uvicorn worker; the native engine is shared and serialized with an asyncio lock.
- On Apple Silicon, the image is `linux/arm64`. For x86 hosts, set `platform: linux/amd64` on the compose service and rebuild.
