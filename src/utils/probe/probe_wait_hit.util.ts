import {
  clampInt,
  DEFAULT_PROBE_POLL_INTERVAL_MS,
  DEFAULT_PROBE_TIMEOUT_MS,
  DEFAULT_PROBE_WAIT_MAX_RETRIES,
  HARD_MAX_PROBE_POLL_INTERVAL_MS,
  HARD_MAX_PROBE_TIMEOUT_MS,
  HARD_MAX_PROBE_WAIT_MAX_RETRIES,
} from "../../lib/safety";
import type { ToolTextResponse } from "../../models/tool_response.model";
import { joinUrl, parseProbeSnapshot } from "../probe.util";
import { classifyExecutionHitStrictLine, classifyReproStatusStrictLine, isLineKey, resolveProbeKey } from "./key.util";
import { formatProbeOutput } from "./output.util";
import { probeStatus } from "./probe_status.util";
import {
  buildLineKeyRequiredResponse,
  buildTextResponse,
} from "./response_builders.util";
import {
  DEFAULT_PROBE_WAIT_UNREACHABLE_MAX_RETRIES,
  GUIDANCE_LINE_NOT_EXECUTED_IN_WINDOW,
  GUIDANCE_PROBE_CONNECTIVITY_ISSUE,
  GUIDANCE_RUNTIME_NOT_ALIGNED,
  HARD_MAX_PROBE_WAIT_UNREACHABLE_MAX_RETRIES,
  LAST_RESET_EPOCH_BY_KEY,
} from "./constants.util";
import { invalidLineTargetProbeHitMessage, readLineValidation } from "./status_normalize.util";
import { readProbeUnreachableErrorMessage, sleep } from "./wait_policy.util";

async function probeStatusWithUnreachablePolicy(args: {
  key: string;
  baseUrl: string;
  statusPath: string;
  timeoutMs: number;
  pollIntervalMs: number;
  unreachableRetryEnabled: boolean;
  unreachableMaxRetries: number;
}): Promise<
  | { kind: "status"; response: ToolTextResponse }
  | {
      kind: "unreachable";
      details: {
        endpoint: string;
        lastError: string;
        unreachableAttempts: number;
        unreachableMaxRetries: number;
        unreachableRetryEnabled: boolean;
      };
    }
> {
  const endpointUrl = new URL(joinUrl(args.baseUrl, args.statusPath));
  endpointUrl.searchParams.set("key", args.key);
  const maxAttempts = args.unreachableRetryEnabled ? args.unreachableMaxRetries : 1;
  let lastError = "Probe endpoint unreachable";

  for (let unreachableAttempt = 1; unreachableAttempt <= maxAttempts; unreachableAttempt++) {
    try {
      const response = await probeStatus({
        key: args.key,
        baseUrl: args.baseUrl,
        statusPath: args.statusPath,
        timeoutMs: args.timeoutMs,
      });
      return { kind: "status", response };
    } catch (err) {
      const unreachableError = readProbeUnreachableErrorMessage(err);
      if (!unreachableError) throw err;
      lastError = unreachableError;
      if (unreachableAttempt >= maxAttempts) {
        return {
          kind: "unreachable",
          details: {
            endpoint: endpointUrl.toString(),
            lastError,
            unreachableAttempts: unreachableAttempt,
            unreachableMaxRetries: maxAttempts,
            unreachableRetryEnabled: args.unreachableRetryEnabled,
          },
        };
      }
      await sleep(args.pollIntervalMs);
    }
  }

  return {
    kind: "unreachable",
    details: {
      endpoint: endpointUrl.toString(),
      lastError,
      unreachableAttempts: maxAttempts,
      unreachableMaxRetries: maxAttempts,
      unreachableRetryEnabled: args.unreachableRetryEnabled,
    },
  };
}

