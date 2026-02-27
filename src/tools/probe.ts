import { fetchJson } from "../lib/http";
import {
  clampInt,
  DEFAULT_PROBE_POLL_INTERVAL_MS,
  DEFAULT_PROBE_TIMEOUT_MS,
  DEFAULT_PROBE_WAIT_MAX_RETRIES,
  HARD_MAX_PROBE_POLL_INTERVAL_MS,
  HARD_MAX_PROBE_TIMEOUT_MS,
  HARD_MAX_PROBE_WAIT_MAX_RETRIES,
} from "../lib/safety";
import {
  DEFAULT_RECIPE_OUTPUT_TEMPLATE,
  renderRecipeTemplate,
  type RecipeTemplateModel,
} from "../lib/recipe_template";
import {
  joinUrl,
  parseProbeSnapshot,
  probeUnreachableMessage,
} from "../utils/probe.util";

const LAST_RESET_EPOCH_BY_KEY = new Map<string, number>();

function toText(value: unknown, fallback = "-"): string {
  if (value === null || typeof value === "undefined") return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

function renderProbeRecipe(args: {
  targetPath: string;
  probeKey: string;
  httpRequest: string;
  executionHit: string;
  apiOutcome: string;
  reproStatus: string;
  probeHit: string;
  httpCode: number | string;
  httpResponse: unknown;
  runDuration: string;
  runNotes?: string;
  authStatus?: string;
  authStrategy?: string;
  outputTemplate?: string | undefined;
}): string {
  const model: RecipeTemplateModel = {
    "target.path": args.targetPath,
    "probe.key": args.probeKey,
    "http.request": args.httpRequest,
    execution_hit: args.executionHit,
    api_outcome: args.apiOutcome,
    repro_status: args.reproStatus,
    "auth.status": args.authStatus ?? "not_applicable",
    "auth.strategy": args.authStrategy ?? "none",
    "auth.next_action": "-",
    "auth.headers": "-",
    "auth.missing": "-",
    "auth.source": "-",
    "auth.login.path": "-",
    "auth.login.body": "-",
    "probe.hit": args.probeHit,
    "http.code": toText(args.httpCode),
    "http.response": toText(args.httpResponse),
    "run.duration": args.runDuration,
    "run.notes": args.runNotes ?? "-",
  };
  const template = args.outputTemplate ?? DEFAULT_RECIPE_OUTPUT_TEMPLATE;
  return renderRecipeTemplate(template, model);
}

export async function probeStatus(args: {
  key: string;
  baseUrl: string;
  statusPath: string;
  outputTemplate?: string | undefined;
  timeoutMs?: number;
}): Promise<{ content: Array<{ type: "text"; text: string }>; structuredContent: Record<string, unknown> }> {
  const timeoutMs = clampInt(
    args.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS,
    1_000,
    HARD_MAX_PROBE_TIMEOUT_MS,
  );

  const url = new URL(joinUrl(args.baseUrl, args.statusPath));
  url.searchParams.set("key", args.key);

  let res;
  try {
    res = await fetchJson(url.toString(), { method: "GET", timeoutMs });
  } catch (err) {
    throw new Error(probeUnreachableMessage(url.toString(), err));
  }

  const structuredContent: Record<string, unknown> = {
    request: { key: args.key, url: url.toString(), timeoutMs },
    response: { status: res.status, json: res.json, text: res.json ? undefined : res.text },
  };

  const json = res.json as Record<string, unknown> | null;
  const hitCount = typeof json?.hitCount === "number" ? json.hitCount : 0;
  const text = renderProbeRecipe({
    targetPath: args.key,
    probeKey: args.key,
    httpRequest: `GET ${url.toString()}`,
    executionHit: hitCount > 0 ? "hit" : "miss",
    apiOutcome: res.status >= 200 && res.status < 300 ? "ok" : "error",
    reproStatus: "status_checked",
    probeHit:
      json !== null
        ? `hitCount=${toText(json.hitCount, "0")}, lastHitEpochMs=${toText(json.lastHitEpochMs, "0")}`
        : "No JSON probe payload",
    httpCode: res.status,
    httpResponse: res.json ?? res.text,
    runDuration: "Not measured",
    runNotes: "probe_status executed",
    outputTemplate: args.outputTemplate,
  });

  return { content: [{ type: "text", text }], structuredContent };
}

export async function probeReset(args: {
  key: string;
  baseUrl: string;
  resetPath: string;
  outputTemplate?: string | undefined;
  timeoutMs?: number;
}): Promise<{ content: Array<{ type: "text"; text: string }>; structuredContent: Record<string, unknown> }> {
  const timeoutMs = clampInt(
    args.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS,
    1_000,
    HARD_MAX_PROBE_TIMEOUT_MS,
  );

  const url = joinUrl(args.baseUrl, args.resetPath);
  let res;
  try {
    res = await fetchJson(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: args.key }),
      timeoutMs,
    });
  } catch (err) {
    throw new Error(probeUnreachableMessage(url, err));
  }

  const structuredContent: Record<string, unknown> = {
    request: { key: args.key, url, timeoutMs },
    response: { status: res.status, json: res.json, text: res.json ? undefined : res.text },
  };

  if (res.status >= 200 && res.status < 300) {
    LAST_RESET_EPOCH_BY_KEY.set(args.key, Date.now());
  }

  const text = renderProbeRecipe({
    targetPath: args.key,
    probeKey: args.key,
    httpRequest: `POST ${url}`,
    executionHit: "not_applicable",
    apiOutcome: res.status >= 200 && res.status < 300 ? "ok" : "error",
    reproStatus: res.status >= 200 && res.status < 300 ? "reset_done" : "reset_failed",
    probeHit: "counter reset requested",
    httpCode: res.status,
    httpResponse: res.json ?? res.text,
    runDuration: "Not measured",
    runNotes: "probe_reset executed",
    outputTemplate: args.outputTemplate,
  });

  return { content: [{ type: "text", text }], structuredContent };
}

