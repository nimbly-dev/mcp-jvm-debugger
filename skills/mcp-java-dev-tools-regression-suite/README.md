# Regression Suite Skill

Deterministic FSM-based orchestration for regression execution.

Principles:

1. Fail closed.
2. MCP-first execution.
3. Project runtime context is authoritative when present.
4. Strict probe gate must pass before endpoint step execution when `probeVerification=true`.

Implementation split:

1. `SKILL.md`: routing contract only.
2. `references/`: policy + reason-code source of truth.
3. `scripts/`: deterministic helper logic with machine-readable output.
4. `templates/`: canonical response envelopes.

