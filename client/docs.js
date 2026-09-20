const LANGS = ["typescript", "javascript", "python", "php"];
const LANG_LABELS = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  php: "PHP",
};

const EXAMPLES = [
  {
    id: "health",
    title: "Health check",
    method: "GET",
    path: "/health",
    description: "Confirm the service is up and the model finished warming.",
  },
  {
    id: "tools",
    title: "List server tools",
    method: "GET",
    path: "/tools",
    description: "Discover JSON schemas for tools executed by POST /run.",
  },
  {
    id: "run",
    title: "Run agent (server tools)",
    method: "POST",
    path: "/run",
    description: "Needle selects tools, runs Python handlers, and returns results.",
  },
  {
    id: "complete-server",
    title: "Complete one turn (server tools)",
    method: "POST",
    path: "/complete",
    description: "Single inference turn without executing server functions.",
  },
  {
    id: "complete-client",
    title: "Complete one turn (client tools)",
    method: "POST",
    path: "/complete",
    description: "Pass your own tool JSON schemas in the request body.",
  },
  {
    id: "extract",
    title: "Structured extraction",
    method: "POST",
    path: "/extract",
    description: "Extract typed fields; plain JSON Schema objects are wrapped automatically.",
  },
];

function snippet(id, lang, base) {
  const b = base.replace(/\/$/, "");
  const snippets = {
    health: {
      typescript: `const base = "${b}";

const res = await fetch(\`\${base}/health\`);
if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
const data = (await res.json()) as { status: string; warmed: boolean };
console.log(data);`,
      javascript: `const base = "${b}";

const res = await fetch(\`\${base}/health\`);
if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
const data = await res.json();
console.log(data);`,
      python: `import json
import urllib.request

base = "${b}"

req = urllib.request.Request(f"{base}/health", method="GET")
with urllib.request.urlopen(req, timeout=120) as resp:
    data = json.loads(resp.read().decode("utf-8"))
print(data)`,
      php: `<?php
$base = '${b}';

$ch = curl_init("$base/health");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Accept: application/json'],
]);
$body = curl_exec($ch);
if ($body === false) {
    throw new RuntimeException(curl_error($ch));
}
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
if ($status !== 200) {
    throw new RuntimeException("HTTP $status");
}
$data = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
print_r($data);`,
    },
    tools: {
      typescript: `const base = "${b}";

const res = await fetch(\`\${base}/tools\`);
const data = (await res.json()) as { tools: Array<Record<string, unknown>> };
console.log(data.tools.map((t) => t.name));`,
      javascript: `const base = "${b}";

const res = await fetch(\`\${base}/tools\`);
const data = await res.json();
console.log(data.tools.map((t) => t.name));`,
      python: `import json
import urllib.request

base = "${b}"

req = urllib.request.Request(f"{base}/tools", method="GET")
with urllib.request.urlopen(req, timeout=120) as resp:
    data = json.loads(resp.read().decode("utf-8"))
print([t["name"] for t in data["tools"]])`,
      php: `<?php
$base = '${b}';

$ch = curl_init("$base/tools");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true]);
$body = curl_exec($ch);
curl_close($ch);
$data = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
print_r(array_column($data['tools'], 'name'));`,
    },
    run: {
      typescript: `const base = "${b}";

const res = await fetch(\`\${base}/run\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "what is the weather in Lagos?" }),
});
const data = await res.json();
console.log(data.results);`,
      javascript: `const base = "${b}";

const res = await fetch(\`\${base}/run\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "what is the weather in Lagos?" }),
});
const data = await res.json();
console.log(data.results);`,
      python: `import json
import urllib.request

base = "${b}"
payload = {"query": "what is the weather in Lagos?"}

req = urllib.request.Request(
    f"{base}/run",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(req, timeout=120) as resp:
    data = json.loads(resp.read().decode("utf-8"))
print(data.get("results"))`,
      php: `<?php
$base = '${b}';
$payload = json_encode(['query' => 'what is the weather in Lagos?'], JSON_THROW_ON_ERROR);

$ch = curl_init("$base/run");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => $payload,
]);
$body = curl_exec($ch);
curl_close($ch);
$data = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
print_r($data['results'] ?? null);`,
    },
    "complete-server": {
      typescript: `const base = "${b}";

const res = await fetch(\`\${base}/complete\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "set thermostat to 21 cool" }),
});
const data = await res.json();
console.log(data.function_calls);`,
      javascript: `const base = "${b}";

const res = await fetch(\`\${base}/complete\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "set thermostat to 21 cool" }),
});
const data = await res.json();
console.log(data.function_calls);`,
      python: `import json
import urllib.request

base = "${b}"
payload = {"text": "set thermostat to 21 cool"}

req = urllib.request.Request(
    f"{base}/complete",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(req, timeout=120) as resp:
    data = json.loads(resp.read().decode("utf-8"))
print(data.get("function_calls"))`,
      php: `<?php
$base = '${b}';
$payload = json_encode(['text' => 'set thermostat to 21 cool'], JSON_THROW_ON_ERROR);

$ch = curl_init("$base/complete");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => $payload,
]);
$body = curl_exec($ch);
curl_close($ch);
$data = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
print_r($data['function_calls'] ?? []);`,
    },
    "complete-client": {
      typescript: `const base = "${b}";

const tools = [
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
];

const res = await fetch(\`\${base}/complete\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "turn on the kitchen lights", tools }),
});
const data = await res.json();
console.log(data.function_calls);`,
      javascript: `const base = "${b}";

const tools = [
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
];

const res = await fetch(\`\${base}/complete\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "turn on the kitchen lights", tools }),
});
const data = await res.json();
console.log(data.function_calls);`,
      python: `import json
import urllib.request

base = "${b}"
payload = {
    "text": "turn on the kitchen lights",
    "tools": [
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
    ],
}

req = urllib.request.Request(
    f"{base}/complete",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(req, timeout=120) as resp:
    data = json.loads(resp.read().decode("utf-8"))
print(data.get("function_calls"))`,
      php: `<?php
$base = '${b}';
$payload = json_encode([
    'text' => 'turn on the kitchen lights',
    'tools' => [[
        'name' => 'set_lights',
        'description' => 'Turn room lights on or off',
        'parameters' => [
            'type' => 'object',
            'properties' => [
                'room' => ['type' => 'string'],
                'on' => ['type' => 'boolean'],
            ],
            'required' => ['room', 'on'],
        ],
    ]],
], JSON_THROW_ON_ERROR);

$ch = curl_init("$base/complete");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => $payload,
]);
$body = curl_exec($ch);
curl_close($ch);
$data = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
print_r($data['function_calls'] ?? []);`,
    },
    extract: {
      typescript: `const base = "${b}";

const res = await fetch(\`\${base}/extract\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "Invoice from Acme Corp total 1200 USD",
    schema: {
      type: "object",
      properties: {
        vendor: { type: "string" },
        total: { type: "number" },
      },
      required: ["vendor", "total"],
    },
  }),
});
const data = await res.json();
console.log(data.result);`,
      javascript: `const base = "${b}";

const res = await fetch(\`\${base}/extract\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "Invoice from Acme Corp total 1200 USD",
    schema: {
      type: "object",
      properties: {
        vendor: { type: "string" },
        total: { type: "number" },
      },
      required: ["vendor", "total"],
    },
  }),
});
const data = await res.json();
console.log(data.result);`,
      python: `import json
import urllib.request

base = "${b}"
payload = {
    "text": "Invoice from Acme Corp total 1200 USD",
    "schema": {
        "type": "object",
        "properties": {
            "vendor": {"type": "string"},
            "total": {"type": "number"},
        },
        "required": ["vendor", "total"],
    },
}

req = urllib.request.Request(
    f"{base}/extract",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(req, timeout=120) as resp:
    data = json.loads(resp.read().decode("utf-8"))
print(data.get("result"))`,
      php: `<?php
$base = '${b}';
$payload = json_encode([
    'text' => 'Invoice from Acme Corp total 1200 USD',
    'schema' => [
        'type' => 'object',
        'properties' => [
            'vendor' => ['type' => 'string'],
            'total' => ['type' => 'number'],
        ],
        'required' => ['vendor', 'total'],
    ],
], JSON_THROW_ON_ERROR);

$ch = curl_init("$base/extract");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => $payload,
]);
$body = curl_exec($ch);
curl_close($ch);
$data = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
print_r($data['result'] ?? null);`,
    },
  };
  return snippets[id][lang];
}

