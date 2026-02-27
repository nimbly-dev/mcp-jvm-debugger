import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { AuthResolution } from "../models/auth_resolution.model";
import { inferBranchCondition } from "../utils/recipe.util";
import { resolveAuthForRecipe } from "./auth_resolve";
import { inferTargets } from "./target_infer";

type ParamType = {
  name: string;
  requestName: string;
  javaType?: string;
};

type RecipeCandidate = {
  method: "GET";
  path: string;
  queryTemplate: string;
  fullUrlHint: string;
  rationale: string[];
};

function sampleValueForType(javaType?: string): string {
  const t = (javaType ?? "").toLowerCase();
  if (t.includes("double") || t.includes("float") || t.includes("bigdecimal")) return "1000";
  if (t.includes("int") || t.includes("long")) return "1";
  if (t.includes("bool")) return "true";
  return "value";
}

function findControllerCallContext(text: string, methodName: string): {
  line: number;
  argName?: string;
  contextLines: string[];
} | null {
  const lines = text.split(/\r?\n/);
  const rx = new RegExp(`\\b${methodName}\\s*\\(\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*\\)`);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i]!.match(rx);
    if (!m) continue;
    const argName = m[1];
    const start = Math.max(0, i - 6);
    const end = Math.min(lines.length - 1, i + 2);
    const out: {
      line: number;
      argName?: string;
      contextLines: string[];
    } = {
      line: i + 1,
      contextLines: lines.slice(start, end + 1),
    };
    if (argName) out.argName = argName;
    return out;
  }
  return null;
}

function inferEndpointPath(text: string): string {
  const classReq = text.match(/@RequestMapping\s*\(\s*"([^"]+)"\s*\)/);
  const classBase = classReq?.[1] ?? "";

  const getReq =
    text.match(/@GetMapping\s*\(\s*"([^"]+)"\s*\)/) ??
    text.match(/@GetMapping\s*\(\s*value\s*=\s*"([^"]+)"\s*\)/);
  const sub = getReq?.[1] ?? "";

  const pathJoined = `${classBase}${sub}`;
  return pathJoined.startsWith("/") ? pathJoined : `/${pathJoined}`;
}

function parseRequestParamsFromController(text: string): ParamType[] {
  const out: ParamType[] = [];
  const rx =
    /@RequestParam(?:\s*\(\s*([^)]*)\s*\))?\s*(?:final\s+)?([A-Za-z0-9_<>\[\].?]+)\s+([A-Za-z_][A-Za-z0-9_]*)/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text)) !== null) {
    const annotationArgs = m[1];
    const javaType = m[2];
    const name = m[3];
    if (!name) continue;
    if (out.some((p) => p.name === name)) continue;
    let requestName = name;
    if (annotationArgs) {
      const named = annotationArgs.match(/\b(?:name|value)\s*=\s*"([^"]+)"/);
      const bare = annotationArgs.match(/"([^"]+)"/);
      if (named?.[1]) {
        requestName = named[1];
      } else if (bare?.[1]) {
        requestName = bare[1];
      }
    }
    const entry: ParamType = { name, requestName };
    if (javaType) entry.javaType = javaType;
    out.push(entry);
  }
  return out;
}

async function findOpenApiPathHint(rootAbs: string, paramName: string): Promise<string | null> {
  const candidates = [
    path.join(rootAbs, "docs", "openapi", "openapi.yaml"),
    path.join(rootAbs, "openapi.yaml"),
    path.join(rootAbs, "swagger.yaml"),
  ];
  for (const p of candidates) {
    let text = "";
    try {
      text = await fs.readFile(p, "utf8");
    } catch {
      continue;
    }
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i]!.includes(`name: ${paramName}`)) continue;
      for (let j = i; j >= 0; j--) {
        const line = lines[j]!;
        const m = line.match(/^\s{2}(\/[^:]+):\s*$/);
        if (m?.[1]) return m[1];
      }
    }
  }
  return null;
}

