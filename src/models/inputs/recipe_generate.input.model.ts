import * as z from "zod/v4";

export const RecipeGenerateInputSchema = {
  classHint: z.string().describe("Class hint, e.g. CatalogShoeSpecifications"),
  methodHint: z.string().describe("Method hint, e.g. finalPriceLte"),
  lineHint: z.number().int().positive().optional(),
  mode: z
    .enum(["natural", "actuated"])
    .optional()
    .describe(
      "Planning mode. Default is natural (report unreachable_natural when not inferable). Use actuated only on explicit second prompt.",
    ),
  serviceHint: z.string().optional().describe("Optional service hint to pick project root"),
  projectId: z.string().optional().describe("Optional discovered project id"),
  workspaceRoot: z.string().optional().describe("Optional workspace root override"),
  authToken: z
    .string()
    .optional()
    .describe("Optional bearer token. If auth is required and missing, tool returns needs_user_input."),
  authUsername: z
    .string()
    .optional()
    .describe("Optional auth username/email for login discovery flows."),
  authPassword: z
    .string()
    .optional()
    .describe("Optional auth password for login discovery flows."),
  outputTemplate: z
    .string()
    .optional()
    .describe(
      "Optional response template override. Placeholders include {{recipe.mode}}, {{recipe.mode_reason}}, {{recipe.steps}}, {{recipe.natural_steps}}, {{recipe.actuated_steps}}, {{target.path}}, {{http.request}}, {{execution_hit}}, {{api_outcome}}, {{repro_status}}, {{auth.status}}, {{auth.strategy}}, {{auth.next_action}}, {{auth.headers}}, {{auth.missing}}, {{auth.source}}, {{auth.login.path}}, {{auth.login.body}}, {{probe.hit}}, {{http.code}}, {{http.response}}, {{run.duration}}, {{probe.key}}, {{run.notes}}. Legacy tokens are also supported.",
    ),
} as const;
