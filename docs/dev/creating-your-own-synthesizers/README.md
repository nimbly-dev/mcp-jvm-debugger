# Creating Your Own Synthesizers

This guide is for devs building TS-side recipe generation for a framework.

A synthesizer turns mapping and context into an orchestrator-usable trigger recipe.
It should be helpful, deterministic, and honest about uncertainty.

## What You Copy First

Start with:

- `tools/synthesizers/tools-synthesizer-example`

This package is default-off and not registered by default.
It is meant to be a low-friction starter for framework adoptors.

## Where Your Real Plugin Belongs

Create your real plugin here:

- `tools/synthesizers/tools-<framework>`

Examples:

- `tools-jaxrs`
- `tools-quarkus`

## Mental Model

The synthesizer answers:
"Given proven mapping context, can I generate a request recipe the orchestrator can execute safely?"

If yes:
return `status: "recipe"` with a concrete trigger.

If no:
return `status: "report"` with deterministic failure metadata and next action.

## Implementation Steps

1. Copy the example package and rename identifiers.
2. Implement strict `canHandle` for your framework.
3. Build synthesis logic that produces:
   - method
   - path
   - query/body templates
   - rationale/evidence
4. Add meaningful `attemptedStrategies` and `reasonCode` on failure.
5. Keep plugin API compatibility aligned with `SYNTHESIZER_PLUGIN_API_VERSION`.
6. Add tests before default registry wiring.

## Output Quality Bar

Your recipe output should be:

- executable:
  request details should be runnable without hidden assumptions.
- explainable:
  include concise rationale/evidence for how the route was synthesized.
- fail-closed:
  uncertainty produces a report, not fake success.

## Failure Design Guidance

Good failure payloads include:

- specific `reasonCode`
- precise `failedStep`
- actionable `nextAction`
- short `evidence[]` linked to source/mapping facts
- real `attemptedStrategies[]` reflecting what was tried

Bad failure payloads are generic and force humans to reverse engineer context.

## Build And Validation

Run lint/type checks:

```bash
npm run lint
npm run typecheck
```

Validate behavior through MCP flow:

```text
probe_recipe_create -> inspect recipe/report -> probe-verified execution
```

Only wire into `createDefaultSynthesizerRegistry` after this path is stable.

## Common Pitfalls

- broad `canHandle` that steals projects from other plugins
- returning recipe output without enough route proof
- weak or generic failure codes
- mixing transport concerns into plugin domain logic

## Done Criteria

- Plugin is deterministic across repeated runs.
- `canHandle` is framework-specific and predictable.
- Success output is executable and evidence-backed.
- Failure output is specific and actionable.
- Default registry behavior remains unchanged until explicit wiring.

## One Final Sanity Question

"When synthesis is uncertain, does the output still guide the next action clearly?"

If yes, your plugin is aligned with project intent.
