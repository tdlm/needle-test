#!/usr/bin/env node
/**
 * Test Needle HTTP service from outside Docker (Node 18+).
 *
 *   NEEDLE_BASE_URL=http://localhost:8888 node scripts/test_client.mjs
 */

const baseUrl = (process.env.NEEDLE_BASE_URL || "http://localhost:8888").replace(
  /\/$/,
  "",
);

const verbose = process.argv.includes("-v") || process.argv.includes("--verbose");

async function requestJson(method, path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  if (text) {
    data = JSON.parse(text);
  }
  return { status: res.status, data };
}

function check(name, ok, detail = "") {
  const mark = ok ? "PASS" : "FAIL";
  const suffix = detail ? ` — ${detail}` : "";
  console.log(`  [${mark}] ${name}${suffix}`);
  return ok;
}

let passed = 0;
let total = 0;

function runCheck(name, ok, detail, payload) {
  total += 1;
  if (check(name, ok, detail)) {
    passed += 1;
  }
  if (verbose && payload !== undefined) {
    console.log(JSON.stringify(payload, null, 2));
    console.log();
  }
}

console.log(`Needle client → ${baseUrl}\n`);

const health = await requestJson("GET", "/health");
runCheck(
  "GET /health",
  health.status === 200 &&
    health.data?.status === "ok" &&
    health.data?.warmed === true,
  `HTTP ${health.status}`,
  health.data,
);

const tools = await requestJson("GET", "/tools");
const toolCount = Array.isArray(tools.data?.tools) ? tools.data.tools.length : 0;
runCheck(
  "GET /tools",
  tools.status === 200 && toolCount >= 3,
  `${toolCount} tools`,
  tools.data,
);

const run = await requestJson("POST", "/run", {
  query: "what is the weather in Lagos?",
});
const runOk =
  run.status === 200 &&
  Array.isArray(run.data?.results) &&
  run.data.results[0]?.city === "Lagos";
runCheck("POST /run", runOk, "expected Lagos weather in results", run.data);

const complete = await requestJson("POST", "/complete", {
  text: "set thermostat to 21 cool",
});
const completeOk =
  complete.status === 200 &&
  complete.data?.function_calls?.[0]?.name === "set_thermostat";
runCheck(
  "POST /complete (server tools)",
  completeOk,
  "expected set_thermostat call",
  complete.data,
);

const completeCustom = await requestJson("POST", "/complete", {
  text: "turn on the kitchen lights",
  tools: [
    {
      name: "set_lights",
      description: "Turn room lights on or off",
      parameters: {
        type: "object",
        properties: {
          room: { type: "string" },
          on: { type: "boolean" },
        },
        required: ["room", "on"],
      },
    },
  ],
});
const customOk =
  completeCustom.status === 200 &&
  completeCustom.data?.function_calls?.[0]?.name === "set_lights";
runCheck(
  "POST /complete (client tools)",
  customOk,
  "expected set_lights call",
  completeCustom.data,
);

const extract = await requestJson("POST", "/extract", {
  text: "Invoice from Acme Corp total 1200 USD",
  schema: {
    type: "object",
    properties: {
      vendor: { type: "string" },
      total: { type: "number" },
    },
    required: ["vendor", "total"],
  },
});
const extractOk =
  extract.status === 200 && extract.data?.result?.vendor === "Acme Corp";
runCheck(
  "POST /extract",
  extractOk,
  "expected Acme Corp invoice",
  extract.data,
);

console.log(`\n${passed}/${total} checks passed`);
process.exit(passed === total ? 0 : 1);
