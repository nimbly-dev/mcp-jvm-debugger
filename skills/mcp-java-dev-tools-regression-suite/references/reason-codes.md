# Reason Codes

Canonical fail/blocked reason codes:

1. `toolchain_unavailable`
2. `project_artifact_missing`
3. `project_artifact_invalid`
4. `workspace_root_invalid`
5. `runtime_context_unknown`
6. `env_key_missing`
7. `external_system_invalid`
8. `external_healthcheck_failed`
9. `runtime_auto_replace_required`
10. `runtime_start_failed`
11. `runtime_probe_unreachable_after_start`
12. `probe_gate_failed`
13. `needs_user_input`

Usage:

1. Emit exactly one primary reason code per blocked run.
2. Keep `checks[]` concise and machine-readable.
3. Keep `nextAction` deterministic and single-step.
