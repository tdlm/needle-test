# Agent instructions

## Git commit conventions

This repository uses [Conventional Commits](https://www.conventionalcommits.org/) without ticket references unless a change is explicitly tied to an issue.

### Header

```text
<type>(<scope>): <short description>
```

- **Imperative mood**, lowercase start after the colon (e.g. `add`, not `added`).
- Use `!` before the colon and a `BREAKING CHANGE:` footer when consumers must react.

### Types

| Type | Use for |
|------|---------|
| `feat` | User-visible behavior (API, client UI, new endpoints) |
| `fix` | Bug fixes |
| `docs` | README, AGENTS.md, usage docs only |
| `test` | Test scripts and assertions (no production logic) |
| `build` | Docker, dependencies, image build |
| `chore` | Makefile, tooling, repo maintenance |
| `refactor` | Internal restructure, same behavior |
| `perf` | Performance-only changes |

Prefer a specific type over `chore` when one applies.

### Scopes

Optional, lowercase. Common scopes in this repo:

- `docker` — `Dockerfile`, `docker-compose.yml`, container runtime
- `api` — `app/` FastAPI and Needle integration
- `client` — `client/` static tester and usage docs
- `make` — `Makefile` targets

Omit scope when a change spans several areas.

### Body

Include a body for anything non-trivial. Use short prose or bullets; explain **why**, not a file list the diff already shows.

```text
feat(api): add FastAPI HTTP endpoints

Expose health, tool listing, agent run, completion, and extraction
routes with Pydantic request models.
```

Skip the body when the subject fully describes a one-line change.

### Tickets

No ticket format is required. Add `Refs #123` or similar in the footer only when the work is tracked in an issue.

### Do not include

- `Co-Authored-By` or AI tool attribution lines
- Process notes (`split from previous commit`, `fixup`, etc.)

### Pre-commit

No commitlint or pre-commit hooks are configured. Match the style of recent history on `main`.