export async function generateRecipe(args: {
  rootAbs: string;
  workspaceRootAbs: string;
  classHint: string;
  methodHint: string;
  lineHint?: number;
  maxCandidates?: number;
  authToken?: string;
  authUsername?: string;
  authPassword?: string;
  authLoginDiscoveryEnabled: boolean;
}): Promise<{
  inferredTarget?: {
    key?: string;
    file: string;
    line?: number;
    confidence: number;
  };
  requestCandidates: RecipeCandidate[];
  auth: AuthResolution;
  notes: string[];
}> {
  const inferArgs: Parameters<typeof inferTargets>[0] = {
    rootAbs: args.rootAbs,
    classHint: args.classHint,
    methodHint: args.methodHint,
    maxCandidates: 1,
  };
  if (typeof args.lineHint === "number") inferArgs.lineHint = args.lineHint;
  const inferred = await inferTargets(inferArgs);
  const top = inferred.candidates[0];
  const unresolvedAuth: AuthResolution = {
    required: "unknown",
    status: "unknown",
    strategy: "unknown",
    nextAction: "No target inferred; cannot resolve auth strategy yet.",
    notes: ["No method candidate matched current hints."],
  };
  if (!top) {
    return {
      requestCandidates: [],
      auth: unresolvedAuth,
      notes: ["No matching method candidate inferred from current hints."],
    };
  }

  // Controller-focused heuristic: find a controller calling this specs method.
  const controllerFiles = await inferTargets({
    rootAbs: args.rootAbs,
    classHint: "Controller",
    maxCandidates: 50,
  });

  const chosenControllers = controllerFiles.candidates
    .map((c) => c.file)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 50);

  let bestRequest: RecipeCandidate | undefined;
  let matchedControllerFile: string | undefined;
  let matchedBranchCondition: string | undefined;
  for (const file of chosenControllers) {
    let text = "";
    try {
      text = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }
    const call = findControllerCallContext(text, args.methodHint);
    if (!call) continue;

    const params = parseRequestParamsFromController(text);
    const endpoint = inferEndpointPath(text);
    const arg = call.argName;
    const argParam = params.find((p) => p.name === arg);
    const requestParamName = argParam?.requestName ?? arg;

    const queryParts: string[] = [];
    if (requestParamName) {
      queryParts.push(`${requestParamName}=${sampleValueForType(argParam?.javaType)}`);
    }
    // Common page params for pageable endpoints.
    if (params.some((p) => p.name === "page")) queryParts.push("page=0");
    if (params.some((p) => p.name === "size")) queryParts.push("size=1");

    // Heuristic for else-if price branches: if finalPriceLte uses maxPrice, omit minPrice.
    const ctx = call.contextLines.join("\n");
    if (/else\s+if\s*\(\s*maxPrice\s*!=\s*null/.test(ctx) && /minPrice/.test(ctx)) {
      queryParts.push("minPrice=<omit>");
    }
    matchedBranchCondition = inferBranchCondition(call.contextLines);

    const openapiPath = requestParamName
      ? await findOpenApiPathHint(args.rootAbs, requestParamName)
      : null;
    const pathHint = openapiPath ?? endpoint;

    bestRequest = {
      method: "GET",
      path: pathHint,
      queryTemplate: queryParts.join("&"),
      fullUrlHint: `${pathHint}?${queryParts.filter((q) => !q.endsWith("<omit>")).join("&")}`,
      rationale: [
        `Controller call matched: ${args.methodHint}(${arg ?? "?"})`,
        `Inferred endpoint path: ${pathHint}`,
        `Inferred request param: ${requestParamName ?? "(unknown)"}`,
        ...(matchedBranchCondition
          ? [`Branch condition context: ${matchedBranchCondition}`]
          : []),
      ],
    };
    matchedControllerFile = file;
    break;
  }

  const inferredTarget: {
    key?: string;
    file: string;
    line?: number;
    confidence: number;
  } = {
    file: top.file,
    confidence: top.confidence,
  };
  if (top.key) inferredTarget.key = top.key;
  if (typeof top.line === "number") inferredTarget.line = top.line;
  const auth: AuthResolution =
    bestRequest || matchedControllerFile
      ? await resolveAuthForRecipe({
          projectRootAbs: args.rootAbs,
          workspaceRootAbs: args.workspaceRootAbs,
          endpointPath: bestRequest?.path,
          controllerFileAbs: matchedControllerFile,
          authToken: args.authToken,
          authUsername: args.authUsername,
          authPassword: args.authPassword,
          loginDiscoveryEnabled: args.authLoginDiscoveryEnabled,
        })
      : {
          required: "unknown",
          status: "needs_user_input",
          strategy: "unknown",
          missing: ["authToken"],
          nextAction:
            "Entrypoint/auth requirements could not be inferred. Ask user for authToken (Bearer) or confirm no auth is required.",
          notes: [
            "No controller->method mapping was inferred, so route-level auth inference is unavailable.",
            "Automatic credential discovery is disabled; credentials must be provided explicitly.",
          ],
        };

  const baseNotes = bestRequest
    ? []
    : ["No controller call mapping found; use inferred key with manual endpoint discovery."];
  if (typeof args.lineHint === "number") {
    baseNotes.push(
      "Probe key granularity is method-level (Class#method). A line pause requires matching branch conditions.",
    );
    if (typeof inferredTarget.line === "number" && inferredTarget.line !== args.lineHint) {
      baseNotes.push(
        `Provided line hint (${args.lineHint}) differs from inferred method start (${inferredTarget.line}).`,
      );
    }
  }
  if (matchedBranchCondition) {
    baseNotes.push(`Line/branch precondition hint: ${matchedBranchCondition}`);
  }

  return {
    inferredTarget,
    requestCandidates: bestRequest ? [bestRequest] : [],
    auth,
    notes: baseNotes,
  };
}
