# TS Tools Structure

This folder is the workspace-style scaffold for TS tool packages.

## Package groups
- `contracts/tools-contracts`
- `core/tools-core`
- `core/tools-registry`
- `synthesizers/tools-synthesizer-api`
- `synthesizers/tools-spring-http`
- `synthesizers/tools-jaxrs-http`
- `synthesizers/tools-grpc-rpc`
- `transport/tools-mcp-server`

## Test groups
- `tests/contract`
- `tests/e2e`

Each package already has its own placeholder `package.json` so adapter teams can add local dependencies independently.
This scaffold is intentionally lightweight and non-breaking.

## Opt-in examples
- `synthesizers/tools-synthesizer-example`

Example packages are starter scaffolds for framework adoptors and are not included in default runtime registration or TS build include paths.

## Placeholder packages
- `synthesizers/tools-jaxrs-http`
- `synthesizers/tools-grpc-rpc`

These are folder-level placeholders only. Spring HTTP is the only active synthesizer implementation today.

## Active runtime packages
- MCP transport/server entrypoint code:
  - `transport/tools-mcp-server/src`
- Shared recipe orchestration/runtime utilities:
  - `core/tools-core/src`
- Synthesizer plugin registry runtime:
  - `core/tools-registry/src`
- Spring HTTP synthesizer runtime implementation:
  - `synthesizers/tools-spring-http/src`
