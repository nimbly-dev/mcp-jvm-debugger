import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { repoRootAbs } from "./social-platform-post.fixture";

const templateRootAbs = path.join(
  repoRootAbs,
  "test",
  "fixtures",
  "probe-recipe-inheritance-template",
);

export async function materializeProbeRecipeInheritanceFixture(): Promise<{
  workspaceRootAbs: string;
  childModuleRootAbs: string;
  cleanup: () => Promise<void>;
}> {
  const workspaceRootAbs = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-recipe-inherit-"));
  await fs.cp(templateRootAbs, workspaceRootAbs, { recursive: true });

  return {
    workspaceRootAbs,
    childModuleRootAbs: path.join(workspaceRootAbs, "child-module"),
    cleanup: async () => {
      await fs.rm(workspaceRootAbs, { recursive: true, force: true });
    },
  };
}
