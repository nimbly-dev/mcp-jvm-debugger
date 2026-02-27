import * as z from "zod/v4";

export const ProbeResetInputSchema = {
  key: z.string().min(1),
  baseUrl: z.string().optional(),
  timeoutMs: z.number().int().positive().optional(),
} as const;

