# Purpose

Define a deterministic regression execution plan for `<regression_name>`.

# Targets

1. Executes target selector: `<fqcn>#<method>`

# Prerequisites

1. Uses `tenantId` (required, non-secret)
2. Uses `auth.bearer` (required, secret)

# Steps

1. Executes `create_entity` using `http` transport.
2. Captures `response.body.id` as `exampleId`.
3. Verifies expected execution signal for step `create_entity`.

# Expected Outcomes

1. Returns `outcome_status=pass` for step `create_entity`.
2. Produces deterministic execution evidence for diagnostics.
