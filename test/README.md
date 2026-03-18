# Test Layout

Centralized test assets live under the top-level `test` tree.

## Structure

```text
test/
|- fixtures/
|  \- spring-apps/
|     \- social-platform/
\- tools/
|  \- spring/
\- integration/
   |- java-agent/
   \- mcp/
```

## Intent

- `fixtures/spring-apps` contains real Spring fixture projects used only for integration testing.
- `tools/spring` contains the current tool-test suite for Spring-oriented synthesis, probe contracts, fixture discovery, and related request/probe flows.
- `integration/java-agent` contains direct Java-side integration tests for fixture apps running with the built agent attached.
- `integration/mcp` contains cross-module MCP integration tests that exercise:
  - TS orchestration
  - Java request-mapping synthesis
  - MCP tool execution against a live probe runtime
  - probe runtime behavior

These tests are intentionally outside `/java-agent` and `/tools` because they validate the integrated toolchain rather than a single module in isolation.
