import * as path from "node:path";

export type ServerConfig = {
  workspaceRootAbs: string;
  probeBaseUrl: string;
  probeStatusPath: string;
  probeResetPath: string;
  probeActuatePath: string;
  probeWaitMaxRetries: number;
  recipeOutputTemplate?: string;
  authLoginDiscoveryEnabled: boolean;
};

function getArgValue(argv: string[], name: string): string | undefined {
  const idx = argv.indexOf(name);
  if (idx === -1) return undefined;
  const v = argv[idx + 1];
  return v;
}

function parseBooleanFlag(raw: string | undefined, defaultValue: boolean): boolean {
  if (typeof raw !== "string") return defaultValue;
  const v = raw.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return defaultValue;
}

function parseIntFlag(raw: string | undefined, defaultValue: number, min: number, max: number): number {
  if (typeof raw !== "string") return defaultValue;
  const parsed = Number(raw.trim());
  if (!Number.isFinite(parsed)) return defaultValue;
  const n = Math.trunc(parsed);
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export function loadConfigFromEnvAndArgs(argv: string[]): ServerConfig {
  const workspaceRoot =
    getArgValue(argv, "--workspace-root") ??
    process.env.MCP_WORKSPACE_ROOT ??
    process.cwd();

  const probeBaseUrl =
    getArgValue(argv, "--probe-base-url") ??
    process.env.MCP_PROBE_BASE_URL;

  const probeStatusPath =
    getArgValue(argv, "--probe-status-path") ??
    process.env.MCP_PROBE_STATUS_PATH;

  const probeResetPath =
    getArgValue(argv, "--probe-reset-path") ??
    process.env.MCP_PROBE_RESET_PATH;

  const probeActuatePath =
    getArgValue(argv, "--probe-actuate-path") ??
    process.env.MCP_PROBE_ACTUATE_PATH ??
    "/__probe/actuate";

  const recipeOutputTemplate =
    getArgValue(argv, "--recipe-output-template") ??
    process.env.MCP_RECIPE_OUTPUT_TEMPLATE;
  const probeWaitMaxRetries = parseIntFlag(
    getArgValue(argv, "--probe-wait-max-retries") ?? process.env.MCP_PROBE_WAIT_MAX_RETRIES,
    1,
    1,
    10,
  );

  const authLoginDiscoveryEnabled = parseBooleanFlag(
    getArgValue(argv, "--auth-login-discovery-enabled") ??
      process.env.MCP_AUTH_LOGIN_DISCOVERY_ENABLED,
    true,
  );

  const missing: string[] = [];
  if (!probeBaseUrl) missing.push("MCP_PROBE_BASE_URL");
  if (!probeStatusPath) missing.push("MCP_PROBE_STATUS_PATH");
  if (!probeResetPath) missing.push("MCP_PROBE_RESET_PATH");
  if (missing.length > 0) {
    throw new Error(
      `Missing required MCP config: ${missing.join(", ")}. ` +
        `Set required probe env vars when adding mcp-jvm-debugger.`,
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(probeBaseUrl!);
  } catch {
    throw new Error(
      `Invalid MCP_PROBE_BASE_URL='${probeBaseUrl}'. ` +
        `Use full URL format like http://127.0.0.1:9193`,
    );
  }
  if (!parsed.port) {
    throw new Error(
      `MCP_PROBE_BASE_URL must include an explicit probe port (example: http://127.0.0.1:9193). ` +
        `If unknown, ask the user which service probe port is currently mapped.`,
    );
  }

  const probeBaseUrlRequired = probeBaseUrl!;
  const probeStatusPathRequired = probeStatusPath!;
  const probeResetPathRequired = probeResetPath!;
  const probeActuatePathRequired = probeActuatePath;

  return {
    workspaceRootAbs: path.resolve(workspaceRoot),
    probeBaseUrl: probeBaseUrlRequired,
    probeStatusPath: probeStatusPathRequired,
    probeResetPath: probeResetPathRequired,
    probeActuatePath: probeActuatePathRequired,
    probeWaitMaxRetries,
    authLoginDiscoveryEnabled,
    ...(recipeOutputTemplate ? { recipeOutputTemplate } : {}),
  };
}
