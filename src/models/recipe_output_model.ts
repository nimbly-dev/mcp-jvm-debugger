import type { RecipeTemplateModel } from "../lib/recipe_template";
import type { generateRecipe } from "../tools/recipe_generate";
import { redactSecret } from "../utils/redaction.util";

type GeneratedRecipe = Awaited<ReturnType<typeof generateRecipe>>;

export function buildRecipeTemplateModel(args: {
  classHint: string;
  methodHint: string;
  lineHint?: number;
  generated: GeneratedRecipe;
}): RecipeTemplateModel {
  const { classHint, methodHint, lineHint, generated } = args;
  const inferredPath = generated.inferredTarget?.key
    ? generated.inferredTarget.key
    : `${classHint}.${methodHint}`;
  const firstReq = generated.requestCandidates[0];
  const requestDetails = firstReq
    ? `${firstReq.method} ${firstReq.fullUrlHint}`
    : "No request candidate inferred";
  const authHeaders = generated.auth.requestHeaders
    ? Object.entries(generated.auth.requestHeaders)
        .map(([k, v]) => `${k}: ${redactSecret(v)}`)
        .join("; ")
    : "Not provided";
  const authMissing = generated.auth.missing?.join(", ") ?? "-";
  const authLoginPath = generated.auth.loginHint?.path ?? "Not inferred";
  const authLoginBody = generated.auth.loginHint?.bodyTemplate ?? "Not inferred";

  return {
    "target.path": inferredPath,
    "target.class": classHint,
    "target.method": methodHint,
    "target.line_hint": typeof lineHint === "number" ? String(lineHint) : "Not provided",
    "probe.key": generated.inferredTarget?.key ?? "Not inferred",
    "probe.hit": "Not executed (recipe only)",
    "http.request": requestDetails,
    "http.method": firstReq?.method ?? "Not inferred",
    "http.path": firstReq?.path ?? "Not inferred",
    "http.query": firstReq?.queryTemplate ?? "Not inferred",
    "http.code": "Not executed",
    "http.response": "Not executed",
    execution_hit: "not_executed",
    api_outcome: "not_executed",
    repro_status: "recipe_only",
    "auth.required": String(generated.auth.required),
    "auth.status": generated.auth.status,
    "auth.strategy": generated.auth.strategy,
    "auth.next_action": generated.auth.nextAction,
    "auth.headers": authHeaders,
    "auth.missing": authMissing,
    "auth.source": generated.auth.source ?? "Not resolved",
    "auth.login.path": authLoginPath,
    "auth.login.body": authLoginBody,
    "run.duration": "Not measured",
    "run.notes": [...generated.notes, ...generated.auth.notes].join(" | ") || "-",
  };
}
