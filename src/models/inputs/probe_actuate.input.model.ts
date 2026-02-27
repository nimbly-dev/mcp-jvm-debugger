import * as z from "zod/v4";

export const ProbeActuateInputSchema = {
  baseUrl: z.string().optional().describe("Override probe base URL (default from MCP_PROBE_BASE_URL)."),
  mode: z
    .enum(["observe", "actuate"])
    .optional()
    .describe("Runtime probe mode. Use 'observe' to disarm actuation."),
  actuatorId: z
    .string()
    .optional()
    .describe("Optional actuator identifier for tracing/auditing."),
  targetKey: z
    .string()
    .optional()
    .describe("Target method key for boolean return actuation, e.g. fully.qualified.Class#method."),
  returnBoolean: z
    .boolean()
    .optional()
    .describe("Boolean value to force as return value for targetKey when in actuate mode."),
  timeoutMs: z.number().int().positive().optional(),
} as const;
