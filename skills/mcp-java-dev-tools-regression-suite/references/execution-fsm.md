# Execution FSM

Authoritative phase state machine:

1. `phase_0_load_plan`
2. `phase_1_project_context`
3. `phase_2_preflight_and_discovery`
4. `phase_3_strict_probe_gate`
5. `phase_4_step_execution`
6. `phase_5_artifact_persist_and_summary`

Rules:

1. No phase skipping.
2. Any failure before phase 4 prevents endpoint step execution.
3. `probeVerification=true` blocks phase 4 until strict probe gate passes.
4. Response envelope must match one template:
   - `templates/fail-closed.result.json`
   - `templates/needs-user-input.result.json`
   - `templates/run-summary.result.json`

