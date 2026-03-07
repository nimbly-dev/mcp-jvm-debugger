import { probeStatus } from "../probe";

export type RuntimeCaptureSummary =
  | {
      status: "available";
      probeStatus: Record<string, unknown>;
      capturePreview: Record<string, unknown>;
    }
  | {
      status: "not_captured_yet" | "unavailable";
      reason: string;
    };

export async function enrichRuntimeCapture(args: {
  inferredKey?: string;
  inferredLine?: number;
  probeBaseUrl: string;
  probeStatusPath: string;
  probeStatusFn?: typeof probeStatus;
}): Promise<RuntimeCaptureSummary> {
  if (!args.inferredKey || typeof args.inferredLine !== "number") {
    return {
      status: "unavailable",
      reason: "probe_key_or_line_missing",
    };
  }

  const probeStatusFn = args.probeStatusFn ?? probeStatus;
  try {
    const runtimeStatus = await probeStatusFn({
      key: args.inferredKey,
      lineHint: args.inferredLine,
      baseUrl: args.probeBaseUrl,
      statusPath: args.probeStatusPath,
      timeoutMs: 2_500,
    });
    const statusJson = ((runtimeStatus.structuredContent as any)?.response?.json ??
      null) as Record<string, unknown> | null;
    const capturePreview =
      statusJson && typeof statusJson.capturePreview === "object"
        ? (statusJson.capturePreview as Record<string, unknown>)
        : null;
    if (capturePreview && capturePreview.available === true) {
      return {
        status: "available",
        probeStatus: statusJson ?? {},
        capturePreview,
      };
    }
    return {
      status: "not_captured_yet",
      reason: "status_checked_but_capture_unavailable",
    };
  } catch (err) {
    return {
      status: "unavailable",
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
