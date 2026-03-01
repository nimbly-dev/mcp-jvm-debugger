"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const fs = __importStar(require("node:fs/promises"));
const os = __importStar(require("node:os"));
const path = __importStar(require("node:path"));
const node_test_1 = __importDefault(require("node:test"));
const recipe_template_1 = require("../src/lib/recipe_template");
const recipe_output_model_1 = require("../src/models/recipe_output_model");
const recipe_generate_1 = require("../src/tools/recipe_generate");
async function createTempProject(files) {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "recipe-generate-"));
    await Promise.all(Object.entries(files).map(async ([relPath, content]) => {
        const abs = path.join(root, relPath);
        await fs.mkdir(path.dirname(abs), { recursive: true });
        await fs.writeFile(abs, content, "utf8");
    }));
    return root;
}
(0, node_test_1.default)("generateRecipe returns natural execution plan when request mapping is inferred", async () => {
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
    const generated = await (0, recipe_generate_1.generateRecipe)({
        rootAbs: root,
        workspaceRootAbs: root,
        classHint: "CatalogSpecs",
        methodHint: "finalPriceLte",
        authLoginDiscoveryEnabled: false,
    });
    strict_1.default.equal(generated.executionPlan.mode, "natural");
    strict_1.default.equal(generated.executionPlan.actuatedSteps.length, 0);
    strict_1.default.ok(generated.executionPlan.naturalSteps.length >= 3);
    strict_1.default.equal(generated.requestCandidates.length, 1);
    strict_1.default.match(generated.executionPlan.naturalSteps.map((s) => s.title).join(" | "), /Execute natural request/);
});
(0, node_test_1.default)("generateRecipe falls back to actuated mode when natural request is unavailable", async () => {
    const root = await createTempProject({
        "src/main/java/com/example/CatalogSpecs.java": `
package com.example;
public class CatalogSpecs {
  public boolean finalPriceLte(String keyword) { return keyword != null; }
}
`,
    });
    const generated = await (0, recipe_generate_1.generateRecipe)({
        rootAbs: root,
        workspaceRootAbs: root,
        classHint: "CatalogSpecs",
        methodHint: "finalPriceLte",
        authLoginDiscoveryEnabled: false,
    });
    strict_1.default.equal(generated.requestCandidates.length, 0);
    strict_1.default.equal(generated.executionPlan.mode, "actuated");
    strict_1.default.match(generated.executionPlan.modeReason, /actuation is required/i);
    strict_1.default.deepEqual(generated.executionPlan.actuatedSteps.map((s) => s.phase), ["prepare", "verify", "cleanup"]);
});
(0, node_test_1.default)("template override changes rendering only and does not alter execution plan logic", async () => {
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
    const generated = await (0, recipe_generate_1.generateRecipe)({
        rootAbs: root,
        workspaceRootAbs: root,
        classHint: "CatalogSpecs",
        methodHint: "finalPriceLte",
        authLoginDiscoveryEnabled: false,
    });
    const executionPlanBefore = JSON.stringify(generated.executionPlan);
    const model = (0, recipe_output_model_1.buildRecipeTemplateModel)({
        classHint: "CatalogSpecs",
        methodHint: "finalPriceLte",
        generated,
    });
    const rendered = (0, recipe_template_1.renderRecipeTemplate)("MODE={{recipe.mode}}\nWHY={{recipe.mode_reason}}\n{{recipe.steps}}", model);
    strict_1.default.equal(JSON.stringify(generated.executionPlan), executionPlanBefore);
    strict_1.default.match(rendered, /^MODE=natural/m);
    strict_1.default.match(rendered, /Natural reproduction mode/);
    strict_1.default.match(rendered, /Execute natural request/);
});
//# sourceMappingURL=recipe_generate.test.js.map