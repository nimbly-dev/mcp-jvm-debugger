const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { MCP_ENV } = require("@/config/env-vars");
const { loadConfigFromEnvAndArgs } = require("@/config/server-config");

const MANAGED_ENV = [
  MCP_ENV.PROBE_BASE_URL,
  MCP_ENV.WORKSPACE_ROOT,
  "INIT_CWD",
  "PWD",
  "CODEX_WORKSPACE_ROOT",
  "CODEX_CWD",
] as const;

function withEnv(overrides: Record<string, string | undefined>, run: () => void): void {
  const before: Record<string, string | undefined> = {};
  for (const key of MANAGED_ENV) before[key] = process.env[key];

  for (const key of MANAGED_ENV) {
    const next = overrides[key];
    if (typeof next === "undefined") {
      delete process.env[key];
    } else {
      process.env[key] = next;
    }
  }

  try {
    run();
  } finally {
    for (const key of MANAGED_ENV) {
      const prev = before[key];
      if (typeof prev === "undefined") {
        delete process.env[key];
      } else {
        process.env[key] = prev;
      }
    }
  }
}

test("workspace root resolution prefers --workspace-root over env/session/cwd", () => {
  withEnv(
    {
      [MCP_ENV.PROBE_BASE_URL]: "http://127.0.0.1:9191",
      [MCP_ENV.WORKSPACE_ROOT]: "C:\\repo\\env-workspace",
      INIT_CWD: "C:\\repo\\session-workspace",
      PWD: "C:\\repo\\pwd-workspace",
      CODEX_WORKSPACE_ROOT: "C:\\repo\\codex-workspace",
    },
    () => {
      const cfg = loadConfigFromEnvAndArgs([
        "node",
        "server",
        "--workspace-root",
        "C:\\repo\\arg-workspace",
      ]);
      assert.equal(cfg.workspaceRootSource, "arg");
      assert.equal(cfg.workspaceRootAbs, path.resolve("C:\\repo\\arg-workspace"));
    },
  );
});

test("workspace root resolution uses MCP_WORKSPACE_ROOT when CLI arg is absent", () => {
  withEnv(
    {
      [MCP_ENV.PROBE_BASE_URL]: "http://127.0.0.1:9191",
      [MCP_ENV.WORKSPACE_ROOT]: "C:\\repo\\env-workspace",
      INIT_CWD: "C:\\repo\\session-workspace",
      PWD: "C:\\repo\\pwd-workspace",
    },
    () => {
      const cfg = loadConfigFromEnvAndArgs(["node", "server"]);
      assert.equal(cfg.workspaceRootSource, "env");
      assert.equal(cfg.workspaceRootAbs, path.resolve("C:\\repo\\env-workspace"));
    },
  );
});

test("workspace root resolution uses INIT_CWD then PWD when explicit config is absent", () => {
  withEnv(
    {
      [MCP_ENV.PROBE_BASE_URL]: "http://127.0.0.1:9191",
      [MCP_ENV.WORKSPACE_ROOT]: undefined,
      INIT_CWD: "C:\\repo\\session-workspace",
      PWD: "C:\\repo\\pwd-workspace",
    },
    () => {
      const cfg = loadConfigFromEnvAndArgs(["node", "server"]);
      assert.equal(cfg.workspaceRootSource, "session");
      assert.equal(cfg.workspaceRootAbs, path.resolve("C:\\repo\\session-workspace"));
    },
  );

  withEnv(
    {
      [MCP_ENV.PROBE_BASE_URL]: "http://127.0.0.1:9191",
      [MCP_ENV.WORKSPACE_ROOT]: undefined,
      INIT_CWD: undefined,
      PWD: "C:\\repo\\pwd-workspace",
    },
    () => {
      const cfg = loadConfigFromEnvAndArgs(["node", "server"]);
      assert.equal(cfg.workspaceRootSource, "session");
      assert.equal(cfg.workspaceRootAbs, path.resolve("C:\\repo\\pwd-workspace"));
    },
  );
});

test("workspace root resolution ignores CODEX_* and falls back to cwd", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-root-resolution-"));
  const originalCwd = process.cwd();
  try {
    process.chdir(tempRoot);
    withEnv(
      {
        [MCP_ENV.PROBE_BASE_URL]: "http://127.0.0.1:9191",
        [MCP_ENV.WORKSPACE_ROOT]: undefined,
        INIT_CWD: undefined,
        PWD: undefined,
        CODEX_WORKSPACE_ROOT: "C:\\repo\\codex-workspace",
        CODEX_CWD: "C:\\repo\\codex-cwd",
      },
      () => {
        const cfg = loadConfigFromEnvAndArgs(["node", "server"]);
        assert.equal(cfg.workspaceRootSource, "cwd");
        assert.equal(cfg.workspaceRootAbs, path.resolve(tempRoot));
      },
    );
  } finally {
    process.chdir(originalCwd);
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
