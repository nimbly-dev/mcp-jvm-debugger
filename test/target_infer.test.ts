import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import test from "node:test";
import { inferTargets } from "../src/tools/target_infer";

async function createTempProject(files: Record<string, string>): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "target-infer-"));
  await Promise.all(
    Object.entries(files).map(async ([relPath, content]) => {
      const abs = path.join(root, relPath);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, content, "utf8");
    }),
  );
  return root;
}

test("inferTargets does not return unrelated line-only matches when textual hints are provided", async () => {
  const root = await createTempProject({
    "src/main/java/com/example/UnrelatedRepository.java": `
package com.example;
public class UnrelatedRepository {
  public void notTheMethod() {}
}
`,
  });

  const result = await inferTargets({
    rootAbs: root,
    classHint: "DynamoDbAccountSettingsRepository",
    methodHint: "putSettingsJson",
    lineHint: 41,
    maxCandidates: 5,
  });

  assert.equal(result.candidates.length, 0);
});
