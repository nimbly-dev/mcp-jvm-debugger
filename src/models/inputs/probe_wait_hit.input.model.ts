import * as z from "zod/v4";

export const ProbeWaitHitInputSchema = {
  key: z.string().min(1),
  baseUrl: z.string().optional(),
  timeoutMs: z.number().int().positive().optional(),
  pollIntervalMs: z.number().int().positive().optional(),
  maxRetries: z.number().int().positive().optional(),
} as const;