function getBaseUrl() {
  const input = document.getElementById("baseUrl");
  const value = input.value.trim();
  if (value) {
    return value.replace(/\/$/, "");
  }
  if (window.location.origin && window.location.origin !== "null") {
    return window.location.origin;
  }
  return "http://localhost:8888";
}

function renderLangTabs(activeLang) {
  const container = document.getElementById("langTabs");
  container.innerHTML = "";
  for (const lang of LANGS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = LANG_LABELS[lang];
    btn.dataset.lang = lang;
    if (lang === activeLang) {
      btn.classList.add("active");
    }
    btn.addEventListener("click", () => {
      localStorage.setItem("needle-docs-lang", lang);
      renderDocs(lang);
    });
    container.appendChild(btn);
  }
}

function renderDocs(lang) {
  const base = getBaseUrl();
  renderLangTabs(lang);
  const root = document.getElementById("examples");
  root.innerHTML = "";

  for (const ex of EXAMPLES) {
    const section = document.createElement("article");
    section.className = "example";
    section.id = ex.id;

    const methodClass = ex.method === "GET" ? "get" : "post";
    section.innerHTML = `
      <header>
        <h2><span class="method ${methodClass}">${ex.method}</span>${ex.path}</h2>
        <p>${ex.description}</p>
      </header>
      <div class="code-wrap">
        <button type="button" class="copy-btn">Copy</button>
        <pre><code></code></pre>
      </div>
    `;

    const code = snippet(ex.id, lang, base);
    section.querySelector("code").textContent = code;

    section.querySelector(".copy-btn").addEventListener("click", async () => {
      await navigator.clipboard.writeText(code);
      const btn = section.querySelector(".copy-btn");
      const prev = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(() => {
        btn.textContent = prev;
      }, 1200);
    });

    root.appendChild(section);
  }
}

function initDocs() {
  const baseInput = document.getElementById("baseUrl");
  if (window.location.origin && window.location.origin !== "null") {
    baseInput.placeholder = window.location.origin;
  } else {
    baseInput.placeholder = "http://localhost:8888";
  }

  const savedLang = localStorage.getItem("needle-docs-lang");
  const lang = LANGS.includes(savedLang) ? savedLang : "typescript";

  baseInput.addEventListener("change", () => renderDocs(lang));
  baseInput.addEventListener("blur", () => renderDocs(lang));

  renderDocs(lang);
}

document.addEventListener("DOMContentLoaded", initDocs);