export async function probeWaitHit(args: {
  key: string;
  baseUrl: string;
  statusPath: string;
  outputTemplate?: string | undefined;
  timeoutMs?: number;
  pollIntervalMs?: number;
  maxRetries?: number;
}): Promise<{ content: Array<{ type: "text"; text: string }>; structuredContent: Record<string, unknown> }> {
  const timeoutMs = clampInt(
    args.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS,
    1_000,
    HARD_MAX_PROBE_TIMEOUT_MS,
  );
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

  let last: Record<string, unknown> | null = null;
  let staleCandidate: Record<string, unknown> | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const waitStartEpochMs = Date.now();
    const inlineStartEpochMs = LAST_RESET_EPOCH_BY_KEY.get(args.key) ?? waitStartEpochMs;

    const baselineRes = await probeStatus({
      key: args.key,
      baseUrl: args.baseUrl,
      statusPath: args.statusPath,
      timeoutMs: Math.min(5_000, timeoutMs),
      outputTemplate: args.outputTemplate,
    });
    const baseline = parseProbeSnapshot(baselineRes.structuredContent as Record<string, unknown>);
    const baselineHitCount = baseline.hitCount ?? 0;
    const baselineLastHitEpochMs = baseline.lastHitEpochMs ?? 0;

    if (
      baselineHitCount > 0 &&
      baselineLastHitEpochMs > 0 &&
      baselineLastHitEpochMs >= inlineStartEpochMs
    ) {
      const baselineJson = (
        (baselineRes.structuredContent as any)?.response?.json ?? {}
      ) as Record<string, unknown>;
      const structuredContent: Record<string, unknown> = {
        request: {
          key: args.key,
          timeoutMs,
          pollIntervalMs,
          maxRetries,
          attempt,
          waitStartEpochMs,
          inlineStartEpochMs,
        },
        baseline: {
          hitCount: baselineHitCount,
          lastHitEpochMs: baselineLastHitEpochMs,
        },
        result: {
          hit: true,
          inline: true,
          source: "already_hit_since_inline_start",
          hitCount: baselineHitCount,
          hitDelta: 0,
          lastStatus: baselineJson,
        },
      };
      const text = renderProbeRecipe({
        targetPath: args.key,
        probeKey: args.key,
        httpRequest: `POLL ${joinUrl(args.baseUrl, args.statusPath)} (maxRetries=${maxRetries}, pollMs=${pollIntervalMs})`,
        executionHit: "hit",
        apiOutcome: "ok",
        reproStatus: "reproduced",
        probeHit: `inline hit confirmed; hitCount=${baselineHitCount}`,
        httpCode: 200,
        httpResponse: structuredContent.result,
        runDuration: `${Date.now() - waitStartEpochMs}ms`,
        runNotes: "probe_wait_hit detected baseline inline hit",
        outputTemplate: args.outputTemplate,
      });
      return { content: [{ type: "text", text }], structuredContent };
    }

    const start = waitStartEpochMs;
    while (Date.now() - start < timeoutMs) {
      const res = await probeStatus({
        key: args.key,
        baseUrl: args.baseUrl,
        statusPath: args.statusPath,
        timeoutMs: Math.min(5_000, timeoutMs),
        outputTemplate: args.outputTemplate,
      });
      last = res.structuredContent as Record<string, unknown>;

      const json = (last as any)?.response?.json as Record<string, unknown> | undefined;
      const hitCount = typeof json?.hitCount === "number" ? json.hitCount : null;
      const lastHitEpochMs = typeof json?.lastHitEpochMs === "number" ? json.lastHitEpochMs : null;
      if (hitCount !== null) {
        const hitDelta = hitCount - baselineHitCount;
        const isInlineByCount = hitDelta > 0;
        const isInlineByTime = lastHitEpochMs !== null && lastHitEpochMs >= inlineStartEpochMs;
        const isInline = isInlineByCount && isInlineByTime;
        if (isInline) {
          const structuredContent: Record<string, unknown> = {
            request: {
              key: args.key,
              timeoutMs,
              pollIntervalMs,
              maxRetries,
              attempt,
              waitStartEpochMs,
              inlineStartEpochMs,
            },
            baseline: {
              hitCount: baselineHitCount,
              lastHitEpochMs: baselineLastHitEpochMs,
            },
            result: {
              hit: true,
              inline: true,
              hitCount,
              hitDelta,
              lastStatus: json,
            },
          };
          const text = renderProbeRecipe({
            targetPath: args.key,
            probeKey: args.key,
            httpRequest: `POLL ${joinUrl(args.baseUrl, args.statusPath)} (maxRetries=${maxRetries}, pollMs=${pollIntervalMs})`,
            executionHit: "hit",
            apiOutcome: "ok",
            reproStatus: "reproduced",
            probeHit: `inline hit confirmed; hitCount=${hitCount}, hitDelta=${hitDelta}`,
            httpCode: 200,
            httpResponse: structuredContent.result,
            runDuration: `${Date.now() - waitStartEpochMs}ms`,
            runNotes: "probe_wait_hit detected inline hit during poll",
            outputTemplate: args.outputTemplate,
          });
          return { content: [{ type: "text", text }], structuredContent };
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

      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  }

  const structuredContent: Record<string, unknown> = {
    request: {
      key: args.key,
      timeoutMs,
      pollIntervalMs,
      maxRetries,
    },
    result: {
      hit: false,
      inline: false,
      reason: "timeout_no_inline_hit",
      last,
      staleCandidate,
    },
  };
  const text = renderProbeRecipe({
    targetPath: args.key,
    probeKey: args.key,
    httpRequest: `POLL ${joinUrl(args.baseUrl, args.statusPath)} (maxRetries=${maxRetries}, pollMs=${pollIntervalMs})`,
    executionHit: "miss",
    apiOutcome: "timeout",
    reproStatus: "not_reproduced",
    probeHit: "no inline hit observed",
    httpCode: 408,
    httpResponse: structuredContent.result,
    runDuration: `${timeoutMs}ms x ${maxRetries}`,
    runNotes: "probe_wait_hit timeout",
    outputTemplate: args.outputTemplate,
  });
  return { content: [{ type: "text", text }], structuredContent };
}

export async function probeActuate(args: {
  baseUrl: string;
  actuatePath: string;
  mode?: "observe" | "actuate";
  actuatorId?: string;
  targetKey?: string;
  returnBoolean?: boolean;
  outputTemplate?: string | undefined;
  timeoutMs?: number;
}): Promise<{ content: Array<{ type: "text"; text: string }>; structuredContent: Record<string, unknown> }> {
  const timeoutMs = clampInt(
    args.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS,
    1_000,
    HARD_MAX_PROBE_TIMEOUT_MS,
  );

  const url = joinUrl(args.baseUrl, args.actuatePath);
  const body: Record<string, unknown> = {};
  if (typeof args.mode === "string") body.mode = args.mode;
  if (typeof args.actuatorId === "string") body.actuatorId = args.actuatorId;
  if (typeof args.targetKey === "string") body.targetKey = args.targetKey;
  if (typeof args.returnBoolean === "boolean") body.returnBoolean = args.returnBoolean;

  let res;
  try {
    res = await fetchJson(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      timeoutMs,
    });
  } catch (err) {
    throw new Error(probeUnreachableMessage(url, err));
  }

  const structuredContent: Record<string, unknown> = {
    request: { url, timeoutMs, body },
    response: { status: res.status, json: res.json, text: res.json ? undefined : res.text },
  };
  const json = (res.json as Record<string, unknown> | null) ?? {};
  const effectiveMode = typeof json.mode === "string" ? json.mode : args.mode ?? "observe";
  const effectiveActuatorId = typeof json.actuatorId === "string" ? json.actuatorId : args.actuatorId ?? "";
  const effectiveTargetKey = typeof json.targetKey === "string" ? json.targetKey : args.targetKey ?? "";

  const text = renderProbeRecipe({
    targetPath: effectiveTargetKey || "probe_actuation",
    probeKey: effectiveTargetKey || "probe_actuation",
    httpRequest: `POST ${url}`,
    executionHit: "not_applicable",
    apiOutcome: res.status >= 200 && res.status < 300 ? "ok" : "error",
    reproStatus: res.status >= 200 && res.status < 300 ? "actuation_applied" : "actuation_failed",
    probeHit: `mode=${effectiveMode}, actuatorId=${effectiveActuatorId || "(none)"}`,
    httpCode: res.status,
    httpResponse: res.json ?? res.text,
    runDuration: "Not measured",
    runNotes: "probe_actuate executed",
    outputTemplate: args.outputTemplate,
  });

  return { content: [{ type: "text", text }], structuredContent };
}
