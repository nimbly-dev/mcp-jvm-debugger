# Profile Score Service Method Regression Plan

## Purpose

Validate non-HTTP method-level regression execution for profile scoring logic.

## Targets

- `ProfileScoreService#recomputeProfileScore`

## Prerequisites

- `userId` (required)
- `scoreSignalRef` (required)

## Steps

1. Sets score signal input map from `scoreSignalRef`.
2. Executes `set_score_signal` using custom method invocation.
3. Captures `result.score` as `newProfileScore`.

## Expected Outcomes

1. Produces numeric `newProfileScore`.
2. Matches score output pattern `^[0-9]+$`.
3. Passes overall plan result.

