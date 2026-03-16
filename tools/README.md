# TS Tools Structure

This folder is the workspace-style scaffold for TS tool packages.

## Package groups
- `contracts/tools-contracts`
- `core/tools-core`
- `core/tools-registry`
- `synthesizers/tools-synthesizer-api`
- `synthesizers/tools-spring`
- `synthesizers/tools-jaxrs`
- `transport/tools-mcp-server`

## Test groups
- `tests/contract`
- `tests/e2e`

Each package already has its own placeholder `package.json` so adapter teams can add local dependencies independently.
This scaffold is intentionally lightweight and non-breaking.

## Opt-in examples
- `synthesizers/tools-synthesizer-example`

Example packages are starter scaffolds for framework adoptors and are not included in default runtime registration or TS build include paths.

## Active runtime packages
- MCP transport/server entrypoint code:
  - `transport/tools-mcp-server/src`
- Shared recipe orchestration/runtime utilities:
  - `core/tools-core/src`
- Synthesizer plugin registry runtime:
  - `core/tools-registry/src`
- Spring synthesizer runtime implementation:
  - `synthesizers/tools-spring/src`
