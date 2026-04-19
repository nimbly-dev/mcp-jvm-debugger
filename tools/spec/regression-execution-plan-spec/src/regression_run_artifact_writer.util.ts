import { promises as fs } from "node:fs";
import path from "node:path";

import type {
  RegressionRunArtifactsWriteResult,
  WriteRegressionRunArtifactsInput,
} from "@tools-regression-execution-plan-spec/models/regression_run_artifact.model";

export type {
  RegressionPlanReference,
  RegressionRunArtifactsWriteResult,
  RegressionRunExecutionResult,
  RegressionRunStatus,
  WriteRegressionRunArtifactsInput,
} from "@tools-regression-execution-plan-spec/models/regression_run_artifact.model";

const RUN_ID_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z_\d{2}$/;
const SECRET_KEY_PATTERN = /(?:token|secret|password|authorization|api[-_]?key|bearer)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeByKey(
  value: unknown,
  explicitSecretPaths: Set<string>,
  parentPath: string | null = null,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeByKey(item, explicitSecretPaths, parentPath));
  }
  if (!isRecord(value)) {
    return value;
  }
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    const currentPath = parentPath ? `${parentPath}.${key}` : key;
    const isExplicitSecret = explicitSecretPaths.has(key) || explicitSecretPaths.has(currentPath);
    const isPatternSecret = SECRET_KEY_PATTERN.test(key);
    if (isExplicitSecret || isPatternSecret) {
      continue;
    }
    output[key] = sanitizeByKey(child, explicitSecretPaths, currentPath);
  }
  return output;
}

async function writeJsonFile(filePathAbs: string, payload: Record<string, unknown>): Promise<void> {
  await fs.writeFile(filePathAbs, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function buildRunArtifactDirAbs(workspaceRootAbs: string, runId: string): string {
  if (!workspaceRootAbs || workspaceRootAbs.trim() === "") {
    throw new Error("workspace_root_missing");
  }
  if (!RUN_ID_PATTERN.test(runId)) {
    throw new Error("run_id_invalid");
  }
  return path.join(workspaceRootAbs, ".mcpjvm", "runs", runId);
}

export async function writeRegressionRunArtifacts(
  args: WriteRegressionRunArtifactsInput,
): Promise<RegressionRunArtifactsWriteResult> {
  const runDirAbs = buildRunArtifactDirAbs(args.workspaceRootAbs, args.runId);
  await fs.mkdir(runDirAbs, { recursive: true });

  const explicitSecretPaths = new Set(args.secretContextKeys ?? []);
  const now = args.now ?? new Date();

  const contextResolvedPathAbs = path.join(runDirAbs, "context.resolved.json");
  const executionResultPathAbs = path.join(runDirAbs, "execution.result.json");
  const evidencePathAbs = path.join(runDirAbs, "evidence.json");

  const contextResolvedPayload = sanitizeByKey(
    {
      resolvedAt: now.toISOString(),
      ...(args.planRef ? { planRef: args.planRef } : {}),
      ...args.resolvedContext,
    },
    explicitSecretPaths,
  ) as Record<string, unknown>;

  const executionResultPayload = sanitizeByKey(
    {
      ...args.executionResult,
      ...(args.planRef ? { planRef: args.planRef } : {}),
      runId: args.runId,
    },
    explicitSecretPaths,
  ) as Record<string, unknown>;

  const evidencePayload = sanitizeByKey(
    {
      ...args.evidence,
      ...(args.planRef ? { planRef: args.planRef } : {}),
      runId: args.runId,
    },
    explicitSecretPaths,
  ) as Record<string, unknown>;

  await writeJsonFile(contextResolvedPathAbs, contextResolvedPayload);
  await writeJsonFile(executionResultPathAbs, executionResultPayload);
  await writeJsonFile(evidencePathAbs, evidencePayload);

  return {
    runDirAbs,
    contextResolvedPathAbs,
    executionResultPathAbs,
    evidencePathAbs,
  };
}