function buildServiceUnreachableResponse(args: {
  key: string;
  resolvedKey: string;
  timeoutMs: number;
  pollIntervalMs: number;
  maxRetries: number;
  unreachableRetryEnabled: boolean;
  unreachableMaxRetries: number;
  attempt: number;
  waitStartEpochMs: number;
  inlineStartEpochMs: number;
  stage: "baseline_status_check" | "poll_status_check";
  baselineHitCount?: number;
  baselineLastHitEpochMs?: number;
  details: {
    endpoint: string;
    lastError: string;
    unreachableAttempts: number;
    unreachableMaxRetries: number;
    unreachableRetryEnabled: boolean;
  };
}): ToolTextResponse {
  const structuredContent: Record<string, unknown> = {
    request: {
      key: args.key,
      resolvedKey: args.resolvedKey,
      timeoutMs: args.timeoutMs,
      pollIntervalMs: args.pollIntervalMs,
      maxRetries: args.maxRetries,
      unreachableRetryEnabled: args.unreachableRetryEnabled,
      unreachableMaxRetries: args.unreachableMaxRetries,
      attempt: args.attempt,
      waitStartEpochMs: args.waitStartEpochMs,
      inlineStartEpochMs: args.inlineStartEpochMs,
      stage: args.stage,
    },
    result: {
      hit: false,
      inline: false,
      reason: "service_unreachable",
      actionCode: GUIDANCE_PROBE_CONNECTIVITY_ISSUE.actionCode,
      nextAction: GUIDANCE_PROBE_CONNECTIVITY_ISSUE.nextAction,
      endpoint: args.details.endpoint,
      lastError: args.details.lastError,
      unreachableAttempts: args.details.unreachableAttempts,
      unreachableMaxRetries: args.details.unreachableMaxRetries,
      unreachableRetryEnabled: args.details.unreachableRetryEnabled,
    },
  };
  if (typeof args.baselineHitCount === "number" && typeof args.baselineLastHitEpochMs === "number") {
    structuredContent.baseline = {
      hitCount: args.baselineHitCount,
      lastHitEpochMs: args.baselineLastHitEpochMs,
    };
  }
  const text = formatProbeOutput({
    probeKey: args.resolvedKey,
    httpRequest: `POLL ${args.details.endpoint}`,
    requestMethod: "POLL",
    requestUrl: args.details.endpoint,
    requestBody: {
      key: args.resolvedKey,
      timeoutMs: args.timeoutMs,
      pollIntervalMs: args.pollIntervalMs,
      maxRetries: args.maxRetries,
      unreachableRetryEnabled: args.unreachableRetryEnabled,
      unreachableMaxRetries: args.unreachableMaxRetries,
    },
    executionHit: "not_hit",
    apiOutcome: "error",
    reproStatus: "probe_unreachable",
    probeHit:
      `probe endpoint unreachable; attempts=${args.details.unreachableAttempts}/` +
      `${args.details.unreachableMaxRetries}`,
    httpCode: 503,
    httpResponse: structuredContent.result,
    actionCode: GUIDANCE_PROBE_CONNECTIVITY_ISSUE.actionCode,
    nextAction: GUIDANCE_PROBE_CONNECTIVITY_ISSUE.nextAction,
    runDuration: `${Date.now() - args.waitStartEpochMs}ms`,
    runNotes: `probe_wait_for_hit service unreachable during ${args.stage}`,
  });
  return buildTextResponse(structuredContent, text);
}

