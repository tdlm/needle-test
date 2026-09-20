.DEFAULT_GOAL := help

-include .env
export APP_PORT ?= 8888

COMPOSE := docker compose

.PHONY: help build start stop destroy logs restart shell test test-client

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

build: ## Build the Docker image (creates .env from .env.example if missing)
	@test -f .env || cp .env.example .env
	$(COMPOSE) build

start: ## Start the service in the background
	@test -f .env || cp .env.example .env
	$(COMPOSE) up -d
	@echo "Needle service: http://localhost:$(APP_PORT)"

stop: ## Stop containers
	$(COMPOSE) down

destroy: ## Stop containers, remove volumes, and remove local images
	$(COMPOSE) down -v --rmi local

logs: ## Follow container logs
	$(COMPOSE) logs -f

restart: stop start ## Restart the service

shell: ## Open a shell in the running container
	$(COMPOSE) exec needle sh

test-client: ## Full external test suite (Python); NEEDLE_BASE_URL overrides host
	python3 scripts/test_client.py --base-url "http://localhost:$(APP_PORT)" $(if $(VERBOSE),-v,)

test: ## Smoke test /health, /run, /complete, and /extract
	@echo "GET /health"
	@curl -sf "http://localhost:$(APP_PORT)/health" | python3 -m json.tool
	@echo "\nPOST /run"
	@curl -sf -X POST "http://localhost:$(APP_PORT)/run" \
		-H "Content-Type: application/json" \
		-d '{"query":"what is the weather in Lagos?"}' | python3 -m json.tool
	@echo "\nPOST /complete"
	@curl -sf -X POST "http://localhost:$(APP_PORT)/complete" \
		-H "Content-Type: application/json" \
		-d '{"text":"set thermostat to 21 cool"}' | python3 -m json.tool
	@echo "\nPOST /extract"
	@curl -sf -X POST "http://localhost:$(APP_PORT)/extract" \
		-H "Content-Type: application/json" \
		-d '{"text":"Invoice from Acme Corp total 1200 USD","schema":{"type":"object","properties":{"vendor":{"type":"string"},"total":{"type":"number"}},"required":["vendor","total"]}}' | python3 -m json.tool
