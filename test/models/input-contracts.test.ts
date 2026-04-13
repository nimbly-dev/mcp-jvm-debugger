const assert = require("node:assert/strict");
const test = require("node:test");

const { RecipeGenerateInputSchema } = require("@/models/inputs/recipe_generate.input.model");
const { TargetInferInputSchema } = require("@/models/inputs/target_infer.input.model");
const z = require("zod/v4");

test("probe_recipe_create schema requires projectRootAbs", () => {
  const keys = Object.keys(RecipeGenerateInputSchema);
  assert.equal(keys.includes("projectRootAbs"), true);
  assert.equal(keys.includes("additionalSourceRoots"), true);
});

test("probe_target_infer schema requires projectRootAbs", () => {
  const keys = Object.keys(TargetInferInputSchema);
  assert.equal(keys.includes("projectRootAbs"), true);
  assert.equal(keys.includes("additionalSourceRoots"), true);
});

test("probe_recipe_create schema accepts regression_http_only and rejects regression_api_only", () => {
  const recipeSchema = z.object(RecipeGenerateInputSchema);
  const baseInput = {
    projectRootAbs: "C:\\repo\\service",
    classHint: "com.example.CatalogService",
    methodHint: "save",
  };
  const parsed = recipeSchema.safeParse({
    ...baseInput,
    intentMode: "regression_http_only",
  });
  assert.equal(parsed.success, true);

  const legacy = recipeSchema.safeParse({
    ...baseInput,
    intentMode: "regression_api_only",
  });
  assert.equal(legacy.success, false);
});