export async function probeWaitHit(args: {
  key: string;
  lineHint?: number;
  baseUrl: string;
  statusPath: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
  maxRetries?: number;
  unreachableRetryEnabled?: boolean;
  unreachableMaxRetries?: number;
}): Promise<ToolTextResponse> {
  const timeoutMs = clampInt(args.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS, 1_000, HARD_MAX_PROBE_TIMEOUT_MS);
  const pollIntervalMs = clampInt(
    args.pollIntervalMs ?? DEFAULT_PROBE_POLL_INTERVAL_MS,
    100,
    HARD_MAX_PROBE_POLL_INTERVAL_MS,
  );
  const maxRetries = clampInt(
    args.maxRetries ?? DEFAULT_PROBE_WAIT_MAX_RETRIES,
    1,
    HARD_MAX_PROBE_WAIT_MAX_RETRIES,
  );
  const unreachableRetryEnabled = args.unreachableRetryEnabled === true;
  const unreachableMaxRetries = clampInt(
    args.unreachableMaxRetries ?? DEFAULT_PROBE_WAIT_UNREACHABLE_MAX_RETRIES,
    1,
    HARD_MAX_PROBE_WAIT_UNREACHABLE_MAX_RETRIES,
  );
  const resolvedKey = resolveProbeKey(args.key, args.lineHint);
  const pollUrl = joinUrl(args.baseUrl, args.statusPath);

  if (!isLineKey(resolvedKey)) {
    return buildLineKeyRequiredResponse({
      request: {
        key: args.key,
        resolvedKey,
        timeoutMs,
        pollIntervalMs,
        maxRetries,
        unreachableRetryEnabled,
        unreachableMaxRetries,
      },
      targetPath: resolvedKey,
      httpRequest: `POLL ${pollUrl} (maxRetries=${maxRetries}, pollMs=${pollIntervalMs})`,
      requestMethod: "POLL",
      requestUrl: pollUrl,
      requestBody: {
        key: resolvedKey,
        maxRetries,
        pollIntervalMs,
        timeoutMs,
        unreachableRetryEnabled,
        unreachableMaxRetries,
      },
      result: { hit: false, inline: false, reason: "line_key_required" },
      runNotes: "probe_wait_for_hit strict line mode",
    });
  }

  let last: Record<string, unknown> | null = null;
  let staleCandidate: Record<string, unknown> | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const waitStartEpochMs = Date.now();
    const inlineStartEpochMs = LAST_RESET_EPOCH_BY_KEY.get(resolvedKey) ?? waitStartEpochMs;

    const baselineStatus = await probeStatusWithUnreachablePolicy({
      key: resolvedKey,
      baseUrl: args.baseUrl,
      statusPath: args.statusPath,
      timeoutMs: Math.min(5_000, timeoutMs),
      pollIntervalMs,
      unreachableRetryEnabled,
      unreachableMaxRetries,
    });
    if (baselineStatus.kind === "unreachable") {
      return buildServiceUnreachableResponse({
        key: args.key,
        resolvedKey,
        timeoutMs,
        pollIntervalMs,
        maxRetries,
        unreachableRetryEnabled,
        unreachableMaxRetries,
        attempt,
        waitStartEpochMs,
        inlineStartEpochMs,
        stage: "baseline_status_check",
        details: baselineStatus.details,
      });
    }
    const baselineRes = baselineStatus.response;
    const baselineJson = ((baselineRes.structuredContent as any)?.response?.json ?? null) as
      | Record<string, unknown>
      | null;
    const baselineLineValidation = readLineValidation(baselineJson);
    const baseline = parseProbeSnapshot(baselineRes.structuredContent);
    const baselineHitCount = baseline.hitCount ?? 0;
    const baselineLastHitEpochMs = baseline.lastHitEpochMs ?? 0;
    if (baselineLineValidation.invalidLineTarget) {
      const structuredContent: Record<string, unknown> = {
        request: {
          key: args.key,
          resolvedKey,
          timeoutMs,
          pollIntervalMs,
          maxRetries,
          unreachableRetryEnabled,
          unreachableMaxRetries,
          attempt,
          waitStartEpochMs,
          inlineStartEpochMs,
        },
        result: {
          hit: false,
          inline: false,
          reason: "invalid_line_target",
          actionCode: GUIDANCE_RUNTIME_NOT_ALIGNED.actionCode,
          nextAction: GUIDANCE_RUNTIME_NOT_ALIGNED.nextAction,
          lineValidation: baselineLineValidation.lineValidation ?? "invalid_line_target",
          lastStatus: baselineJson,
        },
      };
      const text = formatProbeOutput({
        probeKey: resolvedKey,
        httpRequest: `POLL ${pollUrl} (maxRetries=${maxRetries}, pollMs=${pollIntervalMs})`,
        requestMethod: "POLL",
        requestUrl: pollUrl,
        requestBody: { key: resolvedKey, maxRetries, pollIntervalMs, timeoutMs },
        executionHit: "not_hit",
        apiOutcome: "error",
        reproStatus: "invalid_line_target",
        probeHit: invalidLineTargetProbeHitMessage(baselineHitCount),
        actionCode: GUIDANCE_RUNTIME_NOT_ALIGNED.actionCode,
        nextAction: GUIDANCE_RUNTIME_NOT_ALIGNED.nextAction,
        httpCode: 422,
        httpResponse: structuredContent.result,
        runtimeMode: typeof baselineJson?.mode === "string" ? baselineJson.mode : undefined,
        runDuration: `${Date.now() - waitStartEpochMs}ms`,
        runNotes: "probe_wait_for_hit invalid line target detected at baseline status",
      });
      return buildTextResponse(structuredContent, text);
    }

    if (baselineHitCount > 0 && baselineLastHitEpochMs > 0 && baselineLastHitEpochMs >= inlineStartEpochMs) {
      const baselineJsonForHit = (baselineJson ?? {}) as Record<string, unknown>;
      const structuredContent: Record<string, unknown> = {
        request: {
          key: args.key,
          resolvedKey,
          timeoutMs,
          pollIntervalMs,
          maxRetries,
          attempt,
          waitStartEpochMs,
          inlineStartEpochMs,
        },
        baseline: { hitCount: baselineHitCount, lastHitEpochMs: baselineLastHitEpochMs },
        result: {
          hit: true,
          inline: true,
          source: "already_hit_since_inline_start",
          hitCount: baselineHitCount,
          hitDelta: 0,
          lastStatus: baselineJsonForHit,
        },
      };
      const text = formatProbeOutput({
        probeKey: resolvedKey,
        httpRequest: `POLL ${pollUrl} (maxRetries=${maxRetries}, pollMs=${pollIntervalMs})`,
        requestMethod: "POLL",
        requestUrl: pollUrl,
        requestBody: { key: resolvedKey, maxRetries, pollIntervalMs, timeoutMs },
        executionHit: classifyExecutionHitStrictLine(resolvedKey, true),
        apiOutcome: "ok",
        reproStatus: classifyReproStatusStrictLine(resolvedKey, true),
        probeHit: `inline line hit confirmed; hitCount=${baselineHitCount}`,
        httpCode: 200,
        httpResponse: structuredContent.result,
        runtimeMode: typeof baselineJsonForHit?.mode === "string" ? baselineJsonForHit.mode : undefined,
        runDuration: `${Date.now() - waitStartEpochMs}ms`,
        runNotes: "probe_wait_for_hit detected baseline inline hit",
      });
      return buildTextResponse(structuredContent, text);
    }

    const start = waitStartEpochMs;
    while (Date.now() - start < timeoutMs) {
      const polledStatus = await probeStatusWithUnreachablePolicy({
        key: resolvedKey,
        baseUrl: args.baseUrl,
        statusPath: args.statusPath,
        timeoutMs: Math.min(5_000, timeoutMs),
        pollIntervalMs,
        unreachableRetryEnabled,
        unreachableMaxRetries,
      });
      if (polledStatus.kind === "unreachable") {
        return buildServiceUnreachableResponse({
          key: args.key,
          resolvedKey,
          timeoutMs,
          pollIntervalMs,
          maxRetries,
          unreachableRetryEnabled,
          unreachableMaxRetries,
          attempt,
          waitStartEpochMs,
          inlineStartEpochMs,
          stage: "poll_status_check",
          baselineHitCount,
          baselineLastHitEpochMs,
          details: polledStatus.details,
        });
      }
      const res = polledStatus.response;
      last = res.structuredContent;

      const json = (last as any)?.response?.json as Record<string, unknown> | undefined;
      const lineValidation = readLineValidation(json ?? null);
      if (lineValidation.invalidLineTarget) {
        const structuredContent: Record<string, unknown> = {
          request: {
            key: args.key,
            resolvedKey,
            timeoutMs,
            pollIntervalMs,
            maxRetries,
            unreachableRetryEnabled,
            unreachableMaxRetries,
            attempt,
            waitStartEpochMs,
            inlineStartEpochMs,
          },
          baseline: { hitCount: baselineHitCount, lastHitEpochMs: baselineLastHitEpochMs },
          result: {
            hit: false,
            inline: false,
            reason: "invalid_line_target",
            actionCode: GUIDANCE_RUNTIME_NOT_ALIGNED.actionCode,
            nextAction: GUIDANCE_RUNTIME_NOT_ALIGNED.nextAction,
            lineValidation: lineValidation.lineValidation ?? "invalid_line_target",
            lastStatus: json ?? null,
          },
        };
        const text = formatProbeOutput({
          probeKey: resolvedKey,
          httpRequest: `POLL ${pollUrl} (maxRetries=${maxRetries}, pollMs=${pollIntervalMs})`,
          requestMethod: "POLL",
          requestUrl: pollUrl,
          requestBody: { key: resolvedKey, maxRetries, pollIntervalMs, timeoutMs },
          executionHit: "not_hit",
          apiOutcome: "error",
          reproStatus: "invalid_line_target",
          probeHit: invalidLineTargetProbeHitMessage(baselineHitCount),
          actionCode: GUIDANCE_RUNTIME_NOT_ALIGNED.actionCode,
          nextAction: GUIDANCE_RUNTIME_NOT_ALIGNED.nextAction,
          httpCode: 422,
          httpResponse: structuredContent.result,
          runtimeMode: typeof json?.mode === "string" ? json.mode : undefined,
          runDuration: `${Date.now() - waitStartEpochMs}ms`,
          runNotes: "probe_wait_for_hit invalid line target detected during poll",
        });
        return buildTextResponse(structuredContent, text);
      }
      const hitCount = typeof json?.hitCount === "number" ? json.hitCount : null;
      const lastHitEpochMs = typeof json?.lastHitEpochMs === "number" ? json.lastHitEpochMs : null;
      if (hitCount !== null) {
        const hitDelta = hitCount - baselineHitCount;
        const isInlineByCount = hitDelta > 0;
        const isInlineByTime = lastHitEpochMs !== null && lastHitEpochMs >= inlineStartEpochMs;
        if (isInlineByCount && isInlineByTime) {
          const structuredContent: Record<string, unknown> = {
            request: {
              key: args.key,
              resolvedKey,
              timeoutMs,
              pollIntervalMs,
              maxRetries,
              unreachableRetryEnabled,
              unreachableMaxRetries,
              attempt,
              waitStartEpochMs,
              inlineStartEpochMs,
            },
            baseline: { hitCount: baselineHitCount, lastHitEpochMs: baselineLastHitEpochMs },
            result: { hit: true, inline: true, hitCount, hitDelta, lastStatus: json },
          };
          const text = formatProbeOutput({
            probeKey: resolvedKey,
            httpRequest: `POLL ${pollUrl} (maxRetries=${maxRetries}, pollMs=${pollIntervalMs})`,
            requestMethod: "POLL",
            requestUrl: pollUrl,
            requestBody: { key: resolvedKey, maxRetries, pollIntervalMs, timeoutMs },
            executionHit: classifyExecutionHitStrictLine(resolvedKey, true),
            apiOutcome: "ok",
            reproStatus: classifyReproStatusStrictLine(resolvedKey, true),
            probeHit: `inline line hit confirmed; hitCount=${hitCount}, hitDelta=${hitDelta}`,
            httpCode: 200,
            httpResponse: structuredContent.result,
            runtimeMode: typeof json?.mode === "string" ? json.mode : undefined,
            runDuration: `${Date.now() - waitStartEpochMs}ms`,
            runNotes: "probe_wait_for_hit detected inline hit during poll",
          });
          return buildTextResponse(structuredContent, text);
        }
        if (isInlineByCount && !isInlineByTime) {
          staleCandidate = {
            hitCount,
            hitDelta,
            lastHitEpochMs,
            reason: "hit_count_changed_but_not_inline_to_current_wait_window",
          };
        }
      }
      await sleep(pollIntervalMs);
    }
  }

  const structuredContent: Record<string, unknown> = {
    request: {
      key: args.key,
      resolvedKey,
      timeoutMs,
      pollIntervalMs,
      maxRetries,
      unreachableRetryEnabled,
      unreachableMaxRetries,
    },
    result: {
      hit: false,
      inline: false,
      reason: "timeout_no_inline_hit",
      actionCode: GUIDANCE_LINE_NOT_EXECUTED_IN_WINDOW.actionCode,
      nextAction: GUIDANCE_LINE_NOT_EXECUTED_IN_WINDOW.nextAction,
      last,
      staleCandidate,
    },
  };
  const text = formatProbeOutput({
    probeKey: resolvedKey,
    httpRequest: `POLL ${pollUrl} (maxRetries=${maxRetries}, pollMs=${pollIntervalMs})`,
    requestMethod: "POLL",
    requestUrl: pollUrl,
    requestBody: { key: resolvedKey, maxRetries, pollIntervalMs, timeoutMs },
    executionHit: classifyExecutionHitStrictLine(resolvedKey, false),
    apiOutcome: "timeout",
    reproStatus: classifyReproStatusStrictLine(resolvedKey, false),
    probeHit: "no inline line hit observed",
    actionCode: GUIDANCE_LINE_NOT_EXECUTED_IN_WINDOW.actionCode,
    nextAction: GUIDANCE_LINE_NOT_EXECUTED_IN_WINDOW.nextAction,
    httpCode: 408,
    httpResponse: structuredContent.result,
    runtimeMode:
      typeof (last as any)?.response?.json?.mode === "string" ? (last as any).response.json.mode : undefined,
    runDuration: `${timeoutMs}ms x ${maxRetries}`,
    runNotes: "probe_wait_for_hit timeout",
  });
  return buildTextResponse(structuredContent, text);
}
