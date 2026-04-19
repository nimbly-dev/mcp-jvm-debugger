import type { PreflightResult } from "@tools-regression-execution-plan-spec/models/regression_execution_plan_spec.model";

export type RegressionRunStatus = "pass" | "fail" | "blocked";

export type RegressionPlanReference = {
  name?: string;
  path?: string;
};

export type RegressionRunExecutionResult = {
  status: RegressionRunStatus;
  preflight: PreflightResult;
  startedAt: string | null;
  endedAt: string | null;
  steps: Array<Record<string, unknown>>;
};

export type WriteRegressionRunArtifactsInput = {
  workspaceRootAbs: string;
  runId: string;
  planRef?: RegressionPlanReference;
  resolvedContext: Record<string, unknown>;
  secretContextKeys?: string[];
  executionResult: RegressionRunExecutionResult;
  evidence: {
    targetResolution: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  now?: Date;
};

export type RegressionRunArtifactsWriteResult = {
  runDirAbs: string;
  contextResolvedPathAbs: string;
  executionResultPathAbs: string;
  evidencePathAbs: string;
};

