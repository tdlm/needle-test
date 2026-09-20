#!/usr/bin/env python3
"""Run Needle HTTP checks against a running service (host or remote)."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request


def request_json(
    base_url: str,
    method: str,
    path: str,
    body: dict | None = None,
    timeout: float = 120.0,
) -> tuple[int, object]:
    url = f"{base_url.rstrip('/')}{path}"
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            payload = resp.read().decode("utf-8")
            return resp.status, json.loads(payload) if payload else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(detail)
        except json.JSONDecodeError:
            parsed = detail
        return exc.code, parsed


def check(name: str, ok: bool, detail: str = "") -> bool:
    mark = "PASS" if ok else "FAIL"
    line = f"  [{mark}] {name}"
    if detail:
        line = f"{line} — {detail}"
    print(line)
    return ok


def main() -> int:
    parser = argparse.ArgumentParser(description="Test Needle HTTP service from outside Docker.")
    parser.add_argument(
        "--base-url",
        default=os.environ.get("NEEDLE_BASE_URL", "http://localhost:8888"),
        help="Service root URL (env: NEEDLE_BASE_URL)",
    )
    parser.add_argument("--verbose", "-v", action="store_true", help="Print full JSON responses")
    args = parser.parse_args()
    base = args.base_url

    print(f"Needle client → {base}\n")
    passed = 0
    total = 0

    def run_check(name: str, ok: bool, detail: str = "", payload: object | None = None) -> None:
        nonlocal passed, total
        total += 1
        if check(name, ok, detail):
            passed += 1
        if args.verbose and payload is not None:
            print(json.dumps(payload, indent=2))
            print()

    status, health = request_json(base, "GET", "/health")
    run_check(
        "GET /health",
        status == 200
        and isinstance(health, dict)
        and health.get("status") == "ok"
        and health.get("warmed") is True,
        f"HTTP {status}",
        health,
    )

    status, tools_payload = request_json(base, "GET", "/tools")
    tool_count = 0
    if isinstance(tools_payload, dict) and isinstance(tools_payload.get("tools"), list):
        tool_count = len(tools_payload["tools"])
    run_check(
        "GET /tools",
        status == 200 and tool_count >= 3,
        f"{tool_count} tools",
        tools_payload,
    )

    status, run_body = request_json(
        base,
        "POST",
        "/run",
        {"query": "what is the weather in Lagos?"},
    )
    results_ok = False
    if isinstance(run_body, dict):
        results = run_body.get("results")
        if isinstance(results, list) and len(results) > 0:
            first = results[0]
            if isinstance(first, dict) and first.get("city") == "Lagos":
                results_ok = True
    run_check(
        "POST /run",
        status == 200 and results_ok,
        "expected Lagos weather in results",
        run_body,
    )

    status, complete_body = request_json(
        base,
        "POST",
        "/complete",
        {"text": "set thermostat to 21 cool"},
    )
    calls_ok = False
    if isinstance(complete_body, dict):
        calls = complete_body.get("function_calls")
        if isinstance(calls, list) and len(calls) > 0:
            first = calls[0]
            if (
                isinstance(first, dict)
                and first.get("name") == "set_thermostat"
                and isinstance(first.get("arguments"), dict)
            ):
                calls_ok = True
    run_check(
        "POST /complete (server tools)",
        status == 200 and calls_ok,
        "expected set_thermostat call",
        complete_body,
    )

    client_tools = [
        {
            "name": "set_lights",
            "description": "Turn room lights on or off",
            "parameters": {
                "type": "object",
                "properties": {
                    "room": {"type": "string"},
                    "on": {"type": "boolean"},
                },
                "required": ["room", "on"],
            },
        }
    ]
    status, complete_custom = request_json(
        base,
        "POST",
        "/complete",
        {"text": "turn on the kitchen lights", "tools": client_tools},
    )
    custom_ok = False
    if isinstance(complete_custom, dict):
        calls = complete_custom.get("function_calls")
        if isinstance(calls, list) and len(calls) > 0:
            first = calls[0]
            if isinstance(first, dict) and first.get("name") == "set_lights":
                custom_ok = True
    run_check(
        "POST /complete (client tools)",
        status == 200 and custom_ok,
        "expected set_lights call",
        complete_custom,
    )

    status, extract_body = request_json(
        base,
        "POST",
        "/extract",
        {
            "text": "Invoice from Acme Corp total 1200 USD",
            "schema": {
                "type": "object",
                "properties": {
                    "vendor": {"type": "string"},
                    "total": {"type": "number"},
                },
                "required": ["vendor", "total"],
            },
        },
    )
    extract_ok = False
    if isinstance(extract_body, dict):
        result = extract_body.get("result")
        if isinstance(result, dict) and result.get("vendor") == "Acme Corp":
            extract_ok = True
    run_check(
        "POST /extract",
        status == 200 and extract_ok,
        "expected Acme Corp invoice",
        extract_body,
    )

    print(f"\n{passed}/{total} checks passed")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
