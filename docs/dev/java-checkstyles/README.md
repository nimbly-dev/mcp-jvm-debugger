# Java Checkstyle

Style checks here are intentionally lightweight — strict enough to catch obvious readability issues early, but not so aggressive that they block normal development flow.

These rules are meant to guide new code, not penalize bootstrap and runtime plumbing. If a rule starts generating noise, prefer a targeted adjustment over broad suppression.

## Current Rules

| Rule | Setting |
|---|---|
| `LineLength` | Warning at 160 characters |
| `MethodLength` | Warning at 120 lines |
| `ParameterNumber` | Warning at 12 parameters |
| Nested ternary expressions | Disallowed |
| `UnusedImports` | Enforced |
| `AvoidStarImport` | Enforced |

## Targeted Suppressions

These files are suppressed for now — fully refactoring them would be a larger change than this baseline rollout warrants.

| File | Status |
|---|---|
| `CaptureValueSerializer.java` | Suppressed |
| `CapturePreviewView.java` | Suppressed |
| `ExecutionPathCollector.java` | Suppressed |
| `LineHitVisitor.java` | Suppressed |
| `RequestMappingResolver.java` | Suppressed |
| `AgentConfig.java` | Suppressed |