"""Needle engine access: single-process lock, bounded agent cache, warmup."""

from __future__ import annotations

import asyncio
import hashlib
import json
from collections import OrderedDict
from typing import Any

import needle

from app.tools import SERVER_TOOLS

AGENT_CACHE_MAX_SIZE = 16

_engine_lock = asyncio.Lock()
_agent_cache: OrderedDict[str, needle.Needle] = OrderedDict()
_warmed = False


def _tools_fingerprint(tools: list[Any] | None) -> str:
    if tools is None:
        return "server"
    normalized = json.dumps(tools, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def _cache_key(tools: list[Any] | None, system: str | None) -> str:
    system_part = system or ""
    return f"{_tools_fingerprint(tools)}:{hashlib.sha256(system_part.encode('utf-8')).hexdigest()}"


def _get_or_create_agent(
    tools: list[Any] | None = None,
    system: str | None = None,
) -> needle.Needle:
    key = _cache_key(tools, system)
    if key in _agent_cache:
        _agent_cache.move_to_end(key)
        return _agent_cache[key]

    if tools is None:
        agent = needle.Needle(tools=SERVER_TOOLS, system=system)
    else:
        agent = needle.Needle(tools=tools, system=system)

    _agent_cache[key] = agent
    while len(_agent_cache) > AGENT_CACHE_MAX_SIZE:
        _agent_cache.popitem(last=False)

    return agent


def is_warmed() -> bool:
    return _warmed


async def warmup() -> None:
    global _warmed
    async with _engine_lock:
        _get_or_create_agent(tools=None, system=None)
        _warmed = True


async def run_query(
    query: str,
    system: str | None = None,
    max_steps: int = 8,
) -> dict[str, Any]:
    async with _engine_lock:
        agent = _get_or_create_agent(tools=None, system=system)
        return agent.run(query, max_steps=max_steps)


async def complete_text(
    text: str,
    tools: list[Any] | None = None,
    system: str | None = None,
    max_new_tokens: int = 512,
) -> dict[str, Any]:
    async with _engine_lock:
        agent = _get_or_create_agent(tools=tools, system=system)
        return agent.complete(text, max_new_tokens=max_new_tokens)


def normalize_extract_schema(schema: dict[str, Any]) -> dict[str, Any]:
    """Needle extract expects a tool dict; accept plain JSON Schema objects too."""
    if "parameters" in schema:
        return schema
    if schema.get("type") == "object":
        return {
            "name": "record",
            "description": "Extract structured fields from the input text.",
            "parameters": schema,
        }
    return schema


async def extract_fields(
    text: str,
    schema: dict[str, Any],
    system: str | None = None,
    max_new_tokens: int = 512,
) -> Any:
    needle_schema = normalize_extract_schema(schema)
    async with _engine_lock:

        def _extract() -> Any:
            return needle.extract(
                text,
                needle_schema,
                system=system,
                max_new_tokens=max_new_tokens,
            )

        return await asyncio.to_thread(_extract)
