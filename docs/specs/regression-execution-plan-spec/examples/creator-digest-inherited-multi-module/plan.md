# Creator Digest Inherited Multi-Module Regression Plan

## Purpose

Validate inherited Spring mappings in a multi-module layout, including one non-happy path assertion.

## Targets

- `CreatorDigestController#getCreatorDigest`
- `CreatorDigestController#patchCreatorDigest`

## Prerequisites

- `auth.bearer` (required, secret)
- `creatorId` (required)

## Steps

1. Executes `get_creator_digest` using `GET /api/v2/creators/${creatorId}/digest`.
2. Executes `patch_missing_digest` using `PATCH /api/v2/creators/not-found/digest`.
3. Verifies runtime proof for both inherited target methods.

## Expected Outcomes

1. Returns `200` for `get_creator_digest`.
2. Returns `404` for `patch_missing_digest`.
3. Passes overall plan result.

