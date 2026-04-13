import assert from "node:assert/strict";
import test from "node:test";

import { materializeProbeRecipeInheritanceFixture } from "../support/spring/probe-recipe-inheritance.fixture";
import { startMcpClient } from "../support/spring/social-platform-post.fixture";

test("mcp IT: probe_recipe_create returns inherited-class guidance for zero-method child module", async () => {
  const fixture = await materializeProbeRecipeInheritanceFixture();
  let mcp: Awaited<ReturnType<typeof startMcpClient>> | undefined;

  try {
    mcp = await startMcpClient({
      workspaceRootAbs: fixture.workspaceRootAbs,
      probeBaseUrl: "http://127.0.0.1:9191",
    });

    const result = (await mcp.client.callTool({
      name: "probe_recipe_create",
      arguments: {
        projectRootAbs: fixture.childModuleRootAbs,
        classHint: "com.example.recipe.child.AppController",
        methodHint: "listApps",
        intentMode: "regression_http_only",
      },
    })) as any;

    assert.equal(result.structuredContent.resultType, "report");
    assert.equal(result.structuredContent.status, "target_not_inferred");
    assert.equal(result.structuredContent.reasonCode, "target_candidate_missing");
    assert.equal(result.structuredContent.failedStep, "target_inference");
    assert.equal(
      result.structuredContent.nextAction,
      "Matched class has no method bodies in projectRootAbs. If methods are inherited, use parent module/source roots.",
    );
    assert.equal(
      result.structuredContent.attemptedStrategies.includes("class_inventory_exact_match"),
      true,
    );
    assert.equal(result.structuredContent.evidence.includes("class_match=exact"), true);
    assert.equal(result.structuredContent.evidence.includes("method_bodies=0"), true);
  } finally {
    await mcp?.close();
    await fixture.cleanup();
  }
});
