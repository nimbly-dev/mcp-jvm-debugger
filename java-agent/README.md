# Java Agent Structure

Grouped module layout with non-breaking artifact names.

## Active module groups
- `core/core-probe` (`mcp-java-dev-tools-agent`)
- `core/core-probe-runtime` (`mcp-java-dev-tools-core-probe-runtime`)
- `core/core-probe-instrumentation` (`mcp-java-dev-tools-core-probe-instrumentation`)
- `core/core-probe-control-http` (`mcp-java-dev-tools-core-probe-control-http`)
- `core/core-request-mapper` (`mcp-java-dev-tools-core-request-mapper`)
- `mappers-adapters/adapter-request-mapper-spring` (`mcp-java-dev-tools-adapter-request-mapper-spring`)
- `request-mapping-resolver` (legacy compatibility artifact, optional)

## Build entrypoint
- Parent: `java-agent/pom.xml`
- Aggregators:
  - `java-agent/core/pom.xml`
  - `java-agent/mappers-adapters/pom.xml`

## Test placeholders
- `tests/core-contract-tests`
- `tests/mapper-contract-tests`
- `tests/e2e-agent-tests`

These test modules are placeholders only for now; no generated test code was added.

## Opt-in examples
- `mappers-adapters/adapter-request-mapper-example`

Examples are starter scaffolds for framework adoptors and are not part of default parent module wiring.
