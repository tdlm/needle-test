"""FastAPI HTTP wrapper for cactus-needle."""

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app import engine
from app.tools import SERVER_TOOLS


def _tool_schema(fn: Any) -> dict[str, Any]:
    schema = getattr(fn, "_needle_tool", None)
    if schema is None:
        raise ValueError(f"{fn!r} is not a needle tool")
    return schema


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await engine.warmup()
    yield


app = FastAPI(
    title="Needle HTTP Service",
    description="Dockerized cactus-needle: tool calling, completion, and extraction.",
    lifespan=lifespan,
)


class RunRequest(BaseModel):
    query: str
    system: str | None = None
    max_steps: int = Field(default=8, ge=1, le=32)


class CompleteRequest(BaseModel):
    text: str
    tools: list[dict[str, Any]] | None = None
    system: str | None = None
    max_new_tokens: int = Field(default=512, ge=1, le=2048)


class ExtractRequest(BaseModel):
    text: str
    schema: dict[str, Any]
    system: str | None = None
    max_new_tokens: int = Field(default=512, ge=1, le=2048)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "warmed": engine.is_warmed()}


@app.get("/tools")
async def list_tools() -> dict[str, Any]:
    return {"tools": [_tool_schema(fn) for fn in SERVER_TOOLS]}


@app.post("/run")
async def run_agent(body: RunRequest) -> dict[str, Any]:
    try:
        return await engine.run_query(
            query=body.query,
            system=body.system,
            max_steps=body.max_steps,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/complete")
async def complete(body: CompleteRequest) -> dict[str, Any]:
    try:
        return await engine.complete_text(
            text=body.text,
            tools=body.tools,
            system=body.system,
            max_new_tokens=body.max_new_tokens,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/extract")
async def extract(body: ExtractRequest) -> dict[str, Any]:
    try:
        result = await engine.extract_fields(
            text=body.text,
            schema=body.schema,
            system=body.system,
            max_new_tokens=body.max_new_tokens,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if result is None:
        return {"result": None}
    if hasattr(result, "model_dump"):
        return {"result": result.model_dump()}
    return {"result": result}
