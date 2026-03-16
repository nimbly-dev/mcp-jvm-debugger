# Building Your Own Synthesizer

This guide walks you through building a TS-side synthesizer for your framework. If you're here, you're probably adding support for a new framework — that's great, and this document should have everything you need.

## The Big Picture

A synthesizer takes mapping context and produces a **trigger recipe** that the orchestrator can actually execute. Think of it as answering one question:

> *"Given what I know about how this endpoint is mapped, can I confidently describe how to call it?"*

- **Yes?** Return `status: "recipe"` with a concrete, runnable trigger.
- **Not sure?** Return `status: "report"` with specific failure metadata so the next person (or tool) knows exactly what went wrong and what to try next.

That's it. Deterministic, honest, helpful.

---

## Getting Started

### 1. Copy the example

The easiest starting point is the included example package:

```
tools/synthesizers/tools-synthesizer-example
```

It's intentionally off by default and not registered anywhere — it's a low-friction template designed for exactly this use case.

### 2. Create your plugin

Put your real plugin here:

```
tools/synthesizers/tools-<framework>
```

For example:
- `tools-jaxrs`
- `tools-quarkus`

---

## Implementation Walkthrough

### Step 1 — Copy and rename

Copy the example package and update all the identifiers to reflect your framework.

### Step 2 — Implement `canHandle`

This is your plugin's contract with the rest of the system. Make it **specific to your framework** — don't cast a wide net. If `canHandle` is too broad, your plugin will accidentally intercept projects it doesn't understand.

### Step 3 — Build the synthesis logic

A good recipe output includes:
- `method` and `path`
- query/body templates
- `rationale` and `evidence` explaining *how* the route was derived

### Step 4 — Design your failure output

This is just as important as the happy path. When synthesis fails, your output should include:

| Field | Purpose |
|---|---|
| `reasonCode` | Specific, not generic |
| `failedStep` | Where exactly things broke down |
| `nextAction` | What to try next |
| `evidence[]` | Linked back to source/mapping facts |
| `attemptedStrategies[]` | What was actually tried |

A good failure payload saves the next person from having to reverse-engineer your context. Think of it as leaving a clear note.

### Step 5 — Stay API-compatible

Keep your plugin aligned with `SYNTHESIZER_PLUGIN_API_VERSION`. This keeps the ecosystem coherent as plugins evolve.

### Step 6 — Write tests first

Before wiring your plugin into the default registry, validate it through the full MCP flow using temporary local registry wiring for pre-merge checks:

```
probe_recipe_create → inspect recipe/report → probe-verified execution
```

Only after this path is stable should you add your plugin to `createDefaultSynthesizerRegistry`.

---

## Build & Validation

```bash
npm run lint
npm run typecheck
```

Note: `npm run typecheck` validates only files included by the root `tsconfig.json`. If your new plugin package is not included there yet, run a package-local typecheck as part of your pre-merge checks.

---

## Quality Bar

Before you ship, ask yourself:

- **Executable** — Can someone run the recipe without needing to fill in hidden assumptions?
- **Explainable** — Does the rationale/evidence make the synthesis reasoning clear?
- **Fail-closed** — Does uncertainty produce a useful report, not a fake success?

---

## Common Pitfalls

A few things that tend to catch people out:

- **Broad `canHandle`** — this quietly breaks other plugins by stealing their projects
- **Thin route proof** — returning a recipe without enough evidence to back it up
- **Generic failure codes** — `UNKNOWN_ERROR` doesn't help anyone
- **Transport logic in plugin domain** — keep concerns separate

---

## Done Checklist

- [ ] Plugin behaves deterministically across repeated runs
- [ ] `canHandle` is framework-specific and predictable
- [ ] Recipe output is executable and evidence-backed
- [ ] Failure output is specific and actionable
- [ ] Default registry behavior is unchanged until you explicitly wire it in