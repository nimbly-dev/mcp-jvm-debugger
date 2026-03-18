# Integration Test Layout

Integration tests are split by execution boundary:

- `java-agent`: direct runtime and probe verification against fixture applications started with the built agent attached
- `mcp`: end-to-end MCP tool execution against the same live fixture applications
