# Dev Guides

This section is for devs adding framework support to `mcp-java-dev-tools`.

If you are new here, do not start from probe internals.
Start from adapters and plugins, then move inward only if needed.

## Start Here

- [Creating Your Own Request Mappers](./creating-your-own-request-mappers/README.md)
- [Creating Your Own Synthesizers](./creating-your-own-synthesizers/README.md)

## How To Think About The Architecture

The platform has two extension surfaces:

- Java request mappers:
  map framework/controller source code into normalized HTTP request candidates.
- TS synthesizers:
  turn resolved mapping context into orchestrator-ready recipe outputs.

The probe remains the runtime truth source.
Adapters and synthesizers should enrich and route, not override runtime proof.

## Where Extension Code Lives

- Java request mapper adapters:
  `java-agent/mappers-adapters/adapter-request-mapper-*`
- TS synthesizer plugins:
  `tools/synthesizers/tools-*`

Opt-in examples:

- `java-agent/mappers-adapters/adapter-request-mapper-example`
- `tools/synthesizers/tools-synthesizer-example`

Examples are intentionally default-off.
They are starter scaffolds, not production modules.

## Which Surface Should You Extend

Choose a request mapper adapter when:

- your framework introduces new route annotations or controller conventions
- AST extraction is currently missing for that framework

Choose a synthesizer plugin when:

- route extraction exists, but recipe generation needs framework-specific behavior
- auth/header/body assumptions vary by framework conventions

You often need both for a brand-new framework.

## Engineering Guardrails

- Keep core framework-agnostic.
- Keep framework logic in adapters/plugins.
- Preserve deterministic fail-closed contracts:
  `status`, `reasonCode`, `failedStep`, `nextAction`, `evidence`, `attemptedStrategies`.
- Do not return success from weak heuristics.

## Typical Dev Flow

1. Copy the example module/package nearest to your target framework.
2. Rename package/artifact/plugin identifiers.
3. Implement framework rules in mapper/plugin code.
4. Validate module-level build first.
5. Validate end-to-end via `probe_recipe_create`.
6. Only then wire into default aggregator/registry.

## Ready-For-PR Checklist

- Adapter/plugin returns fail-closed outputs when proof is insufficient.
- Reason codes are specific enough for orchestrator follow-up.
- Paths, verbs, and templates are reproducible from source evidence.
- Module builds cleanly in isolation.
- Default behavior remains unchanged unless explicit wiring is added.

## Notes For New Devs

If the code feels "machine-first", that is intentional.
Human readability still matters, but deterministic machine contracts come first.
Good extension work balances both: clear code for humans, strict outputs for agents.
