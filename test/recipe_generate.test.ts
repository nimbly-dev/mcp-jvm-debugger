import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import test from "node:test";
import { renderRecipeTemplate } from "../src/lib/recipe_template";
import { buildRecipeTemplateModel } from "../src/models/recipe_output_model";
import { generateRecipe } from "../src/tools/recipe_generate";

async function createTempProject(files: Record<string, string>): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "recipe-generate-"));
  await Promise.all(
    Object.entries(files).map(async ([relPath, content]) => {
      const abs = path.join(root, relPath);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, content, "utf8");
    }),
  );
  return root;
}

test("generateRecipe returns natural execution plan when request mapping is inferred", async () => {
  const root = await createTempProject({
    "src/main/java/com/example/CatalogSpecs.java": `
package com.example;
public class CatalogSpecs {
  public boolean finalPriceLte(String keyword) { return keyword != null; }
}
`,
    "src/main/java/com/example/CatalogController.java": `
package com.example;
@RequestMapping("/catalog")
public class CatalogController {
  private final CatalogSpecs specs = new CatalogSpecs();
  @GetMapping("/items")
  public Object list(@RequestParam("keyword") String keyword) { return specs.finalPriceLte(keyword); }
}
`,
  });

  const generated = await generateRecipe({
    rootAbs: root,
    workspaceRootAbs: root,
    classHint: "CatalogSpecs",
    methodHint: "finalPriceLte",
    authLoginDiscoveryEnabled: false,
  });

  assert.equal(generated.executionPlan.mode, "natural");
  assert.equal(generated.executionPlan.actuatedSteps.length, 0);
  assert.ok(generated.executionPlan.naturalSteps.length >= 3);
  assert.equal(generated.requestCandidates.length, 1);
  assert.match(
    generated.executionPlan.naturalSteps.map((s) => s.title).join(" | "),
    /Execute natural request/,
  );
});

test("generateRecipe infers natural PATCH endpoint across core->service->controller modules", async () => {
  const workspaceRoot = await createTempProject({
    "service-core/src/main/java/com/example/repository/dynamo/DynamoDbAccountSettingsRepository.java": `
package com.example.repository.dynamo;
public class DynamoDbAccountSettingsRepository {
  public void putSettingsJson(String userId, String settingsJson) {}
}
`,
    "service-core/src/main/java/com/example/service/AccountSettingsService.java": `
package com.example.service;
import com.example.repository.dynamo.DynamoDbAccountSettingsRepository;
public class AccountSettingsService {
  private final DynamoDbAccountSettingsRepository repository = new DynamoDbAccountSettingsRepository();
  public void update(String userId, String settingsJson) {
    repository.putSettingsJson(userId, settingsJson);
  }
}
`,
    "service-web/src/main/java/com/example/web/controller/UserAccountSettingsController.java": `
package com.example.web.controller;
import com.example.service.AccountSettingsService;
@RequestMapping("/user-accounts")
public class UserAccountSettingsController {
  private final AccountSettingsService service = new AccountSettingsService();
  @PatchMapping("/settings")
  public void updateAccountSettings(@RequestParam("userId") String userId, String settingsJson) {
    service.update(userId, settingsJson);
  }
}
`,
    "docs/openapi/openapi.yaml": `
openapi: 3.0.0
paths:
  /user-accounts/settings:
    patch:
      operationId: updateAccountSettings
      parameters:
        - in: query
          name: userId
          schema:
            type: string
`,
  });

  const generated = await generateRecipe({
    rootAbs: path.join(workspaceRoot, "service-core"),
    workspaceRootAbs: workspaceRoot,
    classHint: "DynamoDbAccountSettingsRepository",
    methodHint: "putSettingsJson",
    lineHint: 41,
    authLoginDiscoveryEnabled: false,
  });

  assert.equal(generated.executionPlan.mode, "natural");
  assert.equal(generated.requestCandidates.length, 1);
  assert.equal(generated.requestCandidates[0]?.method, "PATCH");
  assert.equal(generated.requestCandidates[0]?.path, "/user-accounts/settings");
  assert.match(generated.requestCandidates[0]?.fullUrlHint ?? "", /userId=value/);
});

test("generateRecipe falls back to actuated mode when natural request is unavailable", async () => {
  const root = await createTempProject({
    "src/main/java/com/example/CatalogSpecs.java": `
package com.example;
public class CatalogSpecs {
  public boolean finalPriceLte(String keyword) { return keyword != null; }
}
`,
  });

  const generated = await generateRecipe({
    rootAbs: root,
    workspaceRootAbs: root,
    classHint: "CatalogSpecs",
    methodHint: "finalPriceLte",
    authLoginDiscoveryEnabled: false,
  });

  assert.equal(generated.requestCandidates.length, 0);
  assert.equal(generated.executionPlan.mode, "actuated");
  assert.match(generated.executionPlan.modeReason, /actuation is required/i);
  assert.deepEqual(
    generated.executionPlan.actuatedSteps.map((s) => s.phase),
    ["prepare", "verify", "cleanup"],
  );
});

test("template override changes rendering only and does not alter execution plan logic", async () => {
  const root = await createTempProject({
    "src/main/java/com/example/CatalogSpecs.java": `
package com.example;
public class CatalogSpecs {
  public boolean finalPriceLte(String keyword) { return keyword != null; }
}
`,
    "src/main/java/com/example/CatalogController.java": `
package com.example;
@RequestMapping("/catalog")
public class CatalogController {
  private final CatalogSpecs specs = new CatalogSpecs();
  @GetMapping("/items")
  public Object list(@RequestParam("keyword") String keyword) { return specs.finalPriceLte(keyword); }
}
`,
  });

  const generated = await generateRecipe({
    rootAbs: root,
    workspaceRootAbs: root,
    classHint: "CatalogSpecs",
    methodHint: "finalPriceLte",
    authLoginDiscoveryEnabled: false,
  });
  const executionPlanBefore = JSON.stringify(generated.executionPlan);

  const model = buildRecipeTemplateModel({
    classHint: "CatalogSpecs",
    methodHint: "finalPriceLte",
    generated,
  });
  const rendered = renderRecipeTemplate(
    "MODE={{recipe.mode}}\nWHY={{recipe.mode_reason}}\n{{recipe.steps}}",
    model,
  );

  assert.equal(JSON.stringify(generated.executionPlan), executionPlanBefore);
  assert.match(rendered, /^MODE=natural/m);
  assert.match(rendered, /Natural reproduction mode/);
  assert.match(rendered, /Execute natural request/);
});
