# Integration Test Layout

Integration tests are organized by fixture app, feature domain, and tool:

- `test/integrations/{fixture_app}/{feature}/{tool_name}/`

Naming convention:

- `{app}_{mcp_tool}_{behavior}.it.ts`
- `behavior` must be explicit (for example `post`, `get`, `events`, `inheritance_inference`, `runtime_probe`).

Current feature layout:

- `spring/social_platform/create_recipe`: recipe synthesis coverage split by endpoint domain (`get.it.ts`, `put.it.ts`).
- `spring/social_platform/probe_tools/mcp`: broader MCP probe-tool flow coverage across POST/PUT/probe/actuation.
- `spring/social_platform/runtime_probe/java-agent`: runtime probe verification against the social-platform fixture app.
- `others/mcp`: general MCP runtime checks (for example stdio transport discipline).
- `support/spring`: shared fixture/runtime helpers.

