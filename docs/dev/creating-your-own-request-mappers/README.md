# Creating Your Own Request Mappers

This guide is for devs who need to teach the Java side how a framework expresses routes.

Your job here is not to "guess a route".
Your job is to extract a route only when source evidence is strong enough.

## What You Copy First

Start with:

- `java-agent/mappers-adapters/adapter-request-mapper-example`

This example is default-off and safe to copy.
It already includes a full generic extraction pattern:

- annotation name mapping
- class + method path merge
- HTTP method resolution
- path expression resolution (literals, constants, concatenation)
- final materialization through `PathMaterializer`

## Where Your Real Adapter Belongs

Place your implementation here:

- `java-agent/mappers-adapters/adapter-request-mapper-<framework>`

Examples:

- `adapter-request-mapper-jaxrs`
- `adapter-request-mapper-quarkus`

## Mental Model

The mapper adapter answers one question:
"From source code alone, can I prove the HTTP method + path for this target method?"

If yes:
return one normalized `ResolvedMapping`.

If no:
return `Optional.empty()` and let the pipeline fail closed with deterministic diagnostics.

## Implementation Steps

1. Copy the example module and rename package/artifact names.
2. Replace annotation constants with your framework's route annotations.
3. Implement class-level base path extraction.
4. Implement method-level path and verb extraction.
5. Reuse `PathMaterializer` so query/path/body template behavior stays consistent.
6. Register your extractor in `META-INF/services`.
7. Build the module directly before touching aggregator wiring.

## Practical Design Advice

- Keep `strategyId()` stable and specific.
- Treat composed annotations (`Get`, `Post`, etc.) as first-class mappings.
- Support both `path` and `value` attribute conventions when your framework uses both.
- Handle constant references and string joins; real projects use both.
- Do not convert unresolved expressions into fake paths.

## Fail-Closed Expectations

Return `Optional.empty()` when:

- no route annotations match
- HTTP method cannot be resolved
- path expression is non-resolvable without unsafe assumptions

Returning empty is correct behavior.
It is better than silently inventing a route.

## Build And Validation

Build module only:

```bash
mvn -f java-agent/mappers-adapters/adapter-request-mapper-<framework>/pom.xml test
```

Build full Java stack:

```bash
mvn -f java-agent/pom.xml test
```

After wiring, validate end-to-end through recipe/probe flow to confirm the mapper output is actually usable by orchestrated execution.

## Common Pitfalls

- putting framework-specific code into `core-request-mapper`
- returning a mapping when only part of the route is proven
- relying on naming conventions instead of annotation evidence
- bypassing `ServiceLoader` registration

## Done Criteria

- Adapter compiles and loads via `ServiceLoader`.
- Proven routes resolve to deterministic `ResolvedMapping`.
- Unproven routes fail closed (no pseudo-success output).
- Behavior is documented enough for the next dev to extend.

## One Final Sanity Question

"If extraction fails, does the system still provide a clear next step without pretending success?"

If yes, your adapter is aligned with project intent.
