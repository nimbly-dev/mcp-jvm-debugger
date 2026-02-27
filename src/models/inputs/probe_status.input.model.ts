import * as z from "zod/v4";

export const ProbeStatusInputSchema = {
  key: z.string().min(1).describe("Probe key, typically runtime method key: fully.qualified.ClassName#methodName."),
  baseUrl: z.string().optional().describe("Override probe base URL (default from MCP_PROBE_BASE_URL)."),
  timeoutMs: z.number().int().positive().optional(),
} as const;

